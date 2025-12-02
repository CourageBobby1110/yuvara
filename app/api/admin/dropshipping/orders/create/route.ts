import { NextResponse } from "next/server";
import { auth } from "@/auth";
import SiteSettings from "@/models/SiteSettings";
import Order from "@/models/Order";
import Product from "@/models/Product";
import axios from "axios";
import mongoose from "mongoose";
import { getValidCJAccessToken } from "@/lib/cj-auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    const accessToken = await getValidCJAccessToken();

    if (!accessToken) {
      return NextResponse.json(
        { error: "CJ Dropshipping not connected. Please go to Settings." },
        { status: 400 }
      );
    }

    // 1. Fetch Order
    const order = await Order.findById(orderId).populate({
      path: "items.product",
      model: Product,
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 2. Prepare CJ Order Payload
    const productList = [];
    for (const item of order.items) {
      const product = item.product;

      // Find the correct variant ID (vid)
      // If product has variants, we need to match the selected options (e.g. color/size)
      // However, our Order model currently stores 'name', 'image', but maybe not the specific variant ID selected.
      // We might need to infer it or rely on the fact that we should have stored it.
      // For now, let's try to find the matching variant in the product.variants array

      let vid = item.cjVid;

      // Fallback if cjVid is missing (legacy orders)
      if (!vid) {
        console.log(
          `[CJ Sync] cjVid missing for item ${item.name}. Attempting fallback...`
        );
        console.log(
          `[CJ Sync] Product has ${product.variants?.length || 0} variants.`
        );

        // vid = product.cjPid; // REMOVED: Do NOT default to PID, it causes "Invalid products" error.

        if (product.variants && product.variants.length > 0) {
          // Try to match by Image
          const matchingVariant = product.variants.find(
            (v: any) => v.image === item.image
          );
          if (matchingVariant && matchingVariant.cjVid) {
            console.log(
              `[CJ Sync] Found matching variant by image: ${matchingVariant.cjVid}`
            );
            vid = matchingVariant.cjVid;
          } else if (product.variants[0]?.cjVid) {
            console.log(
              `[CJ Sync] Defaulting to first variant: ${product.variants[0].cjVid}`
            );
            vid = product.variants[0].cjVid;
          }
        }
      } else {
        console.log(`[CJ Sync] Using existing cjVid: ${vid}`);
      }

      if (!vid) {
        console.log(
          `[CJ Sync] cjVid missing for item ${item.name}. Attempting AUTO-REPAIR...`
        );

        try {
          // Fetch latest product data from CJ
          const cjResponse = await axios.get(
            `https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=${product.cjPid}`,
            { headers: { "CJ-Access-Token": accessToken } }
          );

          if (cjResponse.data?.result && cjResponse.data?.data?.variants) {
            const cjVariants = cjResponse.data.data.variants;
            console.log(
              `[CJ Sync] Fetched ${cjVariants.length} variants from CJ for auto-repair.`
            );

            // Try to find matching CJ variant
            // We need to match the item's selected options (color/size) to the CJ variants
            // The 'item' in order.items might not have explicit color/size fields if they weren't saved,
            // but we can try to match by the 'image' or 'name' if it contains the variant info.
            // However, we DO have the local product variants loaded.

            // Let's iterate through local variants to find which one matches this order item (by image usually)
            // And then update THAT local variant with info from CJ.

            let localVariantToUpdate = product.variants.find(
              (v: any) => v.image === item.image
            );

            // If we can't find by image, maybe the item *is* the variant?
            // In the Order model, item has 'image', 'name', 'price'.

            if (localVariantToUpdate) {
              const match = cjVariants.find((v: any) => {
                const colorMatch =
                  v.productColor === localVariantToUpdate.color ||
                  v.variantKey?.includes(localVariantToUpdate.color);
                const sizeMatch =
                  (localVariantToUpdate.size === "" &&
                    (!v.productSize || v.productSize === "Default")) ||
                  v.productSize === localVariantToUpdate.size;
                return colorMatch; // prioritizing color
              });

              if (match) {
                console.log(
                  `[CJ Sync] Auto-repair matched variant! ID: ${match.vid}`
                );
                vid = match.vid;

                // Update local database PERMANENTLY
                localVariantToUpdate.cjVid = match.vid;
                localVariantToUpdate.cjSku = match.productSku;
                await product.save();
                console.log(
                  `[CJ Sync] Product ${product.name} updated with new VID.`
                );
              } else {
                // Try image match on CJ side
                const imageMatch = cjVariants.find(
                  (v: any) => v.productImage === item.image
                );
                if (imageMatch) {
                  console.log(
                    `[CJ Sync] Auto-repair matched by IMAGE! ID: ${imageMatch.vid}`
                  );
                  vid = imageMatch.vid;
                  localVariantToUpdate.cjVid = imageMatch.vid;
                  localVariantToUpdate.cjSku = imageMatch.productSku;
                  await product.save();
                }
              }
            }
          }
        } catch (repairError) {
          console.error("[CJ Sync] Auto-repair failed:", repairError);
        }

        if (!vid) {
          console.error(
            `[CJ Sync] FAILED to find any valid cjVid for item: ${item.name}`
          );
          // We could throw an error here to stop the process and alert the user
          throw new Error(
            `Could not determine CJ Variant ID for item: ${item.name}. Please check product configuration.`
          );
        }
      }

      // Look up SKU if available
      let sku = undefined;
      if (vid) {
        const variant = product.variants?.find((v: any) => v.cjVid === vid);
        if (variant && variant.cjSku) {
          sku = variant.cjSku;
        } else if (product.cjPid === vid) {
          // If vid is actually a pid (fallback), we might not have a sku, or it might be the product's main sku?
          // Usually PID doesn't have a SKU in the same way.
        }
      }

      productList.push({
        vid: vid,
        sku: sku, // Add SKU
        quantity: item.quantity,
      });
    }

    const countryMap: { [key: string]: string } = {
      Nigeria: "NG",
      "United States": "US",
      "United Kingdom": "GB",
      Canada: "CA",
      Australia: "AU",
    };

    const reverseCountryMap: { [key: string]: string } = {
      NG: "Nigeria",
      US: "United States",
      GB: "United Kingdom",
      CA: "Canada",
      AU: "Australia",
    };

    let shippingCountry = order.shippingAddress.country;
    let countryCode = countryMap[shippingCountry] || shippingCountry;

    // If shippingCountry is already a code (e.g. "NG"), map it back to name for shippingCountry field
    if (reverseCountryMap[shippingCountry]) {
      countryCode = shippingCountry;
      shippingCountry = reverseCountryMap[shippingCountry];
    }

    const payload = {
      orderNumber: order._id.toString(),
      shippingZip: order.shippingAddress.zip,
      shippingCountryCode: countryCode,
      shippingCountry: shippingCountry, // Required by V3
      shippingProvince: order.shippingAddress.state,
      shippingCity: order.shippingAddress.city,
      shippingAddress: order.shippingAddress.street,
      shippingCustomerName: order.shippingAddress.email.split("@")[0], // Fallback name
      shippingPhone: order.shippingAddress.phone,
      remark: "Dropshipping Order from Yuvara",
      fromCountryCode: "CN", // Required by V3, default to China
      logisticName: (() => {
        // Try to find a valid logistic name from the first product's shipping rates
        // This assumes all products in the order can be shipped with the same method, which is a simplification.
        // Ideally, we should check common methods.
        if (order.items.length > 0 && order.items[0].product.shippingRates) {
          const rate = order.items[0].product.shippingRates.find(
            (r: any) => r.countryCode === countryCode
          );
          if (rate && rate.method) {
            return rate.method;
          }
        }
        return "CJPacket Ordinary"; // Fallback
      })(),
      products: productList, // Required by V3
    };

    // 3. Send to CJ
    // Save to file for debugging
    try {
      const fs = require("fs");
      const path = require("path");
      const logPath = path.join(process.cwd(), "cj_order_payload_v3.json");
      fs.writeFileSync(logPath, JSON.stringify(payload, null, 2));
    } catch (err) {
      console.error("Failed to write payload log:", err);
    }

    try {
      const response = await axios.post(
        "https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrderV3",
        payload,
        {
          headers: {
            "CJ-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.data.result) {
        throw new Error(response.data.message || "CJ API returned failure");
      }

      // 4. Update Order Status
      order.status = "processing"; // Or a specific status like "sent_to_cj"
      await order.save();

      return NextResponse.json({
        success: true,
        cjOrderId: response.data.data, // CJ returns the order ID
        message: "Order successfully sent to CJ Dropshipping",
      });
    } catch (apiError: any) {
      console.error(
        "CJ API Error:",
        apiError.response?.data || apiError.message
      );
      return NextResponse.json(
        {
          error:
            "Failed to send order to CJ: " +
            (apiError.response?.data?.message || apiError.message),
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Order Sync Error:", error.message);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
