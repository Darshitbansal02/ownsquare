import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { openTestDatabase } from "../utils/testHarness.js";
import { COOKIE_NAME } from "../utils/refreshCookie.js";

const JWT_SECRET = "auth_integration_secret_value_32_chars";
const CLIENT_URL = "http://localhost:5173";
const baseEnv = {
  nodeEnv: "test", clientUrl: CLIENT_URL, jwt: { secret: JWT_SECRET, expiresIn: "15m" },
  features: { kyc: true, withdrawals: true, enquiries: true, notifications: true,
    passwordReset: false, ownershipCap: true },
  payment: { provider: "mock", secret: "auth_test_mock_secret_at_least_32_chars" },
  cloudinary: {}
};
const mediaStub = {
  async upload() { throw new Error("unused"); },
  async resource() { throw new Error("unused"); },
  url(asset) { return `https://media.example.test/${asset.public_id}`; }
};
const investor = () => ({ name: "Aman Demo", email: `aman-${randomUUID()}@example.test`,
  phone: "9999999999", password: "Invest@123", role: "INVESTOR" });
// Express percent-encodes the cookie value, so match on the attribute name rather than a prefix.
const cookieOf = (response) => response.headers["set-cookie"]?.find((value) => value.includes(COOKIE_NAME));

describe("authentication (AUTH-1, AUTH-2, AUTH-4)", () => {
  let db; let app; let shutdown;
  beforeEach(async () => {
    db = await openTestDatabase();
    ({ app } = createApp({ env: baseEnv, db, mediaAdapter: mediaStub, logger: { error() {} } }));
    shutdown = db.close;
  });
  afterEach(async () => shutdown());

  it("registers an investor and returns a user, access token and refresh cookie", async () => {
    const body = investor();
    const response = await request(app).post("/api/v1/auth/register").send(body);
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.role).toBe("INVESTOR");
    expect(response.body.data.user).not.toHaveProperty("passwordHash");
    expect(response.body.data.expiresIn).toBe(900);
    expect(cookieOf(response)).toBeTruthy();
    // The refresh cookie must never be readable from page scripts.
    expect(cookieOf(response)).toContain("HttpOnly");
  });

  it("refuses to self-register an admin", async () => {
    const response = await request(app).post("/api/v1/auth/register")
      .send({ ...investor(), role: "ADMIN" });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects a weak password and an unknown field", async () => {
    const weak = await request(app).post("/api/v1/auth/register").send({ ...investor(), password: "short" });
    expect(weak.status).toBe(400);
    const unknown = await request(app).post("/api/v1/auth/register")
      .send({ ...investor(), isActive: false });
    expect(unknown.status).toBe(400);
  });

  it("stores a bcrypt hash rather than the password", async () => {
    const body = investor();
    await request(app).post("/api/v1/auth/register").send(body);
    const stored = await db.models.User.findOne({ email: body.email }).select("+passwordHash");
    expect(stored.passwordHash).not.toBe(body.password);
    expect(stored.passwordHash.startsWith("$2")).toBe(true);
    expect(await bcrypt.compare(body.password, stored.passwordHash)).toBe(true);
  });

  it("rejects a duplicate email with a conflict", async () => {
    const body = investor();
    await request(app).post("/api/v1/auth/register").send(body);
    const again = await request(app).post("/api/v1/auth/register").send(body);
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe("EMAIL_ALREADY_EXISTS");
  });

  it("logs in with valid credentials and rejects a wrong password identically to an unknown email", async () => {
    const body = investor();
    await request(app).post("/api/v1/auth/register").send(body);
    const good = await request(app).post("/api/v1/auth/login").send({ email: body.email, password: body.password });
    expect(good.status).toBe(200);
    expect(good.body.data.accessToken).toBeTruthy();

    const wrong = await request(app).post("/api/v1/auth/login").send({ email: body.email, password: "Wrong@123" });
    const unknown = await request(app).post("/api/v1/auth/login")
      .send({ email: `nobody-${randomUUID()}@example.test`, password: "Wrong@123" });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    // Identical code and message: the response must not disclose which part was wrong.
    expect(wrong.body.error.code).toBe(unknown.body.error.code);
    expect(wrong.body.error.message).toBe(unknown.body.error.message);
  });

  it("refuses login for a deactivated account", async () => {
    const body = investor();
    await request(app).post("/api/v1/auth/register").send(body);
    await db.models.User.updateOne({ email: body.email }, { $set: { isActive: false } });
    const response = await request(app).post("/api/v1/auth/login").send({ email: body.email, password: body.password });
    expect(response.status).toBe(401);
  });

  it("returns the persisted current user from /auth/me and never a token claim", async () => {
    const body = investor();
    const registered = await request(app).post("/api/v1/auth/register").send(body);
    const token = registered.body.data.accessToken;
    const me = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe(body.email);
    expect(me.body.data).not.toHaveProperty("passwordHash");

    // A role change in the database must take effect on the very next request.
    await db.models.User.updateOne({ email: body.email }, { $set: { role: "ADMIN" } });
    const after = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${token}`);
    expect(after.body.data.role).toBe("ADMIN");
  });

  it("invalidates an issued access token after logout", async () => {
    const body = investor();
    const registered = await request(app).post("/api/v1/auth/register").send(body);
    const token = registered.body.data.accessToken;
    const cookie = cookieOf(registered);
    expect((await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${token}`)).status).toBe(200);

    const loggedOut = await request(app).post("/api/v1/auth/logout")
      .set("Authorization", `Bearer ${token}`).set("Cookie", cookie).send({});
    expect(loggedOut.status).toBe(200);
    expect(loggedOut.body.data.loggedOut).toBe(true);

    const after = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${token}`);
    expect(after.status).toBe(401);
  });

  it("rotates the refresh token once and rejects the replayed original", async () => {
    const body = investor();
    const registered = await request(app).post("/api/v1/auth/register").send(body);
    const first = cookieOf(registered);

    const refreshed = await request(app).post("/api/v1/auth/refresh").set("Cookie", first).send({});
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.data.accessToken).toBeTruthy();
    const second = cookieOf(refreshed);
    expect(second).toBeTruthy();

    // Replaying the consumed token must fail, not mint a third session.
    const replay = await request(app).post("/api/v1/auth/refresh").set("Cookie", first).send({});
    expect(replay.status).toBe(401);
    // Reuse detection revokes the whole family, so the rotated token dies too.
    const afterReuse = await request(app).post("/api/v1/auth/refresh").set("Cookie", second).send({});
    expect(afterReuse.status).toBe(401);
  });

  it("refuses a refresh request from a foreign origin", async () => {
    const registered = await request(app).post("/api/v1/auth/register").send(investor());
    const response = await request(app).post("/api/v1/auth/refresh")
      .set("Cookie", cookieOf(registered)).set("Origin", "https://evil.example").send({});
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("revokes refresh tokens when the account is deactivated", async () => {
    const body = investor();
    const registered = await request(app).post("/api/v1/auth/register").send(body);
    const cookie = cookieOf(registered);
    await db.models.User.updateOne({ email: body.email }, { $set: { isActive: false } });
    const response = await request(app).post("/api/v1/auth/refresh").set("Cookie", cookie).send({});
    expect(response.status).toBe(401);
  });

  it("reports password reset as disabled rather than pretending to send mail", async () => {
    const response = await request(app).post("/api/v1/auth/forgot-password")
      .send({ email: `someone-${randomUUID()}@example.test` });
    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe("FEATURE_DISABLED");
  });

  it("rate limits repeated credential attempts", async () => {
    const body = investor();
    await request(app).post("/api/v1/auth/register").send(body);
    let limited = false;
    for (let attempt = 0; attempt < 25 && !limited; attempt += 1) {
      const response = await request(app).post("/api/v1/auth/login")
        .send({ email: body.email, password: `Wrong@${attempt}` });
      limited = response.status === 429;
    }
    expect(limited).toBe(true);
  });

  it("blocks a non-investor from investor-only routes using their own token", async () => {
    const broker = await request(app).post("/api/v1/auth/register").send({ ...investor(), role: "BROKER" });
    const response = await request(app).get("/api/v1/investments/me")
      .set("Authorization", `Bearer ${broker.body.data.accessToken}`);
    expect(response.status).toBe(403);
  });
});

describe("password reset when enabled (AUTH-3)", () => {
  let db; let app; let shutdown; let sent;
  const env = { ...baseEnv, features: { ...baseEnv.features, passwordReset: true },
    smtp: { host: "smtp.example.test", port: 587, secure: false, user: "u", pass: "p", from: "no-reply@example.test" } };
  const mailer = { async sendMail(message) { sent.push(message); } };

  beforeEach(async () => {
    sent = [];
    db = await openTestDatabase();
    ({ app } = createApp({ env, db, mediaAdapter: mediaStub, mailer, logger: { error() {} } }));
    shutdown = db.close;
  });
  afterEach(async () => shutdown());

  it("does not disclose whether an account exists", async () => {
    const known = await request(app).post("/api/v1/auth/forgot-password").send({ email: `x-${randomUUID()}@example.test` });
    const unknown = await request(app).post("/api/v1/auth/forgot-password").send({ email: `y-${randomUUID()}@example.test` });
    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(known.body).toEqual(unknown.body);
  });

  it("sends a reset link and consumes the token exactly once", async () => {
    const body = investor();
    await request(app).post("/api/v1/auth/register").send(body);
    await request(app).post("/api/v1/auth/forgot-password").send({ email: body.email });
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe(body.email);
    const token = /\/reset-password\/([a-f0-9]{64})$/.exec(sent[0].text)[1];

    const reset = await request(app).post(`/api/v1/auth/reset-password/${token}`).send({ password: "Changed@123" });
    expect(reset.status).toBe(200);

    const login = await request(app).post("/api/v1/auth/login").send({ email: body.email, password: "Changed@123" });
    expect(login.status).toBe(200);

    const replay = await request(app).post(`/api/v1/auth/reset-password/${token}`).send({ password: "Another@123" });
    expect(replay.status).toBe(400);
    expect(replay.body.error.code).toBe("INVALID_RESET_TOKEN");
  });

  it("invalidates existing sessions after a password reset", async () => {
    const body = investor();
    const registered = await request(app).post("/api/v1/auth/register").send(body);
    const token = registered.body.data.accessToken;
    await request(app).post("/api/v1/auth/forgot-password").send({ email: body.email });
    const token2 = /\/reset-password\/([a-f0-9]{64})$/.exec(sent[0].text)[1];
    await request(app).post(`/api/v1/auth/reset-password/${token2}`).send({ password: "Changed@123" });
    const after = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${token}`);
    expect(after.status).toBe(401);
  });

  it("stores only a hash of the reset token", async () => {
    const body = investor();
    await request(app).post("/api/v1/auth/register").send(body);
    await request(app).post("/api/v1/auth/forgot-password").send({ email: body.email });
    const stored = await db.models.User.findOne({ email: body.email }).select("+resetTokenHash");
    expect(stored.resetTokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(sent[0].text).not.toContain(stored.resetTokenHash);
  });
});
