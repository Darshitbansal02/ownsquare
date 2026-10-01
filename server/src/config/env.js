const required = (name, value, hint) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing required environment variable ${name}${hint ? ` (${hint})` : ""}`);
  }
  return value.trim();
};

const booleanish = (name, value, fallback) => {
  if (value === undefined || value === "") return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`${name} must be literally true or false`);
};

// Validates configuration at startup. Missing or malformed values fail visibly rather than
// silently falling back to a development secret or an unintended payment provider.
export function loadEnvironment(source = process.env) {
  const nodeEnv = source.NODE_ENV ?? "development";
  const provider = source.PAYMENT_PROVIDER ?? "mock";
  if (!["mock", "razorpay"].includes(provider)) {
    throw new Error("PAYMENT_PROVIDER must be mock or razorpay");
  }
  const secret = required("JWT_SECRET", source.JWT_SECRET, "generate a strong random value");
  if (secret.length < 16) throw new Error("JWT_SECRET must be at least 16 characters");

  const cloudinary = {
    cloudName: source.CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: source.CLOUDINARY_API_KEY ?? "",
    apiSecret: source.CLOUDINARY_API_SECRET ?? ""
  };
  if (source.CLOUDINARY_CLOUD_NAME && !(cloudinary.apiKey && cloudinary.apiSecret)) {
    throw new Error("CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET are required when a cloud name is set");
  }

  const payment = { provider, secret: source.MOCK_PAYMENT_SECRET ?? "", keyId: source.RAZORPAY_KEY_ID ?? "",
    keySecret: source.RAZORPAY_KEY_SECRET ?? "" };
  if (provider === "mock" && (!payment.secret || payment.secret.length < 32)) {
    throw new Error("MOCK_PAYMENT_SECRET of at least 32 characters is required for the mock payment provider");
  }
  if (provider === "razorpay") {
    if (!payment.keyId?.startsWith("rzp_test_")) {
      throw new Error("RAZORPAY_KEY_ID must be a test-mode key (rzp_test_...)");
    }
    if (!payment.keySecret) throw new Error("RAZORPAY_KEY_SECRET is required for the razorpay provider");
  }

  const features = {
    kyc: booleanish("KYC_ENABLED", source.KYC_ENABLED, true),
    withdrawals: booleanish("WITHDRAWALS_ENABLED", source.WITHDRAWALS_ENABLED, true),
    enquiries: booleanish("ENQUIRIES_ENABLED", source.ENQUIRIES_ENABLED, true),
    notifications: booleanish("NOTIFICATIONS_ENABLED", source.NOTIFICATIONS_ENABLED, true),
    passwordReset: booleanish("PASSWORD_RESET_ENABLED", source.PASSWORD_RESET_ENABLED, false),
    ownershipCap: booleanish("OWNERSHIP_CAP_ENABLED", source.OWNERSHIP_CAP_ENABLED, true)
  };
  const smtp = {
    host: source.SMTP_HOST ?? "", port: Number(source.SMTP_PORT ?? 587),
    secure: booleanish("SMTP_SECURE", source.SMTP_SECURE, false),
    user: source.SMTP_USER ?? "", pass: source.SMTP_PASS ?? "", from: source.MAIL_FROM ?? ""
  };
  if (features.passwordReset && !(smtp.host && smtp.user && smtp.pass && smtp.from)) {
    throw new Error("PASSWORD_RESET_ENABLED requires complete SMTP configuration");
  }

  return {
    nodeEnv,
    port: Number(source.PORT ?? 5000),
    mongoUri: required("MONGO_URI", source.MONGO_URI, "transaction-capable replica set or Atlas"),
    jwt: { secret, expiresIn: source.JWT_EXPIRES_IN ?? "15m" },
    clientUrl: required("CLIENT_URL", source.CLIENT_URL, "exact frontend origin"),
    cloudinary,
    payment,
    features,
    smtp,
    seedRates: {
      platformFeePct: Number(source.PLATFORM_FEE_PCT ?? 2),
      brokerCommissionPct: Number(source.BROKER_COMMISSION_PCT ?? 1),
      maxOwnershipPct: Number(source.MAX_OWNERSHIP_PCT ?? 49)
    }
  };
}
