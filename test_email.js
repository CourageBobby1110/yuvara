const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

// Manually load .env file
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const [key, value] = line.split("=");
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
} else {
  console.log("No .env file found at", envPath);
}

// Also try .env.local
const envLocalPath = path.join(__dirname, ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envConfig = fs.readFileSync(envLocalPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const [key, value] = line.split("=");
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

function log(msg) {
  console.log(msg);
  fs.appendFileSync("email_debug.log", msg + "\n");
}

async function main() {
  fs.writeFileSync("email_debug.log", "Starting debug...\n");
  log("Testing email configuration...");

  if (!process.env.EMAIL_SERVER_HOST) log("MISSING: EMAIL_SERVER_HOST");
  if (!process.env.EMAIL_SERVER_PORT) log("MISSING: EMAIL_SERVER_PORT");
  if (!process.env.EMAIL_SERVER_USER) log("MISSING: EMAIL_SERVER_USER");
  if (!process.env.EMAIL_SERVER_PASSWORD) log("MISSING: EMAIL_SERVER_PASSWORD");
  if (!process.env.EMAIL_FROM) log("MISSING: EMAIL_FROM");

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT),
    secure: Number(process.env.EMAIL_SERVER_PORT) === 465,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
    debug: true, // Enable nodemailer debug output
    logger: true, // Log to console
  });

  try {
    log("Verifying connection...");
    await transporter.verify();
    log("✅ Connection verified successfully!");

    log("Sending test email...");
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_SERVER_USER,
      subject: "Test Email from Yuvara Debugger",
      text: "If you receive this, your email configuration is working correctly.",
    });

    log("✅ Message sent: " + info.messageId);
  } catch (error) {
    log("❌ Error: " + error.message);
    if (error.code === "EAUTH") log("Authentication failed. Check user/pass.");
    if (error.code === "ESOCKET") log("Connection failed. Check host/port.");
  }
}

main().catch(console.error);
