const requiredEnvVars = [
  "EMAIL_SERVER_HOST",
  "EMAIL_SERVER_PORT",
  "EMAIL_SERVER_USER",
  "EMAIL_SERVER_PASSWORD",
  "EMAIL_FROM",
  "NEXTAUTH_URL",
];

console.log("Checking environment variables...");
const missing = [];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    missing.push(envVar);
  } else {
    console.log(`✅ ${envVar} is set`);
  }
}

if (missing.length > 0) {
  console.error("❌ Missing environment variables:", missing.join(", "));
} else {
  console.log("All required environment variables are set.");
}
