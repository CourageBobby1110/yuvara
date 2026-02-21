import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import mongoose from "mongoose";
import axios from "axios";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import { getValidCJAccessToken } from "@/lib/cj-auth";

async function main() {
  await dbConnect();
  const product = await Product.findOne({ cjPid: { $exists: true } });
  if (!product || !product.variants || product.variants.length < 2) {
    console.log("Need a product with at least 2 variants for test.");
    process.exit(0);
  }

  const accessToken = await getValidCJAccessToken();
  if (!accessToken) {
    console.log("No access token.");
    process.exit(1);
  }

  const v1 = product.variants[0];
  const v2 = product.variants[1];

  console.log(`Testing batch shipping for VIDs: ${v1.cjVid}, ${v2.cjVid}`);

  try {
    const res = await axios.post(
      `https://developers.cjdropshipping.com/api2.0/v1/logistic/freightCalculate`,
      {
        startCountryCode: "CN",
        endCountryCode: "US",
        products: [
          { quantity: 1, vid: v1.cjVid },
          { quantity: 1, vid: v2.cjVid },
        ],
      },
      { headers: { "CJ-Access-Token": accessToken } },
    );

    console.log("Response Status:", res.status);
    console.log("Response Data:", JSON.stringify(res.data, null, 2));
  } catch (e: any) {
    console.error("Error:", e.message);
    if (e.response) {
      console.error("Data:", e.response.data);
    }
  }

  process.exit(0);
}

main();
