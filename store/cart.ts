import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  slug: string;
  selectedSize?: string;
  selectedColor?: string;
  cjVid?: string;
  shippingRates?: {
    countryCode: string;
    countryName: string;
    price: number;
    method?: string;
    deliveryTime?: string;
  }[];
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (
    id: string,
    selectedSize?: string,
    selectedColor?: string
  ) => void;
  updateQuantity: (
    id: string,
    quantity: number,
    selectedSize?: string,
    selectedColor?: string
  ) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
  freeShippingThreshold: number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      freeShippingThreshold: 500, // Free shipping for orders over $500

      addItem: (item) => {
        const currentItems = get().items;
        const existingItemIndex = currentItems.findIndex(
          (i) =>
            i.id === item.id &&
            i.selectedSize === item.selectedSize &&
            i.selectedColor === item.selectedColor
        );

        if (existingItemIndex > -1) {
          const updatedItems = [...currentItems];
          updatedItems[existingItemIndex].quantity += 1;
          set({ items: updatedItems, isOpen: true });
        } else {
          set({
            items: [...currentItems, { ...item, quantity: 1 }],
            isOpen: true,
          });
        }
      },

      removeItem: (id, selectedSize, selectedColor) => {
        set({
          items: get().items.filter(
            (item) =>
              !(
                item.id === id &&
                item.selectedSize === selectedSize &&
                item.selectedColor === selectedColor
              )
          ),
        });
      },

      updateQuantity: (id, quantity, selectedSize, selectedColor) => {
        if (quantity < 1) {
          get().removeItem(id, selectedSize, selectedColor);
          return;
        }

        const currentItems = get().items;
        const itemIndex = currentItems.findIndex(
          (i) =>
            i.id === id &&
            i.selectedSize === selectedSize &&
            i.selectedColor === selectedColor
        );

        if (itemIndex > -1) {
          const updatedItems = [...currentItems];
          updatedItems[itemIndex].quantity = quantity;
          set({ items: updatedItems });
        }
      },

      clearCart: () => set({ items: [] }),

      toggleCart: () => set({ isOpen: !get().isOpen }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      totalItems: () =>
        get().items.reduce((total, item) => total + item.quantity, 0),

      totalPrice: () =>
        get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        ),
    }),
    {
      name: "yuvara-cart-storage",
      skipHydration: true,
    }
  )
);
