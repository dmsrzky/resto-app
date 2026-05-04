'use client'
// src/app/pesanan/page.tsx
// UPDATED: baca order ID dari localStorage, fetch detail tiap order dari API.
// Customer tidak perlu input nomor HP — pesanan otomatis muncul.
// Tetap ada opsi "Cari by nomor HP" sebagai fallback kalau ganti browser.

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type OrderItem = {
  id: string
  quantity: number
  price: number
  menuItem: { name: string }
}

type Order = {
  id: string
  status: string
  orderType: string
  tableNumber?: string
  paymentMethod: string
  totalPrice: number
  createdAt: string
  customerName: string
  items: OrderItem[]
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(amount)
}

const STATUS_INFO: Record<string, { label: string; color: string; icon: string }> = {
  PENDING_PAYMENT: { label: 'Menunggu Pembayaran', color: 'bg-yellow-100 text-yellow-800', icon: '💳' },
  PAID: { label: 'Pembayaran Dikonfirmasi', color: 'bg-blue-100 text-blue-800', icon: '✅' },
  PREPARING: { label: 'Sedang Dimasak', color: 'bg-orange-100 text-orange-800', icon: '👨‍🍳' },
  READY: { label: 'Siap Diambil', color: 'bg-green-100 text-green-800', icon: '🥡' },
  COMPLETED: { label: 'Selesai', color: 'bg-gray-100 text-gray-600', icon: '🎉' },
  CANCELLED: { label: 'Dibatalkan', color: 'bg-red-100 text-red-700', icon: '❌' },
}

const ACTIVE_STATUSES = ['PENDING_PAYMENT', 'PAID', 'PREPARING', 'READY']
const STORAGE_KEY = 'resto_my_orders'

export default function PesananPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showSearch, setShowSearch] = useState(false)
  const [phone, setPhone] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  // Baca order ID dari localStorage lalu fetch detail tiap order
  useEffect(() => {
    async function loadOrders() {
      try {
        if (typeof window === 'undefined') return  // ← tambahkan baris ini
        const ids: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
        if (ids.length === 0) {
          setIsLoading(false)
          return
        }

        // Fetch semua order secara paralel
        const results = await Promise.allSettled(
          ids.map((id) =>
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${id}`)
              .then((r) => r.json())
              .then((d) => d.data)
          )
        )

        const loaded = results
          .filter((r): r is PromiseFulfilledResult<Order> => r.status === 'fulfilled' && !!r.value)
          .map((r) => r.value)
          // Urutkan: aktif dulu, lalu terbaru
          .sort((a, b) => {
            const aActive = ACTIVE_STATUSES.includes(a.status) ? 1 : 0
            const bActive = ACTIVE_STATUSES.includes(b.status) ? 1 : 0
            if (aActive !== bActive) return bActive - aActive
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          })

        setOrders(loaded)
      } catch (err) {
        console.error('Gagal load orders:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadOrders()
  }, [])

  // Cari by nomor HP sebagai fallback
  const handleSearch = async () => {
    if (!phone.trim()) { setSearchError('Masukkan nomor HP dulu'); return }
    setIsSearching(true)
    setSearchError('')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders?phone=${encodeURIComponent(phone)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const found: Order[] = data.data || []

      // Simpan order ID yang ditemukan ke localStorage
      const existing: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      const newIds = found.map((o) => o.id)
      const merged = [...new Set([...newIds, ...existing])].slice(0, 20)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))

      // Merge dengan order yang sudah ada, hindari duplikat
      setOrders((prev) => {
        const existingIds = new Set(prev.map((o) => o.id))
        const newOrders = found.filter((o) => !existingIds.has(o.id))
        return [...newOrders, ...prev].sort((a, b) => {
          const aActive = ACTIVE_STATUSES.includes(a.status) ? 1 : 0
          const bActive = ACTIVE_STATUSES.includes(b.status) ? 1 : 0
          if (aActive !== bActive) return bActive - aActive
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
      })
      setShowSearch(false)
      setPhone('')
    } catch (err: any) {
      setSearchError(err.message || 'Terjadi kesalahan')
    } finally {
      setIsSearching(false)
    }
  }

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status))
  const pastOrders = orders.filter((o) => !ACTIVE_STATUSES.includes(o.status))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-30">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} className="text-gray-500 hover:text-gray-700">← Menu</button>
            <h1 className="font-semibold text-gray-900">Pesananku</h1>
          </div>
          {/* Tombol cari by nomor HP — fallback kalau ganti browser */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="text-sm text-orange-500 hover:text-orange-600 font-medium"
          >
            🔍 Cari
          </button>
        </div>

        {/* Panel cari by nomor HP (collapsed by default) */}
        {showSearch && (
          <div className="max-w-lg mx-auto mt-3 pb-1">
            <p className="text-xs text-gray-500 mb-2">Pernah pesan di browser lain? Cari dengan nomor HP:</p>
            <div className="flex gap-2">
              <input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setSearchError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="08xxxxxxxxxx"
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
              >
                {isSearching ? '...' : 'Cari'}
              </button>
            </div>
            {searchError && <p className="text-red-500 text-xs mt-1">{searchError}</p>}
          </div>
        )}
      </header>

      <main className="max-w-lg mx-auto px-4 pt-5 pb-12">

        {isLoading ? (
          // Skeleton loading
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          // Belum ada pesanan
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🧾</div>
            <h3 className="font-semibold text-gray-800 mb-1">Belum ada pesanan</h3>
            <p className="text-sm text-gray-500 mb-6">Pesananmu akan muncul di sini setelah kamu order</p>
            <button
              onClick={() => router.push('/')}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
            >
              Lihat Menu
            </button>
            <p className="text-xs text-gray-400 mt-4">
              Pernah pesan sebelumnya?{' '}
              <button onClick={() => setShowSearch(true)} className="text-orange-500 hover:underline">
                Cari dengan nomor HP
              </button>
            </p>
          </div>
        ) : (
          <>
            {/* Pesanan aktif */}
            {activeOrders.length > 0 && (
              <section className="mb-5">
                <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse inline-block" />
                  Sedang Berjalan ({activeOrders.length})
                </h2>
                <div className="space-y-3">
                  {activeOrders.map((order) => (
                    <OrderCard key={order.id} order={order} isActive onClick={() => router.push(`/order/${order.id}`)} />
                  ))}
                </div>
              </section>
            )}

            {/* Riwayat */}
            {pastOrders.length > 0 && (
              <section>
                <h2 className="text-sm font-medium text-gray-500 mb-3">Riwayat</h2>
                <div className="space-y-3">
                  {pastOrders.map((order) => (
                    <OrderCard key={order.id} order={order} isActive={false} onClick={() => router.push(`/order/${order.id}`)} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}

// ─── Komponen kartu order ─────────────────────────────────────
function OrderCard({ order, isActive, onClick }: { order: Order; isActive: boolean; onClick: () => void }) {
  const statusInfo = STATUS_INFO[order.status]
  const itemNames = order.items.map((i) => `${i.menuItem.name} ×${i.quantity}`).join(', ')

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-md active:scale-[0.99] ${isActive ? 'border-orange-200 ring-1 ring-orange-100' : 'border-gray-100'
        }`}
    >
      {/* Status bar atas — hanya untuk pesanan aktif */}
      {isActive && (
        <div className="bg-orange-500 px-4 py-1.5 flex items-center justify-between">
          <span className="text-white text-xs font-medium">{statusInfo?.icon} {statusInfo?.label}</span>
          <span className="text-orange-200 text-xs">Tap untuk detail →</span>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <p className="font-semibold text-sm text-gray-900">#{order.id.slice(-8).toUpperCase()}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(order.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
            </p>
          </div>
          {!isActive && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${statusInfo?.color}`}>
              {statusInfo?.icon} {statusInfo?.label}
            </span>
          )}
        </div>

        <p className="text-xs text-gray-500 line-clamp-1 mb-2">{itemNames}</p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {order.orderType === 'PICKUP' ? '🥡 Pickup' : `🪑 Meja ${order.tableNumber}`}
            {' · '}
            {order.paymentMethod === 'MIDTRANS' ? '💳' : '💵'}
          </span>
          <span className="font-bold text-sm text-orange-600">{formatRupiah(order.totalPrice)}</span>
        </div>
      </div>
    </button>
  )
}
