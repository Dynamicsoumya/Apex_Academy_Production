const nodemailer = require("nodemailer");

function getCredentials() {
  const user = (process.env.SMTP_USER || process.env.GMAIL_USER || "").trim();
  const pass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "")
    .replace(/\s/g, "")
    .trim();
  return { user, pass };
}

function isAppPassword(pass) {
  return /^[a-zA-Z0-9]{16}$/.test(pass);
}

function isEmailConfigured() {
  const { user, pass } = getCredentials();
  return Boolean(user && pass.length >= 8);
}

function getEmailConfigError() {
  const { user, pass } = getCredentials();
  if (!user) return "GMAIL_USER is missing in backend .env";
  if (!pass) return "GMAIL_APP_PASSWORD is missing in backend .env";
  if (!isAppPassword(pass)) {
    return "GMAIL_APP_PASSWORD must be a 16-character Google App Password (not your normal Gmail login password)";
  }
  return "";
}

function getSmtpConfig() {
  const { user, pass } = getCredentials();

  if (process.env.SMTP_HOST) {
    return {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: { user, pass },
    };
  }

  return {
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user, pass },
    tls: { rejectUnauthorized: true },
  };
}

function createTransporter() {
  return nodemailer.createTransport({
    ...getSmtpConfig(),
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
  });
}

function formatEmailError(err) {
  const msg = err.message || "";
  if (msg.includes("BadCredentials") || msg.includes("Invalid login") || msg.includes("535")) {
    return "Gmail rejected the password. Use a 16-character App Password from Google — not your normal Gmail password.";
  }
  if (err.code === "SMTP_NOT_CONFIGURED") {
    return getEmailConfigError() || "Gmail is not configured in backend .env";
  }
  return msg;
}

async function sendEmail({ to, subject, html, text }) {
  const { user } = getCredentials();
  const from =
    process.env.EMAIL_FROM ||
    (user ? `Apex Academy <${user}>` : "Apex Academy <noreply@apexacademy.com>");

  const configError = getEmailConfigError();
  if (configError) {
    const err = new Error(configError);
    err.code = "SMTP_NOT_CONFIGURED";
    throw err;
  }

  const transporter = createTransporter();
  await transporter.verify();

  const info = await transporter.sendMail({ from, to, subject, html, text });
  console.log(`✅ Email sent to ${to} (id: ${info.messageId})`);
  return { messageId: info.messageId };
}

module.exports = {
  sendEmail,
  isEmailConfigured,
  isAppPassword,
  getEmailConfigError,
  formatEmailError,
  createTransporter,
  getCredentials,
};
