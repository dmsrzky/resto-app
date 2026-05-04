// ============================================================
// types/index.ts
// Semua tipe data yang dipakai di seluruh aplikasi.
// Definisikan di satu tempat supaya konsisten.
// ============================================================

export type Category = {
  id: string
  name: string
  slug: string
}

export type MenuItem = {
  id: string
  name: string
  description: string
  price: number          // dalam Rupiah (integer)
  image: string          // URL gambar
  categoryId: string
  isAvailable: boolean
  isBestSeller?: boolean
  isSpicy?: boolean
}

export type CartItem = {
  menuItem: MenuItem
  quantity: number
  notes?: string         // catatan khusus per item, misal "tanpa bawang"
}

export type OrderStatus =
  | 'pending_payment'    // menunggu pembayaran
  | 'paid'               // pembayaran berhasil
  | 'preparing'          // sedang dimasak
  | 'ready'              // siap diambil
  | 'completed'          // selesai
  | 'cancelled'          // dibatalkan

export type Order = {
  id: string
  items: CartItem[]
  customerName: string
  customerPhone: string
  customerEmail: string
  orderType: 'dine_in' | 'pickup'
  tableNumber?: string   // hanya untuk dine-in
  status: OrderStatus
  paymentMethod: 'midtrans' | 'cash'
  paymentToken?: string  // token dari Midtrans
  totalPrice: number
  createdAt: string      // ISO date string
}

export type CheckoutForm = {
  customerName: string
  customerPhone: string
  customerEmail: string
  orderType: 'dine_in' | 'pickup'
  tableNumber?: string
  paymentMethod: 'midtrans' | 'cash'
  notes?: string
}
