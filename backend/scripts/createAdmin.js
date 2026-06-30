require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const User = require("../models/User");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@apexacademy.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";
const ADMIN_NAME = process.env.ADMIN_NAME || "Apex Admin";

const ATLAS_OPTIONS = { serverSelectionTimeoutMS: 20000, autoSelectFamily: false };

async function connectForSeed() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("❌ MONGO_URI missing in backend/.env");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, ATLAS_OPTIONS);
    return;
  } catch (err) {
    if (process.env.MONGO_MEMORY_FALLBACK === "true" || process.env.NODE_ENV !== "production") {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const memoryServer = await MongoMemoryServer.create();
      await mongoose.connect(memoryServer.getUri("apex_academy"));
      console.warn("⚠️  Using in-memory DB — admin exists only until server stops.");
      return;
    }
    throw err;
  }
}

async function createAdmin() {
  await connectForSeed();

  let user = await User.findOne({ email: ADMIN_EMAIL });

  if (user) {
    user.role = "admin";
    user.name = ADMIN_NAME;
    if (process.env.ADMIN_PASSWORD) {
      user.password = ADMIN_PASSWORD;
    }
    await user.save();
    console.log("✅ Existing user updated to admin:", ADMIN_EMAIL);
  } else {
    user = await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: "admin",
      className: "12th",
      stream: "Science",
    });
    console.log("✅ Admin account created!");
  }

  console.log("\n--- Admin Login Details ---");
  console.log("Email:   ", ADMIN_EMAIL);
  console.log("Password:", process.env.ADMIN_PASSWORD ? "(from ADMIN_PASSWORD in .env)" : ADMIN_PASSWORD);
  console.log("\nLogin at: http://localhost:3000/login");
  console.log("Then go to: http://localhost:3000/admin\n");

  await mongoose.disconnect();
  process.exit(0);
}

createAdmin().catch((err) => {
  console.error("❌ Failed:", err.message);
  process.exit(1);
});
