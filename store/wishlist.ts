import { create } from "zustand";
import { toast } from "sonner";

interface WishlistState {
  items: Set<string>; // Set of product IDs
  isLoading: boolean;
  fetchWishlist: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: new Set(),
  isLoading: false,

  fetchWishlist: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/wishlist");
      if (res.ok) {
        const data = await res.json();
        // Assuming API returns array of objects with product._id or just product objects
        // Based on previous code: data.map((item: any) => item.product._id)
        const ids = new Set<string>(data.map((item: any) => item.product._id));
        set({ items: ids });
      }
    } catch (error) {
      console.error("Failed to fetch wishlist", error);
    } finally {
      set({ isLoading: false });
    }
  },

  toggleWishlist: async (productId: string) => {
    const { items } = get();
    const isAdded = !items.has(productId);

    // Optimistic update
    set((state) => {
      const newItems = new Set(state.items);
      if (isAdded) {
        newItems.add(productId);
      } else {
        newItems.delete(productId);
      }
      return { items: newItems };
    });

    // Show toast immediately
    if (isAdded) {
      toast.success("Added to wishlist");
    } else {
      toast.info("Removed from wishlist");
    }

    try {
      if (isAdded) {
        await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
      } else {
        await fetch(`/api/wishlist?productId=${productId}`, {
          method: "DELETE",
        });
      }
    } catch (error) {
      console.error("Failed to toggle wishlist", error);
      toast.error("Failed to update wishlist");

      // Revert on error
      set((state) => {
        const newItems = new Set(state.items);
        if (isAdded) {
          newItems.delete(productId);
        } else {
          newItems.add(productId);
        }
        return { items: newItems };
      });
    }
  },

  isInWishlist: (productId: string) => {
    return get().items.has(productId);
  },
}));
