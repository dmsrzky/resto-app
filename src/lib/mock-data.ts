// lib/mock-data.ts
// menuItems dan categories di sini sudah tidak dipakai di halaman utama
// karena data sekarang diambil dari API backend.
// File ini tetap ada karena formatRupiah masih dipakai di beberapa komponen
// seperti MenuCard, CartItemRow, dan CartFloatingButton.

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}
