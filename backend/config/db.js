const mongoose = require("mongoose");

const ATLAS_OPTIONS = {
  serverSelectionTimeoutMS: 20000,
  autoSelectFamily: false,
};

let memoryServer = null;

async function connectAtlas(uri) {
  const maxRetries = 3;
  let lastErr;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await mongoose.connect(uri, ATLAS_OPTIONS);
      console.log(`✅ MongoDB connected — database: ${mongoose.connection.name}`);
      return;
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries) {
        console.warn(`MongoDB attempt ${attempt}/${maxRetries} failed, retrying...`);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  throw lastErr;
}

async function connectMemory() {
  const { MongoMemoryServer } = require("mongodb-memory-server");
  memoryServer = await MongoMemoryServer.create();
  const uri = memoryServer.getUri("apex_academy");
  await mongoose.connect(uri);
  console.log("✅ MongoDB connected — local in-memory database: apex_academy");
  console.warn("⚠️  Using in-memory DB (dev only). Data is lost when the server stops.");
  console.warn("   For Atlas: use mobile hotspot or home WiFi, then restart.");
}

function printConnectionHelp(err) {
  console.error("\n❌ MongoDB connection error:", err.message);

  const cause = err.cause?.message || "";
  const msg = `${err.message} ${cause}`.toLowerCase();
  const isTimeout = msg.includes("timed out") || msg.includes("etimedout");
  const isSsl = cause.includes("ssl") || cause.includes("tls");
  const isIp = msg.includes("whitelist") || msg.includes("ip");

  if (isTimeout) {
    console.error(`
╔══════════════════════════════════════════════════════════════╗
║  NETWORK BLOCKS MONGODB (port 27017)                         ║
╠══════════════════════════════════════════════════════════════╣
║  Your WiFi/college network is blocking Atlas. Try:           ║
║  1. Connect to MOBILE HOTSPOT and restart: npm run dev       ║
║  2. Or set in backend/.env:  MONGO_MEMORY_FALLBACK=true     ║
║     (uses local in-memory DB — good for testing only)        ║
╚══════════════════════════════════════════════════════════════╝
`);
    return;
  }

  if (isIp && isSsl) {
    console.error(`
╔══════════════════════════════════════════════════════════════╗
║  SSL / Node.js issue — try Node.js 20 LTS (node -v)        ║
║  Or switch to mobile hotspot and restart.                    ║
╚══════════════════════════════════════════════════════════════╝
`);
    return;
  }

  if (isIp) {
    console.error(`
╔══════════════════════════════════════════════════════════════╗
║  Add your IP in Atlas → Network Access → Add Current IP      ║
║  https://cloud.mongodb.com                                   ║
╚══════════════════════════════════════════════════════════════╝
`);
  }
}

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("❌ MONGO_URI is missing. Add it to backend/.env");
    process.exit(1);
  }

  const useMemoryFallback =
    process.env.MONGO_MEMORY_FALLBACK === "true" ||
    process.env.MONGO_MEMORY_FALLBACK === "1";

  if (useMemoryFallback) {
    try {
      await connectMemory();
      return;
    } catch (err) {
      console.error("❌ In-memory MongoDB failed:", err.message);
      process.exit(1);
    }
  }

  try {
    await connectAtlas(uri);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("\n⚠️  Atlas unreachable — falling back to in-memory MongoDB...");
      try {
        await connectMemory();
        return;
      } catch (memErr) {
        printConnectionHelp(err);
        console.error("In-memory fallback also failed:", memErr.message);
        process.exit(1);
      }
    }

    printConnectionHelp(err);
    process.exit(1);
  }
};

module.exports = connectDB;
