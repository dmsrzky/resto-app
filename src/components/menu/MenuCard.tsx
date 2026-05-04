// ============================================================
// components/menu/MenuCard.tsx
// Kartu untuk satu item menu. Berisi gambar, nama, harga,
// badge, dan tombol tambah ke cart.
//
// Dipakai di halaman utama (grid menu).
// ============================================================

'use client'

import Image from 'next/image'
import { useState } from 'react'
import { MenuItem } from '@/types'
import { useCartStore } from '@/store/cart-store'
import { formatRupiah } from '@/lib/mock-data'
import { Badge, QuantityControl } from '@/components/ui'

type MenuCardProps = {
  item: MenuItem
}

export function MenuCard({ item }: MenuCardProps) {
  const { items, addItem, removeItem } = useCartStore()
  const [imageError, setImageError] = useState(false)

  // Cek apakah item ini sudah ada di cart dan berapa jumlahnya
  const cartItem = items.find((ci) => ci.menuItem.id === item.id)
  const quantity = cartItem?.quantity ?? 0

  return (
    <div className={`
      bg-white rounded-2xl border border-gray-100 overflow-hidden
      transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
      ${!item.isAvailable ? 'opacity-60' : ''}
    `}>
      {/* Gambar produk */}
      <div className="relative w-full h-40 bg-gray-100">
        {!imageError ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          // Fallback kalau gambar gagal load
          <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
        )}

        {/* Badge di pojok gambar */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {item.isBestSeller && <Badge variant="bestseller">⭐ Best Seller</Badge>}
          {item.isSpicy && <Badge variant="spicy">🌶️ Pedas</Badge>}
          {!item.isAvailable && <Badge variant="unavailable">Habis</Badge>}
        </div>
      </div>

      {/* Info produk */}
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
          {item.name}
        </h3>
        <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">
          {item.description}
        </p>

        {/* Harga + tombol tambah */}
        <div className="flex items-center justify-between">
          <span className="font-bold text-orange-600 text-sm">
            {formatRupiah(item.price)}
          </span>

          {item.isAvailable ? (
            quantity === 0 ? (
              // Tombol tambah pertama kali
              <button
                onClick={() => addItem(item)}
                className="w-8 h-8 rounded-lg bg-orange-500 hover:bg-orange-600
                  flex items-center justify-center text-white transition-colors
                  text-lg font-medium leading-none"
              >
                +
              </button>
            ) : (
              // Kontrol quantity kalau sudah ada di cart
              <QuantityControl
                quantity={quantity}
                onIncrease={() => addItem(item)}
                onDecrease={() => removeItem(item.id)}
              />
            )
          ) : (
            <span className="text-xs text-gray-400">Tidak tersedia</span>
          )}
        </div>
      </div>
    </div>
  )
}
