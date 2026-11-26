// One-off setup script: `npm run qdrant:init`
// Creates the Qdrant collection and payload index used by the compliance engine.
import "dotenv/config";
import { ensureFrameworkCollection, isQdrantConfigured, FRAMEWORK_COLLECTION } from "./qdrant.js";

if (!isQdrantConfigured()) {
  console.error("QDRANT_URL is not set in .env");
  process.exit(1);
}

try {
  await ensureFrameworkCollection();
  console.log(`Qdrant collection '${FRAMEWORK_COLLECTION}' is ready.`);
} catch (error) {
  console.error("Error setting up Qdrant:", error.message);
  process.exit(1);
}
