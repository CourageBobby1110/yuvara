const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");

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

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  try {
    fs.appendFileSync(logFile, logMessage);
  } catch (e) {
    console.error("Could not write to log file:", e);
  }
}

async function sendMailWithRetry() {
  log("Starting email test...");

  if (!process.env.EMAIL_SERVER_HOST) {
    log("ERROR: EMAIL_SERVER_HOST is missing");
    return;
  }

  const ports = [587, 465, 25, 2525];

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_FROM, // Send to self to verify delivery
    subject: "Test Email from Debugger",
    text: "This is a test email to verify SMTP settings. If you get this, sending works!",
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
        connectionTimeout: 5000,
        logger: true,
        debug: true,
      });

      await transporter.verify();
      log(`SUCCESS: Connected to port ${port}`);

      log("Attempting to send mail...");
      await transporter.sendMail(mailOptions);
      log(`SUCCESS: Email sent via port ${port}`);
      return;
    } catch (error) {
      log(`FAILURE: Port ${port} failed. Error: ${error.message}`);
      if (error.code) log(`Error Code: ${error.code}`);
    }
  }

  log("ALL PORTS FAILED.");
}

sendMailWithRetry().catch((err) => log(`FATAL ERROR: ${err.message}`));
