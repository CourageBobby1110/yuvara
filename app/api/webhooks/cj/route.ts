import { NextResponse } from "next/server";
import Product from "@/models/Product";
import mongoose from "mongoose";

// Helper to ensure DB connection
const connectDB = async () => {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }
};

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { type, params } = body;

    console.log(
      "CJ Webhook Received:",
      type,
      JSON.stringify(params).substring(0, 200)
    );

    if (!type || !params) {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    // --- HANDLE PRODUCT UPDATE ---
    if (type === "PRODUCT") {
      const {
        pid,
        productName,
        productNameEn,
        productDescription,
        productImage,
        productSellPrice,
      } = params;

      if (pid) {
        const product = await Product.findOne({ cjPid: pid });
        if (product) {
          // Update fields if provided
          if (productNameEn || productName)
            product.name = productNameEn || productName;
          if (productDescription) product.description = productDescription;

          // Handle Image Update
          if (productImage) {
            // CJ sends a string, sometimes JSON array string, sometimes single URL
            let newImages: string[] = [];
            if (productImage.startsWith("[")) {
              try {
                newImages = JSON.parse(productImage);
              } catch (e) {
                newImages = [productImage];
              }
            } else {
              newImages = [productImage];
            }
            if (newImages.length > 0) product.images = newImages;
          }

          // Handle Price Update (Apply 1.5x Markup)
          if (productSellPrice) {
            const cost = parseFloat(productSellPrice);
            if (!isNaN(cost)) {
              product.price = cost * 1.5;
            }
          }

          await product.save();
          console.log(`Updated Product: ${pid}`);
        }
      }
    }

    // --- HANDLE VARIANT UPDATE ---
    else if (type === "VARIANT") {
      const { vid, variantSellPrice, variantImage } = params;

      if (vid) {
        // Find product containing this variant
        const product = await Product.findOne({ "variants.cjVid": vid });

        if (product) {
          const variantIndex = product.variants.findIndex(
            (v: any) => v.cjVid === vid
          );
          if (variantIndex !== -1) {
            // Update Price
            if (variantSellPrice) {
              const cost = parseFloat(variantSellPrice);
              if (!isNaN(cost)) {
                product.variants[variantIndex].price = cost * 1.5;
              }
            }

            // Update Image
            if (variantImage) {
              product.variants[variantIndex].image = variantImage;
            }

            await product.save();
            console.log(`Updated Variant: ${vid} in Product: ${product._id}`);
          }
        }
      }
    }

    // --- HANDLE STOCK UPDATE ---
    else if (type === "STOCK") {
      // params structure: { "VID1": [ { storageNum: 10, ... } ], "VID2": ... }
      const vids = Object.keys(params);

      for (const vid of vids) {
        // Skip if key is not a VID (though CJ docs imply keys are VIDs)
        if (vid === "fields") continue;

        const warehouseData = params[vid];
        if (Array.isArray(warehouseData)) {
          // Calculate total stock across all warehouses
          const totalStock = warehouseData.reduce((acc: number, curr: any) => {
            return acc + (parseInt(curr.storageNum) || 0);
          }, 0);

          // Update Product Variant Stock
          const product = await Product.findOne({ "variants.cjVid": vid });
          if (product) {
            const variantIndex = product.variants.findIndex(
              (v: any) => v.cjVid === vid
            );
            if (variantIndex !== -1) {
              product.variants[variantIndex].stock = totalStock;

              // Also update total product stock
              product.stock = product.variants.reduce(
                (acc: number, v: any) => acc + v.stock,
                0
              );

              await product.save();
              console.log(`Updated Stock for Variant: ${vid} -> ${totalStock}`);
            }
          }
        }
      }
    }

    // Always return 200 OK quickly
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("CJ Webhook Error:", error);
    // Return 200 even on error to prevent CJ from retrying indefinitely if it's a logic error
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 200 }
    );
  }
}
