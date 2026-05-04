'use client'
// src/app/page.tsx
// UPDATED: tambah tombol "Cek Pesanan" di header supaya customer
// bisa langsung akses halaman /pesanan dari halaman menu utama.

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { MenuItem, Category } from '@/types'
import { MenuCard } from '@/components/menu/MenuCard'
import { CartFloatingButton } from '@/components/cart'

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(amount)
}

export default function MenuPage() {
  const router = useRouter()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [menuRes, catRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/menu`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/menu/categories`),
        ])
        const menuData = await menuRes.json()
        const catData = await catRes.json()
        setMenuItems(menuData.data || [])
        setCategories([{ id: 'all', name: 'Semua', slug: 'all' }, ...(catData.data || [])])
      } catch (error) {
        console.error('Gagal fetch menu:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCategory =
        activeCategory === 'all' ||
        categories.find((c) => c.slug === activeCategory)?.id === item.categoryId
      const matchSearch =
        searchQuery === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchCategory && matchSearch
    })
  }, [activeCategory, searchQuery, menuItems, categories])

  const showBestSellers = activeCategory === 'all' && searchQuery === ''
  const bestSellers = menuItems.filter((i) => i.isBestSeller && i.isAvailable)
  const regularItems = showBestSellers ? filteredItems.filter((i) => !i.isBestSeller) : filteredItems

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 pt-6 pb-0 sticky top-0 z-30">
        <div className="max-w-lg mx-auto">

          {/* Nama resto + tombol Cek Pesanan */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Warung Barokah 🍜</h1>
              <p className="text-sm text-gray-500 mt-0.5">Jl. Raya Darmo No. 12 · Buka sampai 22:00</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Status buka */}
              <div className="flex items-center gap-1 bg-green-50 text-green-700 text-xs font-medium px-2 py-1 rounded-full border border-green-200">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                Buka
              </div>
              {/* Tombol cek pesanan — BARU */}
              <button
                onClick={() => router.push('/pesanan')}
                className="flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-medium px-3 py-1.5 rounded-full border border-orange-200 transition-colors"
              >
                🧾 Pesanan
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative mb-3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Cari makanan atau minuman..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm border-0 focus:outline-none focus:ring-2 focus:ring-orange-300 placeholder:text-gray-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">×</button>
            )}
          </div>

          {/* Tab kategori */}
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide -mx-4 px-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.slug)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
                  activeCategory === cat.slug
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 pb-32">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="w-full h-40 bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {showBestSellers && bestSellers.length > 0 && (
              <section className="mb-6">
                <h2 className="font-semibold text-gray-900 mb-3">⭐ Best Seller</h2>
                <div className="grid grid-cols-2 gap-3">
                  {bestSellers.map((item) => <MenuCard key={item.id} item={item} />)}
                </div>
              </section>
            )}

            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-5xl mb-3">🔍</div>
                <h3 className="font-semibold text-gray-800">Tidak ditemukan</h3>
                <p className="text-sm text-gray-500 mt-1">Coba cari dengan kata kunci lain</p>
                <button onClick={() => { setSearchQuery(''); setActiveCategory('all') }} className="mt-4 text-sm text-orange-500 font-medium hover:underline">
                  Reset pencarian
                </button>
              </div>
            ) : (
              <section>
                {showBestSellers && regularItems.length > 0 && (
                  <h2 className="font-semibold text-gray-900 mb-3">Menu Lainnya</h2>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {(showBestSellers ? regularItems : filteredItems).map((item) => (
                    <MenuCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <div className="max-w-lg mx-auto px-4">
        <CartFloatingButton />
      </div>
    </div>
  )
}
