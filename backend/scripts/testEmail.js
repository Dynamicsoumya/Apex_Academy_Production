/**
 * Test Gmail setup: node scripts/testEmail.js your@gmail.com
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { sendEmail, getEmailConfigError, formatEmailError } = require("../utils/sendEmail");

const to = process.argv[2];

async function main() {
  const configError = getEmailConfigError();
  if (configError) {
    console.error("\n❌", configError, "\n");
    console.log("Steps:");
    console.log("1. Enable 2-Step Verification on Gmail");
    console.log("2. Open https://myaccount.google.com/apppasswords");
    console.log("3. Create App Password for 'Mail' (16 characters)");
    console.log("4. Add to backend/.env:");
    console.log("   GMAIL_APP_PASSWORD=abcdefghijklmnop");
    console.log("   (NOT your normal Gmail login password)\n");
    process.exit(1);
  }

  const target = to || user;
  console.log(`Sending test email to ${target}...`);

  try {
    await sendEmail({
      to: target,
      subject: "Apex Academy — Email Test",
      text: "If you received this, Gmail is working correctly for password reset emails.",
      html: "<p>If you received this, <strong>Gmail is working</strong> for Apex Academy password reset emails.</p>",
    });
    console.log("\n✅ Test email sent! Check inbox and spam folder.\n");
  } catch (err) {
    console.error("\n❌ Failed:", formatEmailError(err));
    process.exit(1);
  }
}

main();
