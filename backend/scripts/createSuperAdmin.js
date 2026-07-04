require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const User = require("../models/User");

const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || "superadmin@apexacademy.com";
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || "SuperAdmin@123";
const SUPERADMIN_NAME = process.env.SUPERADMIN_NAME || "Apex Super Admin";

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
      console.warn("⚠️  Using in-memory DB — super admin exists only until server stops.");
      return;
    }
    throw err;
  }
}

async function createSuperAdmin() {
  await connectForSeed();

  let user = await User.findOne({ email: SUPERADMIN_EMAIL });

  if (user) {
    user.role = "superadmin";
    user.name = SUPERADMIN_NAME;
    if (process.env.SUPERADMIN_PASSWORD) {
      user.password = SUPERADMIN_PASSWORD;
    }
    await user.save();
    console.log("✅ Existing user updated to superadmin:", SUPERADMIN_EMAIL);
  } else {
    user = await User.create({
      name: SUPERADMIN_NAME,
      email: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASSWORD,
      role: "superadmin",
      className: "12th",
      stream: "Science",
    });
    console.log("✅ Super admin account created!");
  }

  console.log("\n--- Super Admin Login Details ---");
  console.log("Email:   ", SUPERADMIN_EMAIL);
  console.log(
    "Password:",
    process.env.SUPERADMIN_PASSWORD ? "(from SUPERADMIN_PASSWORD in .env)" : SUPERADMIN_PASSWORD
  );
  console.log("\nLogin at: http://localhost:3000/superadmin/login");
  console.log("Then go to: http://localhost:3000/admin\n");

  await mongoose.disconnect();
  process.exit(0);
}

createSuperAdmin().catch((err) => {
  console.error("❌ Failed:", err.message);
  process.exit(1);
});
