import { createApp } from "./app.js";
import { loadEnvironment } from "./config/env.js";
import { connectDatabase } from "./config/db.js";
import { createCloudinaryAdapter } from "./config/cloudinary.js";

// Startup order is deliberate: configuration is validated before any network or database
// work, so a missing secret or an unready database fails visibly instead of half-starting.
async function main() {
  const env = loadEnvironment();
  const db = await connectDatabase(env.mongoUri);
  // Uploads are unavailable rather than fake when Cloudinary is not configured.
  const mediaAdapter = env.cloudinary.cloudName ? createCloudinaryAdapter(env.cloudinary) : null;
  const { app } = createApp({ env, db, mediaAdapter });

  const server = app.listen(env.port, () => {
    console.log(`OwnSquare API listening on port ${env.port} (${env.nodeEnv})`);
  });
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => {
      server.close(() => db.connection.close().finally(() => process.exit(0)));
    });
  }
}

main().catch((error) => {
  console.error("Startup failed:", error.message);
  process.exit(1);
});
