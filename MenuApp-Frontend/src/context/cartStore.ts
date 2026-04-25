import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem } from '../types';

export type { CartItem };

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (newItem) => {
        const existingItem = get().items.find((i) => i.productId === newItem.productId);
        if (existingItem) {
          set({
            items: get().items.map((i) =>
              i.productId === newItem.productId
                ? { ...i, cantidad: i.cantidad + newItem.cantidad }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, newItem] });
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((acc, item) => acc + item.precio * item.cantidad, 0),
    }),
    {
      name: 'menuapp-cart',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
