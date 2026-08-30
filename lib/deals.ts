import dbConnect from "@/lib/db";
import Deal from "@/models/Deal";
import Product from "@/models/Product";
import { getProducts } from "@/lib/products";
import { getValidUrl, getProductMainImage } from "@/lib/utils";

function toPlainRates(rates: any): { countryCode: string; price: number }[] {
  if (!Array.isArray(rates)) return [];
  return rates
    .map((r: any) => ({
      countryCode: String(r.countryCode || ""),
      price: Number(r.price || 0),
    }))
    .filter((r) => r.countryCode);
}

export async function getHomepageDeals() {
  try {
    await dbConnect();

    // 1. Fetch active deals configured by admin
    const deals = await Deal.find({ isActive: true })
      .populate("product")
      .sort({ order: 1, createdAt: -1 })
      .lean();

    const countdownDeals: any[] = [];
    const limitedDeals: any[] = [];

    if (Array.isArray(deals) && deals.length > 0) {
      deals.forEach((deal: any) => {
        if (!deal.product) return;

        const p = deal.product;
        const realPrice = Number(p.price || 0);
        const origPrice = Number(
          deal.originalPrice && Number(deal.originalPrice) > realPrice
            ? Number(deal.originalPrice).toFixed(2)
            : deal.discountPercent && deal.discountPercent > 0
              ? (realPrice / (1 - Math.min(deal.discountPercent, 80) / 100)).toFixed(2)
              : (realPrice * 1.75).toFixed(2)
        );
        const discount =
          deal.discountPercent && deal.discountPercent > 0
            ? deal.discountPercent
            : Math.max(5, Math.round(((origPrice - realPrice) / origPrice) * 100));

        // Calculate total available inventory
        const pVariantStock = Array.isArray(p.variants)
          ? p.variants.reduce((acc: number, v: any) => acc + (v.stock || 0), 0)
          : 0;
        const pTotalStock = (p.stock || 0) + pVariantStock;
        const dealStockRemaining =
          deal.stockRemaining !== undefined && deal.stockRemaining !== null
            ? Number(deal.stockRemaining)
            : pTotalStock;

        // STRICT REQUIREMENT: Must have price > 0 and stock > 0 - use real DB price only
        if (!realPrice || realPrice <= 0 || isNaN(realPrice)) return;
        if (dealStockRemaining <= 0 && pTotalStock <= 0) return;

        const mainImg =
          deal.customImage ||
          getProductMainImage(p) ||
          getValidUrl(p.images?.[0] || p.image) ||
          "/placeholder.png";

        const stockLeft = Math.max(1, Math.min(dealStockRemaining > 0 ? dealStockRemaining : pTotalStock, 8));

        const normalized = {
          _id: deal._id.toString(),
          dealId: deal._id.toString(),
          productId: p._id ? p._id.toString() : deal._id.toString(),
          name: deal.customTitle || p.name || "Luxury Item",
          slug: p.slug || "collections",
          price: realPrice,
          originalPrice: Number(origPrice.toFixed(2)),
          discountPercent: discount > 0 ? discount : 35,
          image: mainImg,
          shippingRates: toPlainRates(p.shippingRates),
          category: p.category || "Luxury",
          endTime: deal.endTime ? deal.endTime.toISOString() : null,
          durationHours: deal.durationHours || 24,
          claimedPercent: deal.claimedPercent || 80,
          stockRemaining: stockLeft,
          stockTag: deal.stockTag || `Only ${stockLeft} left`,
          averageRating: deal.rating || p.averageRating || 4.9,
          reviewCount: deal.reviewCount || p.reviewCount || 480,
        };

        if (deal.type === "countdown") {
          countdownDeals.push(normalized);
        } else if (deal.type === "limited") {
          limitedDeals.push(normalized);
        }
      });
    }

    // 2. Fetch real in-stock products with cheapest prices if admin hasn't configured enough deals yet
    if (countdownDeals.length < 3 || limitedDeals.length < 3) {
      // Query cheapest in-stock products first (price: 1)
      const catalogProducts = await Product.find({
        price: { $gt: 0 },
        $or: [{ stock: { $gt: 0 } }, { "variants.stock": { $gt: 0 } }],
      })
        .sort({ price: 1 })
        .limit(40)
        .lean();

      if (Array.isArray(catalogProducts) && catalogProducts.length > 0) {
        // Filter strictly for price > 0 and stock > 0
        const inStockCheapProducts = catalogProducts.filter((p: any) => {
          const price = Number(p.price || 0);
          const varStock = Array.isArray(p.variants)
            ? p.variants.reduce((s: number, v: any) => s + (v.stock || 0), 0)
            : 0;
          const totalStock = (p.stock || 0) + varStock;
          return price > 0 && totalStock > 0;
        });

        // Time-based rotation cycle (rotates every 4 hours based on standard flash deal windows)
        const rotationWindowHours = 4;
        const currentWindowSeed = Math.floor(
          Date.now() / (rotationWindowHours * 60 * 60 * 1000)
        );
        const rotationOffset =
          inStockCheapProducts.length > 0
            ? (currentWindowSeed * 6) % inStockCheapProducts.length
            : 0;

        // Shift products according to current rotation window
        const rotatedPool = [
          ...inStockCheapProducts.slice(rotationOffset),
          ...inStockCheapProducts.slice(0, rotationOffset),
        ];

        // Fill countdown deals from cheapest rotating pool
        let prodIdx = 0;
        while (countdownDeals.length < 3 && prodIdx < rotatedPool.length) {
          const p = rotatedPool[prodIdx];
          prodIdx++;
          const pId = p._id ? p._id.toString() : `prod-${prodIdx}`;
          if (countdownDeals.some((d) => d.productId === pId)) continue;

          const mainImg =
            getProductMainImage(p) ||
            getValidUrl(p.images?.[0] || p.image) ||
            "/placeholder.png";
          const pPrice = Number(p.price);
          const origPrice = pPrice * 1.75;
          const discount = Math.round(((origPrice - pPrice) / origPrice) * 100);
          const pStock = Math.max(1, Math.min(p.stock || 5, 8));

          countdownDeals.push({
            _id: `cd-${pId}`,
            productId: pId,
            name: p.name || "Timeless Luxury Piece",
            slug: p.slug || "collections",
            price: pPrice,
            originalPrice: Number(origPrice.toFixed(2)),
            discountPercent: discount > 0 ? discount : 40,
            image: mainImg,
            shippingRates: toPlainRates(p.shippingRates),
            category: p.category || "Luxury",
            durationHours: rotationWindowHours,
            claimedPercent: 70 + ((prodIdx * 8) % 25),
            stockRemaining: pStock,
          });
        }

        // Fill limited deals from cheapest rotating pool
        while (limitedDeals.length < 3 && prodIdx < rotatedPool.length) {
          const p = rotatedPool[prodIdx];
          prodIdx++;
          const pId = p._id ? p._id.toString() : `prod-${prodIdx}`;
          if (limitedDeals.some((d) => d.productId === pId)) continue;

          const mainImg =
            getProductMainImage(p) ||
            getValidUrl(p.images?.[0] || p.image) ||
            "/placeholder.png";
          const pPrice = Number(p.price);
          const origPrice = pPrice * 1.9;
          const discount = Math.round(((origPrice - pPrice) / origPrice) * 100);
          const pStock = Math.max(1, Math.min(p.stock || 4, 6));

          limitedDeals.push({
            _id: `ld-${pId}`,
            productId: pId,
            name: p.name || "Exclusive Vault Edition",
            slug: p.slug || "collections",
            price: pPrice,
            originalPrice: Number(origPrice.toFixed(2)),
            discountPercent: discount > 0 ? discount : 45,
            image: mainImg,
            shippingRates: toPlainRates(p.shippingRates),
            category: p.category || "Luxury",
            stockRemaining: pStock,
            stockTag: `Only ${pStock} left`,
            averageRating: p.averageRating && p.averageRating > 0 ? p.averageRating : 4.9,
            reviewCount: p.reviewCount && p.reviewCount > 0 ? p.reviewCount : 380 + prodIdx * 45,
          });
        }
      }
    }

    return {
      countdownDeals: countdownDeals.slice(0, 3),
      limitedDeals: limitedDeals.slice(0, 3),
    };
  } catch (error) {
    console.error("Error fetching homepage deals:", error);
    return {
      countdownDeals: [],
      limitedDeals: [],
    };
  }
}
