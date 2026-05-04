'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart-store'
import { CheckoutForm } from '@/types'
import { Button, Divider } from '@/components/ui'

const SERVICE_FEE = 2000
const TAX_RATE = 0.11

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options: {
        onSuccess: (result: unknown) => void
        onPending: (result: unknown) => void
        onError: (result: unknown) => void
        onClose: () => void
      }) => void
    }
  }
}

function InputField({
  label,
  field,
  type = 'text',
  placeholder,
  value,
  error,
  onChange,
}: {
  label: string
  field: string
  type?: string
  placeholder?: string
  value: string
  error?: string
  onChange: (val: string) => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}<span className="text-red-500 ml-0.5">*</span>
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white transition-colors ${error ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 hover:border-gray-300'
          }`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getTotalPrice, clearCart } = useCartStore()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<CheckoutForm>>({})
  const [form, setForm] = useState<CheckoutForm>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    orderType: 'pickup',
    tableNumber: '',
    paymentMethod: 'midtrans',
    notes: '',
  })

  const subtotal = getTotalPrice()
  const tax = Math.round(subtotal * TAX_RATE)
  const total = subtotal + SERVICE_FEE + tax

  useEffect(() => {
    if (items.length === 0) router.replace('/')
  }, [items, router])

  // Load Midtrans Snap.js dari CDN
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js'
    script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '')
    script.async = true
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [])

  const handleChange = (field: keyof CheckoutForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validate = (): boolean => {
    const newErrors: Partial<CheckoutForm> = {}
    if (!form.customerName.trim()) newErrors.customerName = 'Nama wajib diisi'
    if (!form.customerPhone.trim()) newErrors.customerPhone = 'No. HP wajib diisi'
    if (!/^[0-9]{10,13}$/.test(form.customerPhone.replace(/\D/g, ''))) newErrors.customerPhone = 'Format no. HP tidak valid'
    if (!form.customerEmail.trim()) newErrors.customerEmail = 'Email wajib diisi'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail)) newErrors.customerEmail = 'Format email tidak valid'
    if (form.orderType === 'dine_in' && !form.tableNumber?.trim()) newErrors.tableNumber = 'Nomor meja wajib diisi'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setIsLoading(true)

    try {
      // Kirim order ke backend API yang sudah jalan di localhost:3001
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          customerEmail: form.customerEmail,
          orderType: form.orderType === 'dine_in' ? 'DINE_IN' : 'PICKUP',
          tableNumber: form.tableNumber,
          // Backend expect 'MIDTRANS' atau 'CASH' (uppercase)
          paymentMethod: form.paymentMethod === 'midtrans' ? 'MIDTRANS' : 'CASH',
          notes: form.notes,
          items: items.map((i) => ({
            menuItemId: i.menuItem.id,
            quantity: i.quantity,
            notes: i.notes,
          })),
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Gagal membuat pesanan')
      }

      const data = await response.json()
      // data.data = { orderId, snapToken, totalPrice, status }

      if (form.paymentMethod === 'midtrans' && data.data.snapToken) {
        // Tampilkan popup pembayaran Midtrans
        window.snap?.pay(data.data.snapToken, {
          onSuccess: () => {
            if (typeof window !== 'undefined') {
              const existing: string[] = JSON.parse(localStorage.getItem('resto_my_orders') || '[]')
              const updated = [data.data.orderId, ...existing.filter((id: string) => id !== data.data.orderId)].slice(0, 20)
              localStorage.setItem('resto_my_orders', JSON.stringify(updated))
            }
            clearCart()
            router.push(`/order/${data.data.orderId}`)
          },
          onPending: () => { router.push(`/order/${data.data.orderId}`) },
          onError: () => { alert('Pembayaran gagal. Silakan coba lagi.'); setIsLoading(false) },
          onClose: () => { setIsLoading(false) },
        })
      } else {
        // Cash: simpan dulu ke localStorage, baru redirect
        if (typeof window !== 'undefined') {
          const existing: string[] = JSON.parse(localStorage.getItem('resto_my_orders') || '[]')
          const updated = [data.data.orderId, ...existing.filter((id: string) => id !== data.data.orderId)].slice(0, 20)
          localStorage.setItem('resto_my_orders', JSON.stringify(updated))
        }
        clearCart()
        router.push(`/order/${data.data.orderId}`)
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan'
      alert(message)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-30">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">← Kembali</button>
          <h1 className="font-semibold text-gray-900">Checkout</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 pb-36 space-y-4">
        <section className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
          <h2 className="font-semibold text-gray-900">Data Diri</h2>
          <InputField label="Nama lengkap" field="customerName" placeholder="Masukkan nama kamu" value={form.customerName} error={errors.customerName} onChange={(val) => handleChange('customerName', val)} />
          <InputField label="Nomor HP / WhatsApp" field="customerPhone" type="tel" placeholder="08xxxxxxxxxx" value={form.customerPhone} error={errors.customerPhone} onChange={(val) => handleChange('customerPhone', val)} />
          <InputField label="Email" field="customerEmail" type="email" placeholder="nama@email.com" value={form.customerEmail} error={errors.customerEmail} onChange={(val) => handleChange('customerEmail', val)} />
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Tipe Pesanan</h2>
          <div className="grid grid-cols-2 gap-3">
            {(['pickup', 'dine_in'] as const).map((type) => (
              <button key={type} onClick={() => handleChange('orderType', type)}
                className={`p-4 rounded-xl border text-left transition-all ${form.orderType === type ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="text-2xl mb-1">{type === 'pickup' ? '🥡' : '🪑'}</div>
                <div className="font-medium text-sm text-gray-900">{type === 'pickup' ? 'Pickup' : 'Dine-in'}</div>
                <div className="text-xs text-gray-500 mt-0.5">{type === 'pickup' ? 'Ambil sendiri di kasir' : 'Makan di tempat'}</div>
              </button>
            ))}
          </div>
          {form.orderType === 'dine_in' && (
            <div className="mt-4">
              <InputField label="Nomor meja" field="tableNumber" placeholder="Contoh: 12" value={form.tableNumber || ''} error={errors.tableNumber} onChange={(val) => handleChange('tableNumber', val)} />
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Metode Pembayaran</h2>
          <div className="space-y-2">
            {[
              { id: 'midtrans' as const, icon: '💳', label: 'Bayar Online (Midtrans)', desc: 'Transfer, QRIS, kartu kredit, e-wallet' },
              { id: 'cash' as const, icon: '💵', label: 'Bayar di Kasir (Cash)', desc: 'Bayar tunai saat mengambil pesanan' },
            ].map((method) => (
              <button key={method.id} onClick={() => handleChange('paymentMethod', method.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${form.paymentMethod === method.id ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <span className="text-2xl flex-shrink-0">{method.icon}</span>
                <div>
                  <div className="font-medium text-sm text-gray-900">{method.label}</div>
                  <div className="text-xs text-gray-500">{method.desc}</div>
                </div>
                {form.paymentMethod === method.id && <span className="ml-auto text-orange-500 font-bold">✓</span>}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Ringkasan Pesanan</h2>
          <div className="space-y-1.5 mb-3">
            {items.slice(0, 3).map((item) => (
              <div key={item.menuItem.id} className="flex justify-between text-sm text-gray-600">
                <span>{item.menuItem.name} ×{item.quantity}</span>
                <span>{formatRupiah(item.menuItem.price * item.quantity)}</span>
              </div>
            ))}
            {items.length > 3 && <p className="text-xs text-gray-400">+{items.length - 3} item lainnya</p>}
          </div>
          <Divider className="mb-3" />
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatRupiah(subtotal)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Biaya layanan</span><span>{formatRupiah(SERVICE_FEE)}</span></div>
            <div className="flex justify-between text-gray-600"><span>PPN 11%</span><span>{formatRupiah(tax)}</span></div>
            <Divider className="my-2" />
            <div className="flex justify-between font-semibold text-gray-900 text-base">
              <span>Total</span>
              <span className="text-orange-600">{formatRupiah(total)}</span>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 z-40">
        <div className="max-w-lg mx-auto">
          <Button fullWidth size="lg" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Memproses...
              </span>
            ) : `Pesan Sekarang · ${formatRupiah(total)}`}
          </Button>
          <p className="text-center text-xs text-gray-400 mt-2">Dengan memesan, kamu setuju dengan syarat & ketentuan kami</p>
        </div>
      </div>
    </div>
  )
}
