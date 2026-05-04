'use client'
// src/app/admin/orders/page.tsx
// Halaman daftar semua order masuk.
// Admin bisa filter berdasarkan status dan update status order.

import { useState, useEffect, useCallback } from 'react'
import { useAdminStore } from '@/store/admin-store'
import { apiFetch } from '@/lib/api'

type OrderItem = {
  id: string
  quantity: number
  price: number
  menuItem: { name: string }
}

type Order = {
  id: string
  customerName: string
  customerPhone: string
  customerEmail: string
  orderType: string
  tableNumber?: string
  status: string
  paymentMethod: string
  totalPrice: number
  notes?: string
  createdAt: string
  items: OrderItem[]
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING_PAYMENT: { label: 'Menunggu Bayar', color: 'bg-yellow-100 text-yellow-800' },
  PAID: { label: 'Lunas', color: 'bg-blue-100 text-blue-800' },
  PREPARING: { label: 'Dimasak', color: 'bg-orange-100 text-orange-800' },
  READY: { label: 'Siap Diambil', color: 'bg-green-100 text-green-800' },
  COMPLETED: { label: 'Selesai', color: 'bg-gray-100 text-gray-600' },
  CANCELLED: { label: 'Dibatalkan', color: 'bg-red-100 text-red-700' },
}

// Status berikutnya setelah status saat ini
const NEXT_STATUS: Record<string, string> = {
  PAID: 'PREPARING',
  PREPARING: 'READY',
  READY: 'COMPLETED',
}

const STATUS_FILTERS = ['Semua', 'PENDING_PAYMENT', 'PAID', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED']

export default function AdminOrdersPage() {
  const { token } = useAdminStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('Semua')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      // Default: sembunyikan PENDING_PAYMENT kecuali admin aktif filter ke sana
      const params = activeFilter !== 'Semua'
        ? `?status=${activeFilter}`
        : '?exclude=PENDING_PAYMENT&exclude=CANCELLED'
      const data = await apiFetch(`/api/admin/orders${params}`, {}, token || '')
      setOrders(data.data.orders || [])
    } catch (err) {
      console.error('Gagal fetch orders:', err)
    } finally {
      setIsLoading(false)
    }
  }, [activeFilter, token])

  useEffect(() => {
    fetchOrders()
    // Auto refresh setiap 15 detik
    const interval = setInterval(fetchOrders, 15_000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId)
    try {
      await apiFetch(
        `/api/admin/orders/${orderId}/status`,
        { method: 'PATCH', body: JSON.stringify({ status: newStatus }) },
        token || ''
      )
      // Update local state tanpa fetch ulang
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      )
    } catch (err: any) {
      alert(err.message || 'Gagal update status')
    } finally {
      setUpdatingId(null)
    }
  }

  const pendingCount = orders.filter((o) => ['PAID', 'PREPARING'].includes(o.status)).length

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pesanan Masuk</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {pendingCount > 0 ? `${pendingCount} pesanan perlu diproses` : 'Semua pesanan sudah diproses'}
          </p>
        </div>
        <button onClick={fetchOrders} className="text-sm text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1">
          🔄 Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeFilter === f ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
          >
            {f === 'Semua' ? 'Semua' : STATUS_LABELS[f]?.label}
          </button>
        ))}
      </div>

      {/* Order list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
              <div className="flex justify-between mb-2">
                <div className="h-4 bg-gray-200 rounded w-32" />
                <div className="h-5 bg-gray-100 rounded-full w-20" />
              </div>
              <div className="h-3 bg-gray-100 rounded w-48" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-3">📋</div>
          <p className="font-medium text-gray-700">Tidak ada pesanan</p>
          <p className="text-sm text-gray-400 mt-1">Belum ada pesanan masuk untuk filter ini</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const statusInfo = STATUS_LABELS[order.status]
            const nextStatus = NEXT_STATUS[order.status]
            const isExpanded = expandedId === order.id
            const isUpdating = updatingId === order.id

            return (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Order header */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-sm text-gray-900">#{order.id.slice(-8).toUpperCase()}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo?.color}`}>
                          {statusInfo?.label}
                        </span>
                        <span className="text-xs text-gray-400">
                          {order.orderType === 'PICKUP' ? '🥡 Pickup' : `🪑 Meja ${order.tableNumber}`}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 font-medium">{order.customerName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {order.items.length} item · {formatRupiah(order.totalPrice)} · {order.paymentMethod === 'MIDTRANS' ? '💳 Online' : '💵 Cash'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(order.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>
                    <span className="text-gray-400 text-sm flex-shrink-0">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Order detail (expand) */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
                    {/* Items */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Item Pesanan</p>
                      <div className="space-y-1">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-gray-700">{item.menuItem.name} <span className="text-gray-400">×{item.quantity}</span></span>
                            <span className="text-gray-900 font-medium">{formatRupiah(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Customer info */}
                    <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 space-y-1">
                      <p>📞 {order.customerPhone}</p>
                      <p>📧 {order.customerEmail}</p>
                      {order.notes && <p>📝 {order.notes}</p>}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {nextStatus && (
                        <button
                          onClick={() => updateStatus(order.id, nextStatus)}
                          disabled={isUpdating}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors"
                        >
                          {isUpdating ? 'Memproses...' : `✓ Tandai: ${STATUS_LABELS[nextStatus]?.label}`}
                        </button>
                      )}
                      {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
                        <button
                          onClick={() => {
                            if (confirm('Batalkan pesanan ini?')) updateStatus(order.id, 'CANCELLED')
                          }}
                          disabled={isUpdating}
                          className="px-4 py-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-sm font-medium transition-colors"
                        >
                          Batalkan
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
