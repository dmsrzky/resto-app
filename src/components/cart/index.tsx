'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { CartItem } from '@/types'
import { useCartStore } from '@/store/cart-store'
import { formatRupiah } from '@/lib/mock-data'
import { QuantityControl } from '@/components/ui'
import { useState, useEffect } from 'react'

// ============================================================
// CartFloatingButton
// Tombol melayang di bagian bawah halaman menu.
// Muncul hanya kalau cart tidak kosong.
// ============================================================

export function CartFloatingButton() {
  const router = useRouter()
  const { getTotalItems, getTotalPrice } = useCartStore()
  const [mounted, setMounted] = useState(false)

  // ← tambah ini
  useEffect(() => {
    setMounted(true)
  }, [])

  const totalItems = getTotalItems()
  const totalPrice = getTotalPrice()

  if (!mounted || totalItems === 0) return null

  return (
    <div className="sticky bottom-4 left-0 right-0 px-4 mt-4 z-40">
      <button
        onClick={() => router.push('/cart')}
        className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.98]
          text-white rounded-2xl px-5 py-4 flex items-center justify-between
          transition-all duration-150 shadow-lg"
      >
        <span className="bg-orange-600 rounded-lg px-2 py-1 text-sm font-bold min-w-[28px] text-center">
          {totalItems}
        </span>
        <span className="font-semibold">Lihat Pesanan</span>
        <span className="font-semibold">{formatRupiah(totalPrice)}</span>
      </button>
    </div>
  )
}

// ============================================================
// CartItemRow
// Satu baris item di halaman cart.
// ============================================================

export function CartItemRow({ item }: { item: CartItem }) {
  const { addItem, removeItem, deleteItem } = useCartStore()
  const [imageError, setImageError] = useState(false)

  const subtotal = item.menuItem.price * item.quantity

  return (
    <div className="flex gap-3 py-4">
      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
        {!imageError ? (
          <Image
            src={item.menuItem.image}
            alt={item.menuItem.name}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="font-medium text-sm text-gray-900 leading-tight">{item.menuItem.name}</h4>
          <button
            onClick={() => deleteItem(item.menuItem.id)}
            className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 text-lg leading-none"
          >
            ×
          </button>
        </div>

        {item.notes && (
          <p className="text-xs text-gray-400 mb-2 italic">&quot;{item.notes}&quot;</p>
        )}

        <div className="flex items-center justify-between">
          <QuantityControl
            quantity={item.quantity}
            onIncrease={() => addItem(item.menuItem)}
            onDecrease={() => removeItem(item.menuItem.id)}
            min={0}
          />
          <span className="font-semibold text-sm text-gray-900">
            {formatRupiah(subtotal)}
          </span>
        </div>
      </div>
    </div>
  )
}