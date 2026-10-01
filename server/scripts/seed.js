import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { loadEnvironment } from "../src/config/env.js";
import { connectDatabase } from "../src/config/db.js";
import { createBackendServices } from "../src/utils/backendServices.js";
import { password as passwordPolicy } from "../src/validators/auth.schema.js";
import { multiply, sum } from "../src/utils/money.js";

const BCRYPT_ROUNDS = 12;
const SETTINGS_KEY = "platform";

// Deterministic UUID-shaped idempotency keys let a re-run replay instead of buying twice.
function stableKey(...parts) {
  const hex = crypto.createHash("sha256").update(parts.join("|")).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

const SEED_PHOTOS = [
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80"
];

const image = (ownerId, index, label) => ({
  url: SEED_PHOTOS[index % SEED_PHOTOS.length],
  publicId: `ownsquare/property/${ownerId}/${crypto.randomUUID()}`,
  name: label
});

// Two brokers exist so ownership isolation can be tested: a broker must never see or edit
// another broker's assets. Five investors cover the ownership-cap and payout scenarios.
const ACCOUNTS = [
  ["admin", "Demo Admin", "ADMIN"],
  ["rohit", "Rohit Broker", "BROKER"],
  ["other-broker", "Second Broker", "BROKER"],
  ["aman", "Aman Investor", "INVESTOR"],
  ["priya", "Priya Investor", "INVESTOR"],
  ["karan", "Karan Investor", "INVESTOR"],
  ["isha", "Isha Investor", "INVESTOR"],
  ["neha", "Neha Investor", "INVESTOR"]
];

// valuation/totalUnits in paise. Unit price must be a whole rupee and divide exactly.
const TARGETS = [
  { city: "Noida", state: "Uttar Pradesh", status: "LIVE", units: [20, 50, 0, 0, 0] },
  { city: "Bengaluru", state: "Karnataka", status: "LIVE", units: [0, 0, 200, 100, 0] },
  { city: "Pune", state: "Maharashtra", status: "FUNDED", units: [20, 50, 400, 300, 230] },
  { city: "Hyderabad", state: "Telangana", status: "HOLDING", units: [20, 50, 400, 300, 230] },
  { city: "Noida", state: "Uttar Pradesh", status: "SOLD", units: [20, 50, 400, 300, 230] },
  { city: "Chennai", state: "Tamil Nadu", status: "PENDING_APPROVAL", units: null },
  { city: "Mumbai", state: "Maharashtra", status: "REJECTED", units: null,
    rejectionReason: "Academic review: please attach a readable valuation certificate." },
  { city: "Kolkata", state: "West Bengal", status: "DRAFT", units: null }
];

export async function seedDemo(env, db, services, source = process.env) {
  const { models } = db;
  const { User, Property, Investment, Transaction, Payout, Settings, Withdrawal } = models;

  // Passwords come from the raw environment, never from validated config, and are never logged.
  for (const key of ["SEED_ADMIN_PASSWORD", "SEED_BROKER_PASSWORD", "SEED_INVESTOR_PASSWORD"]) {
    passwordPolicy.parse(source[key]);
  }

  // Accounts are created once and then left alone, so a re-run cannot silently rewrite
  // an operator's chosen password or resurrect a deactivated user.
  const people = [];
  for (const [prefix, name, role] of ACCOUNTS) {
    const email = `${prefix}@demo.com`;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name, email, phone: "9999999999", role, isActive: true,
        passwordHash: await bcrypt.hash(source[`SEED_${role}_PASSWORD`], BCRYPT_ROUNDS),
        // Seeded investors are pre-approved so the demo does not stall on an approval queue.
        ...(role === "INVESTOR" ? { kyc: { status: "APPROVED", docs: [], selfie: null, reason: null } } : {})
      });
    } else if (user.role !== role) {
      throw new Error(`Existing fixture ${email} has role ${user.role}, expected ${role}. Fix or remove it manually.`);
    }
    people.push(user);
  }
  const [admin, rohit, otherBroker] = people;
  const investors = people.slice(3);

  // Settings must exist before any funding: commission and payout both read it, and the
  // platform fee is credited to a configured ADMIN accounting account.
  const settings = await Settings.findOneAndUpdate({ singletonKey: SETTINGS_KEY },
    { $setOnInsert: { platformFeePct: env.seedRates.platformFeePct,
      brokerCommissionPct: env.seedRates.brokerCommissionPct,
      maxOwnershipPct: env.seedRates.maxOwnershipPct } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true });
  if (String(settings.feeAccountUserId ?? "") !== String(admin._id)) {
    await Settings.updateOne({ _id: settings._id }, { $set: { feeAccountUserId: admin._id } });
  }
  if (settings.maxOwnershipPct < 40) {
    throw new Error("Seed needs an ownership cap of at least 40% to hold 40% of a property. Adjust /admin/settings.");
  }

  for (const broker of [rohit, otherBroker]) {
    if (!broker.brokerApproved) await services.admin.updateUser(admin._id, String(broker._id), { brokerApproved: true });
  }

  // Top up through the real mock gateway so TOPUP rows carry genuine provider identifiers.
  // The requirement is derived from the fixture plan so it cannot drift out of date: an
  // investor must be able to afford every planned purchase without a mid-seed shortfall.
  const UNIT_PRICE = 1000000000 / 1000;
  const plannedSpend = investors.map((_, position) =>
    sum(TARGETS.map((target) => (target.units?.[position] ?? 0) * UNIT_PRICE), "plannedSpend"));
  for (const [position, investor] of investors.entries()) {
    // Top up exactly once. Keying off an existing TOPUP rather than the current balance keeps a
    // re-run from adding money again after sale proceeds have landed in the wallet.
    if (await Transaction.exists({ userId: investor._id, type: "TOPUP" })) continue;
    const order = await services.wallet.order(investor._id, plannedSpend[position]);
    await services.wallet.verify(investor._id, {
      gatewayOrderId: order.gatewayOrderId,
      gatewayPaymentId: order.checkout.gatewayPaymentId,
      mockOrderToken: order.checkout.mockOrderToken
    });
  }

  const properties = [];
  for (const [index, target] of TARGETS.entries()) {
    const broker = index % 2 === 0 ? rohit : otherBroker;
    const title = `OwnSquare demo ${index + 1}: ${target.city} ${index === 4 ? "(sold)" : ""}`.trim();
    let property = await Property.findOne({ title, brokerId: broker._id });
    const valuation = 1000000000;
    const totalUnits = 1000;

    if (!property) {
      // Assets that will be funded are created LIVE and moved onward by the real services,
      // so FUNDED is only ever reached by genuine 100% funding, never asserted directly.
      const funded = ["LIVE", "FUNDED", "HOLDING", "SOLD"].includes(target.status);
      property = await Property.create({
        title,
        description: `Academic demo listing in ${target.city} offered for fractional ownership. `
          + "No real money, property or securities are involved in this demonstration.",
        type: index === 6 ? "COMMERCIAL" : "APARTMENT",
        address: `Demo block ${index + 1}, ${target.city}`, city: target.city, state: target.state,
        pincode: "201310", geo: { lat: 28.41, lng: 77.48 }, areaSqft: 1200 + index * 100,
        images: [0, 1, 2].map((slot) => image(broker._id, index * 3 + slot, `Photo ${slot + 1}`)),
        documents: [],
        valuation, totalUnits, unitPrice: valuation / totalUnits, minUnits: 1,
        expectedAppreciationPct: 12, rentalYieldPct: 3, holdingPeriodMonths: 24,
        createdBy: broker._id, brokerId: broker._id,
        status: funded ? "LIVE" : target.status,
        rejectionReason: target.rejectionReason ?? null,
        liveAt: funded ? new Date("2026-09-01T06:30:00Z") : null,
        approvedBy: funded || target.status === "REJECTED" ? admin._id : null,
        unitsSold: 0, version: 0
      });
    }

    if (target.units) {
      for (const [position, investor] of investors.entries()) {
        const units = target.units[position];
        if (!units) continue;
        // Replaying the same key returns the original result without buying again.
        await services.investments.invest(investor._id,
          { propertyId: String(property._id), units },
          stableKey("ownsquare-seed-v1", String(property._id), String(investor._id)));
      }
      property = await Property.findById(property._id);

      // A sale can only be executed from HOLDING, so both HOLDING and SOLD targets must
      // pass through acquisition first. The service enforces that order.
      if (["HOLDING", "SOLD"].includes(target.status) && property.status === "FUNDED") {
        await services.lifecycle.changeStatus(admin._id, String(property._id), "HOLDING");
        property = await Property.findById(property._id);
      }
      if (target.status === "SOLD" && property.status === "HOLDING") {
        await services.payouts.execute(admin._id, String(property._id),
          { salePrice: 1400000000, expectedPlatformFeePct: env.seedRates.platformFeePct });
        property = await Property.findById(property._id);
      }
    }
    properties.push(property);
  }

  // Reconcile every financial invariant before reporting success. A seed that looks right
  // but does not add up is worse than no seed at all.
  for (const user of people) {
    const entries = await Transaction.find({ userId: user._id }).sort({ walletVersion: 1 });
    let running = 0;
    for (const entry of entries) {
      running += entry.direction === "CREDIT" ? entry.amount : -entry.amount;
      if (running !== entry.balanceAfter) throw new Error(`Ledger sequence does not reconcile for ${user.email}`);
    }
    if (running !== (await User.findById(user._id)).walletBalance) {
      throw new Error(`Wallet cache does not reconcile with the ledger for ${user.email}`);
    }
  }
  for (const property of properties) {
    const holdings = await Investment.find({ propertyId: property._id, status: { $ne: "REFUNDED" } });
    const held = sum(holdings.map((row) => row.units), "units");
    const heldPaise = sum(holdings.map((row) => row.amount), "amount");
    // unitsSold is maintained by the investment service; the ledger must agree with it exactly.
    if (held !== property.unitsSold) throw new Error(`Seed inventory does not reconcile for ${property.title}`);
    if (heldPaise !== multiply(held, property.unitPrice)) {
      throw new Error(`Seed principal does not reconcile for ${property.title}`);
    }
    // Only fully funded assets may sit in these states.
    if (["FUNDED", "HOLDING", "SOLD"].includes(property.status) && property.unitsSold !== property.totalUnits) {
      throw new Error(`${property.title} is ${property.status} but only ${property.unitsSold}/${property.totalUnits} units sold`);
    }
    const payout = await Payout.findOne({ propertyId: property._id });
    if (property.status === "SOLD") {
      if (!payout) throw new Error(`Sold property ${property.title} has no payout document`);
      if (sum(payout.items.map((item) => item.amount), "payout") + payout.platformFee !== payout.salePrice) {
        throw new Error(`Seed payout does not reconcile for ${property.title}`);
      }
      const exited = await Investment.countDocuments({ propertyId: property._id, status: "EXITED" });
      if (exited !== holdings.length) throw new Error(`Sold property ${property.title} has unclosed investments`);
    }
    // A LIVE asset must never be oversold.
    if (property.unitsSold > property.totalUnits) {
      throw new Error(`${property.title} is oversold`);
    }
  }
  if (await Withdrawal.countDocuments({ status: "PENDING" })) {
    throw new Error("Seed expects no pending withdrawal requests");
  }

  return {
    credentials: people.map((user) => ({ role: user.role, email: user.email,
      password: `<SEED_${user.role}_PASSWORD>` })),
    properties: properties.map((property) => ({
      title: property.title, status: property.status,
      unitsSold: property.unitsSold, totalUnits: property.totalUnits
    }))
  };
}

export async function runSeed(source = process.env) {
  const env = loadEnvironment(source);
  if (env.nodeEnv === "production") throw new Error("Refusing to seed a production environment");
  const db = await connectDatabase(env.mongoUri);
  try {
    // Media is a public disclosure, so seeded properties need no Cloudinary round trip and
    // the upload service is simply absent. Nothing in the money path depends on it.
    const services = createBackendServices(db, {
      features: env.features, payment: env.payment, mediaAdapter: null,
      env, mailer: { async sendMail() { throw new Error("Seed does not send mail"); } }
    });
    return await seedDemo(env, db, services, source);
  } finally {
    await db.connection.close();
  }
}

const invokedDirectly = process.argv[1]
  && import.meta.url === new URL(`file://${process.argv[1].replace(/\\/g, "/")}`).href;
if (invokedDirectly) {
  try {
    const report = await runSeed();
    console.log("Seed complete. Fictional demo identities:");
    for (const entry of report.credentials) console.log(`  ${entry.role.padEnd(9)} ${entry.email.padEnd(20)} ${entry.password}`);
    console.log("\nProperties:");
    for (const entry of report.properties) {
      console.log(`  ${entry.status.padEnd(17)} ${entry.unitsSold}/${entry.totalUnits} units  ${entry.title}`);
    }
    console.log("\nThis is an academic project. No real money or securities are involved.");
  } catch (error) {
    console.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  }
}
