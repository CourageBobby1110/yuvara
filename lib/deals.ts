import dbConnect from "@/lib/db";
import Deal from "@/models/Deal";
import Product from "@/models/Product";
import { getProducts } from "@/lib/products";
import { getValidUrl, getProductMainImage } from "@/lib/utils";

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
        const mainImg = deal.customImage || getProductMainImage(p) || getValidUrl(p.images?.[0] || p.image) || "/placeholder.png";
        const origPrice = deal.originalPrice || (deal.dealPrice ? deal.dealPrice * 1.75 : (p.price || 20) * 1.75);
        const discount = deal.discountPercent || Math.round(((origPrice - deal.dealPrice) / origPrice) * 100);

        const normalized = {
          _id: deal._id.toString(),
          dealId: deal._id.toString(),
          productId: p._id ? p._id.toString() : deal._id.toString(),
          name: deal.customTitle || p.name || "Luxury Item",
          slug: p.slug || "collections",
          price: Number(deal.dealPrice || p.price || 15),
          originalPrice: Number(origPrice),
          discountPercent: discount > 0 ? discount : 35,
          image: mainImg,
          category: p.category || "Luxury",
          endTime: deal.endTime ? deal.endTime.toISOString() : null,
          durationHours: deal.durationHours || 24,
          claimedPercent: deal.claimedPercent || 80,
          stockRemaining: deal.stockRemaining || (p.stock > 0 ? Math.min(p.stock, 8) : 5),
          stockTag: deal.stockTag || "Only few left",
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

    // 2. Fetch real products from catalog if admin hasn't configured enough deals yet
    if (countdownDeals.length < 3 || limitedDeals.length < 3) {
      const catalogProducts = await getProducts({ limit: 16 });

      if (Array.isArray(catalogProducts) && catalogProducts.length > 0) {
        // Fill countdown deals
        let prodIdx = 0;
        while (countdownDeals.length < 3 && prodIdx < catalogProducts.length) {
          const p = catalogProducts[prodIdx];
          prodIdx++;
          const pId = p._id ? p._id.toString() : `prod-${prodIdx}`;
          if (countdownDeals.some((d) => d.productId === pId)) continue;

          const mainImg = getProductMainImage(p) || getValidUrl(p.images?.[0] || p.image) || "/placeholder.png";
          const origPrice = (p.price || 20) * 1.75;
          const discount = Math.round(((origPrice - p.price) / origPrice) * 100);

          countdownDeals.push({
            _id: `cd-${pId}`,
            productId: pId,
            name: p.name || "Timeless Luxury Piece",
            slug: p.slug || "collections",
            price: Number(p.price || 20),
            originalPrice: Number(origPrice.toFixed(2)),
            discountPercent: discount > 0 ? discount : 40,
            image: mainImg,
            category: p.category || "Luxury",
            durationHours: 24,
            claimedPercent: 70 + ((prodIdx * 8) % 25),
          });
        }

        // Fill limited deals
        while (limitedDeals.length < 3 && prodIdx < catalogProducts.length) {
          const p = catalogProducts[prodIdx];
          prodIdx++;
          const pId = p._id ? p._id.toString() : `prod-${prodIdx}`;
          if (limitedDeals.some((d) => d.productId === pId)) continue;

          const mainImg = getProductMainImage(p) || getValidUrl(p.images?.[0] || p.image) || "/placeholder.png";
          const origPrice = (p.price || 25) * 1.9;
          const discount = Math.round(((origPrice - p.price) / origPrice) * 100);

          limitedDeals.push({
            _id: `ld-${pId}`,
            productId: pId,
            name: p.name || "Exclusive Vault Edition",
            slug: p.slug || "collections",
            price: Number(p.price || 25),
            originalPrice: Number(origPrice.toFixed(2)),
            discountPercent: discount > 0 ? discount : 45,
            image: mainImg,
            category: p.category || "Luxury",
            stockRemaining: p.stock && p.stock > 0 ? Math.min(p.stock, 6) : 3,
            stockTag: `Only ${p.stock && p.stock > 0 ? Math.min(p.stock, 6) : 3} left`,
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
