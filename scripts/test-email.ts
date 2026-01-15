import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";
// Load env vars manually
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const [key, value] = line.split("=");
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const logFile = path.resolve(process.cwd(), "email-test.log");

function log(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(logFile, logMessage);
}

async function sendMailWithRetry() {
  log("Starting email test...");

  if (!process.env.EMAIL_SERVER_HOST) {
    log("ERROR: EMAIL_SERVER_HOST is missing");
    return;
  }

  const ports = [587, 465, 25, 2525];

  // Dummy mail options
  const mailOptions = {
    from: process.env.EMAIL_FROM || "test@example.com",
    to: "test-recipient@example.com", // We might fail if this is invalid, but we want to test CONNECTION first
    subject: "Test Email from Debugger",
    text: "This is a test email to verify SMTP settings.",
  };

  log(`Configuration:
    Host: ${process.env.EMAIL_SERVER_HOST}
    User: ${process.env.EMAIL_SERVER_USER}
    From: ${mailOptions.from}
  `);

  for (const port of ports) {
    try {
      log(`Attempting to connect to port ${port}...`);
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SERVER_HOST,
        port: port,
        secure: port === 465,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 5000, // 5s timeout
        logger: true,
        debug: true,
      });

      // Verify connection configuration
      await transporter.verify();
      log(`SUCCESS: Connected to port ${port}`);

      // Attempt to send (this might fail if 'to' is invalid, but connection is key)
      // await transporter.sendMail(mailOptions);
      // log(`SUCCESS: Email sent via port ${port}`);
      return;
    } catch (error: any) {
      log(`FAILURE: Port ${port} failed. Error: ${error.message}`);
      if (error.code) log(`Error Code: ${error.code}`);
      if (error.response) log(`Error Response: ${error.response}`);
    }
  }

  log("ALL PORTS FAILED.");
}

sendMailWithRetry().catch((err) => log(`FATAL ERROR: ${err.message}`));
