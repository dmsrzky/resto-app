// ============================================================
// app/cart/page.tsx  →  Route: /cart
// Halaman keranjang belanja.
//
// Customer bisa:
// - Review semua item yang sudah dipilih
// - Ubah quantity atau hapus item
// - Lihat subtotal, biaya layanan, dan total akhir
// - Lanjut ke checkout
// ============================================================

'use client'

import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart-store'
import { CartItemRow } from '@/components/cart'
import { Button, EmptyState, Divider } from '@/components/ui'
import { formatRupiah } from '@/lib/mock-data'

// Biaya tambahan (bisa disesuaikan atau diambil dari API)
const SERVICE_FEE = 2000   // biaya layanan flat
const TAX_RATE = 0.11      // PPN 11%

export default function CartPage() {
  const router = useRouter()
  const { items, getTotalPrice, clearCart } = useCartStore()

  const subtotal = getTotalPrice()
  const tax = Math.round(subtotal * TAX_RATE)
  const total = subtotal + SERVICE_FEE + tax

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─── Header ─────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-30">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Kembali
          </button>
          <h1 className="font-semibold text-gray-900">Keranjang</h1>
          {items.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Hapus semua item dari keranjang?')) clearCart()
              }}
              className="ml-auto text-sm text-red-500 hover:text-red-600"
            >
              Hapus semua
            </button>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 pb-32">

        {items.length === 0 ? (
          /* ─── Cart kosong ─────────────────────────────── */
          <EmptyState
            icon="🛒"
            title="Keranjang masih kosong"
            description="Yuk, pilih makanan favorit kamu dari menu kami!"
            action={
              <Button onClick={() => router.push('/')}>
                Lihat Menu
              </Button>
            }
          />
        ) : (
          <>
            {/* ─── Daftar item ─────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 px-4 mb-4">
              {items.map((item, index) => (
                <div key={item.menuItem.id}>
                  <CartItemRow item={item} />
                  {index < items.length - 1 && <Divider />}
                </div>
              ))}
            </div>

            {/* ─── Tombol tambah item lagi ─────────────── */}
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 text-sm text-orange-500 font-medium
                bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors mb-4
                flex items-center justify-center gap-2"
            >
              + Tambah item lagi
            </button>

            {/* ─── Catatan pesanan ─────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
              <h3 className="font-medium text-sm text-gray-700 mb-2">
                Catatan pesanan (opsional)
              </h3>
              <textarea
                placeholder="Contoh: tidak pakai MSG, sajikan terpisah, dll."
                rows={3}
                className="w-full text-sm bg-gray-50 rounded-xl border border-gray-100
                  p-3 resize-none focus:outline-none focus:ring-2 focus:ring-orange-300
                  placeholder:text-gray-400"
              />
            </div>

            {/* ─── Ringkasan harga ─────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-3">Ringkasan Harga</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} item)</span>
                  <span>{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Biaya layanan</span>
                  <span>{formatRupiah(SERVICE_FEE)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>PPN 11%</span>
                  <span>{formatRupiah(tax)}</span>
                </div>
                <Divider className="my-2" />
                <div className="flex justify-between font-semibold text-gray-900 text-base">
                  <span>Total</span>
                  <span className="text-orange-600">{formatRupiah(total)}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* ─── Tombol checkout ─────────────────────────────── */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 z-40">
          <div className="max-w-lg mx-auto">
            <Button
              fullWidth
              size="lg"
              onClick={() => router.push('/checkout')}
            >
              Lanjut ke Pembayaran · {formatRupiah(total)}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
