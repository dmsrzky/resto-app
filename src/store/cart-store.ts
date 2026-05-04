// ============================================================
// store/cart-store.ts
// Global state untuk keranjang belanja menggunakan Zustand.
//
// Kenapa Zustand?
// - Lebih ringan dari Redux
// - Tidak butuh Provider wrapper
// - Syntax simpel, cocok untuk state sederhana seperti cart
//
// Install: npm install zustand
// ============================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, MenuItem } from '@/types'

type CartStore = {
  items: CartItem[]

  // Tambah item ke cart. Kalau sudah ada, tambah quantity-nya.
  addItem: (menuItem: MenuItem, notes?: string) => void

  // Kurangi quantity. Kalau quantity jadi 0, item dihapus otomatis.
  removeItem: (menuItemId: string) => void

  // Set quantity langsung (untuk input manual di cart)
  setQuantity: (menuItemId: string, quantity: number) => void

  // Hapus item dari cart sepenuhnya
  deleteItem: (menuItemId: string) => void

  // Kosongkan seluruh cart (setelah order berhasil)
  clearCart: () => void

  // Computed values (dihitung dari items)
  getTotalItems: () => number
  getTotalPrice: () => number
}

export const useCartStore = create<CartStore>()(
  // persist: otomatis simpan cart ke localStorage
  // Jadi kalau user refresh halaman, cart tidak hilang
  persist(
    (set, get) => ({
      items: [],

      addItem: (menuItem, notes) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.menuItem.id === menuItem.id
          )
          if (existing) {
            // Kalau sudah ada, naikkan quantity
            return {
              items: state.items.map((i) =>
                i.menuItem.id === menuItem.id
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            }
          }
          // Kalau belum ada, tambahkan sebagai item baru
          return {
            items: [...state.items, { menuItem, quantity: 1, notes }],
          }
        })
      },

      removeItem: (menuItemId) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.menuItem.id === menuItemId
          )
          if (!existing) return state

          if (existing.quantity <= 1) {
            // Hapus item kalau quantity sudah 1
            return {
              items: state.items.filter(
                (i) => i.menuItem.id !== menuItemId
              ),
            }
          }
          // Kurangi quantity
          return {
            items: state.items.map((i) =>
              i.menuItem.id === menuItemId
                ? { ...i, quantity: i.quantity - 1 }
                : i
            ),
          }
        })
      },

      setQuantity: (menuItemId, quantity) => {
        if (quantity <= 0) {
          get().deleteItem(menuItemId)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.menuItem.id === menuItemId ? { ...i, quantity } : i
          ),
        }))
      },

      deleteItem: (menuItemId) => {
        set((state) => ({
          items: state.items.filter((i) => i.menuItem.id !== menuItemId),
        }))
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (sum, item) => sum + item.menuItem.price * item.quantity,
          0
        )
      },
    }),
    {
      name: 'resto-cart', // key di localStorage
    }
  )
)
