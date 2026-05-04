'use client'
// src/app/order/[id]/page.tsx
// UPDATED: simpan order ID ke localStorage saat halaman ini pertama dibuka.
// Nanti dipakai di halaman /pesanan untuk tampilkan riwayat tanpa input nomor HP.

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Order, OrderStatus } from '@/types'
import { StatusBadge, Button, Divider, LoadingSpinner } from '@/components/ui'

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(amount)
}

const STATUS_STEPS: { status: OrderStatus; label: string; icon: string }[] = [
  { status: 'pending_payment', label: 'Menunggu\nPembayaran', icon: '💳' },
  { status: 'paid', label: 'Pembayaran\nDikonfirmasi', icon: '✅' },
  { status: 'preparing', label: 'Sedang\nDimasak', icon: '👨‍🍳' },
  { status: 'ready', label: 'Siap\nDiambil', icon: '🥡' },
  { status: 'completed', label: 'Selesai', icon: '🎉' },
]

function mapStatus(backendStatus: string): OrderStatus {
  const map: Record<string, OrderStatus> = {
    PENDING_PAYMENT: 'pending_payment',
    PAID: 'paid',
    PREPARING: 'preparing',
    READY: 'ready',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  }
  return map[backendStatus] || 'pending_payment'
}

function getStepIndex(status: OrderStatus): number {
  return STATUS_STEPS.findIndex((s) => s.status === status)
}

// ─── Helper localStorage ──────────────────────────────────────
// Simpan max 20 order ID terakhir di browser customer
const STORAGE_KEY = 'resto_my_orders'

function saveOrderToLocal(orderId: string) {
  try {
    if (typeof window === 'undefined') return  // ← tambahkan baris ini
    const existing: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    // Hindari duplikat, taruh yang baru di depan
    const updated = [orderId, ...existing.filter((id) => id !== orderId)].slice(0, 20)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // Abaikan error localStorage (misal: private mode)
  }
}

export default function OrderStatusPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchOrder = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${id}`)
      if (!res.ok) throw new Error('Order tidak ditemukan')
      const data = await res.json()
      const raw = data.data
      const mapped: Order = {
        id: raw.id,
        customerName: raw.customerName,
        customerPhone: raw.customerPhone,
        customerEmail: raw.customerEmail,
        orderType: raw.orderType === 'DINE_IN' ? 'dine_in' : 'pickup',
        tableNumber: raw.tableNumber,
        status: mapStatus(raw.status),
        paymentMethod: raw.paymentMethod === 'MIDTRANS' ? 'midtrans' : 'cash',
        totalPrice: raw.totalPrice,
        createdAt: raw.createdAt,
        items: raw.items.map((item: any) => ({
          menuItem: item.menuItem,
          quantity: item.quantity,
          notes: item.notes,
        })),
      }
      setOrder(mapped)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Gagal fetch order:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js'
    script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '')
    script.async = true
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [])

  useEffect(() => {
    // Simpan order ID ke localStorage
    if (typeof window !== 'undefined' && id) {
      saveOrderToLocal(id as string)
    }

    fetchOrder()
    const interval = setInterval(fetchOrder, 10_000)
    return () => clearInterval(interval)
  }, [id])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-500 mt-3">Memuat pesanan...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <div className="text-5xl">😕</div>
        <h2 className="font-semibold text-gray-800">Pesanan tidak ditemukan</h2>
        <Button onClick={() => router.push('/')}>Kembali ke Menu</Button>
      </div>
    )
  }

  const currentStepIndex = getStepIndex(order.status)
  const isCancelled = order.status === 'cancelled'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-gray-900">Status Pesanan</h1>
            <p className="text-sm text-gray-500 mt-0.5">#{order.id}</p>
          </div>
          {/* Tombol ke halaman semua pesanan */}
          <button
            onClick={() => router.push('/pesanan')}
            className="text-sm text-orange-500 hover:text-orange-600 font-medium"
          >
            🧾 Pesananku
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 pb-8 space-y-4">
        <section className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
          {!isCancelled && (
            <div className="text-5xl mb-3">
              {STATUS_STEPS[Math.min(currentStepIndex, STATUS_STEPS.length - 1)]?.icon}
            </div>
          )}
          <StatusBadge status={order.status} />
          <p className="text-xs text-gray-400 mt-2">Terakhir diperbarui: {lastUpdated.toLocaleTimeString('id-ID')}</p>
          <button onClick={fetchOrder} className="text-xs text-orange-500 hover:underline mt-1">Perbarui</button>
        </section>

        {!isCancelled && (
          <section className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-start justify-between relative">
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-100 mx-8" />
              <div
                className="absolute top-4 left-0 h-0.5 bg-orange-400 mx-8 transition-all duration-500"
                style={{ width: `calc(${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}% - 4rem)`, maxWidth: 'calc(100% - 4rem)' }}
              />
              {STATUS_STEPS.map((step, index) => {
                const isDone = index <= currentStepIndex
                const isCurrent = index === currentStepIndex
                return (
                  <div key={step.status} className="flex flex-col items-center gap-1.5 relative z-10 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-300 ${isCurrent ? 'bg-orange-500 text-white ring-4 ring-orange-100' : isDone ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-300'}`}>
                      {isDone ? (isCurrent ? step.icon : '✓') : '○'}
                    </div>
                    <p className="text-center text-xs text-gray-500 leading-tight whitespace-pre-line">{step.label}</p>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        <section className="bg-white rounded-2xl border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Info Pesanan</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Nama</span><span className="font-medium">{order.customerName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">No. HP</span><span>{order.customerPhone}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Tipe</span><span>{order.orderType === 'pickup' ? '🥡 Pickup' : `🪑 Dine-in (Meja ${order.tableNumber})`}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Pembayaran</span><span>{order.paymentMethod === 'midtrans' ? '💳 Online' : '💵 Cash'}</span></div>
            <div className="flex justify-between">
              <span className="text-gray-500">Waktu pesan</span>
              <span>{new Date(order.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Detail Pesanan</h2>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.menuItem.id} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.menuItem.name}<span className="text-gray-400"> ×{item.quantity}</span></span>
                <span className="font-medium">{formatRupiah(item.menuItem.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <Divider className="my-3" />
          <div className="flex justify-between font-semibold text-gray-900">
            <span>Total</span>
            <span className="text-orange-600">{formatRupiah(order.totalPrice)}</span>
          </div>
        </section>

        <div className="flex flex-col gap-3">
          {order.status === 'pending_payment' && order.paymentMethod === 'midtrans' && (
            <button
              onClick={async () => {
                try {
                  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${order.id}/snap-token`)
                  const data = await res.json()
                  if (data.data?.snapToken) {
                    window.snap?.pay(data.data.snapToken, {
                      onSuccess: () => fetchOrder(),
                      onPending: () => fetchOrder(),
                      onError: () => alert('Pembayaran gagal'),
                      onClose: () => { },
                    })
                  }
                } catch {
                  alert('Gagal membuka pembayaran')
                }
              }}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              💳 Bayar Sekarang
            </button>
          )}
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => router.push('/')}>Kembali ke Menu</Button>
            {order.status === 'ready' && <Button fullWidth>Konfirmasi Diterima</Button>}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">
          Ada masalah?{' '}
          <a href="https://wa.me/6281234567890" className="text-orange-500 hover:underline">Hubungi kami via WhatsApp</a>
        </p>
      </main>
    </div>
  )
}
