import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
async function main() {
  try {
    await dbConnect();
    console.log("Connected to DB");

    const product = await Product.findOne({ cjPid: { $exists: true } });
    if (!product) {
      console.log("No CJ product found");
      process.exit(0);
    }

    console.log(`Testing with Product: ${product.name} (${product._id})`);

    // We want to see the RAW response from CJ, not just syncProductPrice result.
    // So let's manually fetch here.
    const { getValidCJAccessToken } = await import("@/lib/cj-auth");
    const axios = (await import("axios")).default;

    const accessToken = await getValidCJAccessToken();
    console.log("Got Access Token:", !!accessToken);

    if (accessToken) {
      const res = await axios.get(
        `https://developers.cjdropshipping.com/api2.0/v1/product/variant/queryByPid?pid=${product.cjPid}`,
        { headers: { "CJ-Access-Token": accessToken } },
      );
      console.log("CJ API Status:", res.status);
      if (res.data?.data && res.data.data.length > 0) {
        console.log("First Variant Keys:", Object.keys(res.data.data[0]));
        // Check for stock fields
        const v = res.data.data[0];
        console.log("Stock Fields?:", {
          inventory: v.inventory,
          stock: v.stock,
          quantity: v.quantity,
          totalInventoryNum: v.totalInventoryNum,
        });
      } else {
        console.log("No variants data in response");
      }
    }
  } catch (error: any) {
    console.error("Test Error:", error.message);
  }
  process.exit(0);
}

main();
