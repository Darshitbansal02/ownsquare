import { z } from "zod";
import { ROLES } from "../../../shared/constants.js";
import { empty } from "./common.schema.js";

// bcrypt silently truncates beyond 72 bytes, so the limit is enforced in UTF-8 bytes.
export const password = z.string().min(8).max(72)
  .regex(/[0-9]/, "Include a number")
  .regex(/[^a-zA-Z0-9\s]/, "Include a symbol")
  .refine((value) => Buffer.byteLength(value, "utf8") <= 72, "Password must be at most 72 UTF-8 bytes");

export const authRegister = {
  query: empty,
  body: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email().max(254),
    phone: z.string().regex(/^\+?\d{10,15}$/, "Phone must be 10-15 digits"),
    password,
    // ADMIN is deliberately absent: admins are seeded, never self-registered.
    role: z.enum([ROLES.INVESTOR, ROLES.BROKER])
  }).strict()
};

export const authLogin = {
  query: empty,
  body: z.object({
    email: z.string().trim().toLowerCase().email().max(254),
    password: z.string().min(1).max(256)
  }).strict()
};

export const authLogout = { query: empty, body: empty };

export const authForgotPassword = {
  query: empty,
  body: z.object({ email: z.string().trim().toLowerCase().email().max(254) }).strict()
};

export const authResetPassword = {
  params: z.object({ token: z.string().regex(/^[a-f0-9]{64}$/, "Reset token is malformed") }).strict(),
  query: empty,
  body: z.object({ password }).strict()
};
