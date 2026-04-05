import "dotenv/config";
import app from "./app.js";
import { ENV } from "./constants/env.js";
import { run_migrations } from "./models/schema.js";

const start = async () => {
  await run_migrations();
  app.listen(ENV.PORT, () => {
    console.log(`[server] Running on port ${ENV.PORT}`);
  });
};

start().catch((err) => {
  console.error("[startup] Failed to start server:", err);
  process.exit(1);
});