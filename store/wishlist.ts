import { create } from "zustand";
import { toast } from "sonner";

interface WishlistState {
  items: Set<string>; // Set of product IDs
  isLoading: boolean;
  version: number; // For triggering re-fetches
  fetchWishlist: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: new Set(),
  isLoading: false,
  version: 0, // Add version for reactivity

  fetchWishlist: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/wishlist", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
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
      return { items: newItems, version: state.version + 1 };
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

      // Trigger another update to ensure we have the server-confirmed state
      // This fixes race conditions where the fetch happened before the write completed
      set((state) => ({ version: state.version + 1 }));
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
        return { items: newItems, version: state.version + 1 };
      });
    }
  },

  isInWishlist: (productId: string) => {
    return get().items.has(productId);
  },
}));
