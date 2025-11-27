import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { toast } from "sonner";

interface WishlistState {
  items: Set<string>; // Set of product IDs
  isLoading: boolean;
  version: number; // For triggering re-fetches
  fetchWishlist: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: new Set(),
      isLoading: false,
      version: 0,

      fetchWishlist: async () => {
        set({ isLoading: true });
        try {
          const res = await fetch("/api/wishlist", { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            // Server is the source of truth
            const ids = new Set<string>(
              data.map((item: any) => item.product?._id).filter(Boolean)
            );
            set({ items: ids, version: get().version + 1 });
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
          // We don't necessarily need to re-fetch immediately if we trust our optimistic update,
          // but re-fetching ensures consistency.
          // Let's just increment version to trigger listeners.
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
    }),
    {
      name: "wishlist-storage",
      storage: createJSONStorage(() => localStorage),
      // Custom serialization for Set
      partialize: (state) => ({
        items: Array.from(state.items),
        version: state.version,
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        items: new Set(persistedState.items || []),
        version: persistedState.version || 0,
      }),
    }
  )
);
