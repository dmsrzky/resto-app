'use client'
// src/app/admin/laporan/page.tsx
// Halaman laporan admin:
// - Ringkasan hari ini (pendapatan, order, selesai)
// - Grafik pendapatan 7 hari terakhir
// - Menu terlaris bulan ini
// - Export Excel dengan filter tanggal

import { useState, useEffect } from 'react'
import { useAdminStore } from '@/store/admin-store'
import { apiFetch } from '@/lib/api'

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(amount)
}

type ChartData = { date: string; revenue: number; orderCount: number }
type MenuTerlaris = { name: string; qty: number; revenue: number }
type Summary = {
  today: { revenue: number; orderCount: number; completed: number; pending: number; cancelled: number }
  month: { revenue: number; orderCount: number }
  chartData: ChartData[]
  terlaris: MenuTerlaris[]
  paymentStats: { midtrans: number; cash: number }
}

export default function LaporanPage() {
  const { token } = useAdminStore()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [exportFrom, setExportFrom] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().split('T')[0]
  })
  const [exportTo, setExportTo] = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => {
    async function fetchSummary() {
      try {
        const data = await apiFetch('/api/admin/laporan/summary', {}, token || '')
        setSummary(data.data)
      } catch (err) {
        console.error('Gagal fetch laporan:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSummary()
  }, [token])

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/laporan/export?from=${exportFrom}&to=${exportTo}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error('Gagal export')

      // Download file
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `laporan-${exportFrom}-${exportTo}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Gagal export Excel')
    } finally {
      setIsExporting(false)
    }
  }

  // Hitung max revenue untuk skala grafik
  const maxRevenue = summary
    ? Math.max(...summary.chartData.map((d) => d.revenue), 1)
    : 1

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Laporan</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-orange-500 hover:text-orange-600 font-medium"
        >
          🔄 Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
              <div className="h-8 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : summary ? (
        <div className="space-y-5">

          {/* ── Statistik hari ini ── */}
          <section>
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Hari Ini</h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              {[
                { label: 'Pendapatan', value: formatRupiah(summary.today.revenue), icon: '💰', color: 'bg-orange-50 border-orange-200' },
                { label: 'Total Order', value: String(summary.today.orderCount), icon: '📋', color: 'bg-blue-50 border-blue-200' },
                { label: 'Selesai', value: String(summary.today.completed), icon: '✅', color: 'bg-green-50 border-green-200' },
                { label: 'Diproses', value: String(summary.today.pending), icon: '⏳', color: 'bg-yellow-50 border-yellow-200' },
                { label: 'Dibatalkan', value: String(summary.today.cancelled), icon: '❌', color: 'bg-red-50 border-red-200' },
              ].map((stat) => (
                <div key={stat.label} className={`bg-white rounded-2xl border p-4 ${stat.color}`}>
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Statistik bulan ini ── */}
          <section>
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Bulan Ini</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-xs text-gray-500 mb-1">Total Pendapatan</p>
                <p className="text-xl font-bold text-orange-600">{formatRupiah(summary.month.revenue)}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-xs text-gray-500 mb-1">Total Order</p>
                <p className="text-xl font-bold text-gray-900">{summary.month.orderCount} order</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Rata-rata {summary.month.orderCount > 0
                    ? formatRupiah(Math.round(summary.month.revenue / summary.month.orderCount))
                    : 'Rp 0'} / order
                </p>
              </div>
            </div>
          </section>

          {/* ── Grafik 7 hari terakhir ── */}
          <section className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Pendapatan 7 Hari Terakhir</h2>
            <div className="flex items-end gap-2 h-36">
              {summary.chartData.map((day, i) => {
                const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded-lg px-2 py-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {formatRupiah(day.revenue)}<br />
                      {day.orderCount} order
                    </div>
                    {/* Bar */}
                    <div className="w-full flex items-end" style={{ height: '120px' }}>
                      <div
                        className="w-full bg-orange-400 hover:bg-orange-500 rounded-t-lg transition-all duration-300 cursor-pointer"
                        style={{ height: `${Math.max(height, day.revenue > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                    {/* Label tanggal */}
                    <p className="text-xs text-gray-400 text-center leading-tight">{day.date}</p>
                  </div>
                )
              })}
            </div>
          </section>

          {/* ── Menu terlaris + metode bayar ── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Menu terlaris */}
            <section className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 mb-3">🏆 Menu Terlaris Bulan Ini</h2>
              {summary.terlaris.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Belum ada data</p>
              ) : (
                <div className="space-y-3">
                  {summary.terlaris.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-yellow-100 text-yellow-700' :
                          i === 1 ? 'bg-gray-100 text-gray-600' :
                            'bg-orange-50 text-orange-600'
                        }`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.qty} porsi terjual</p>
                      </div>
                      <span className="text-sm font-medium text-orange-600 flex-shrink-0">
                        {formatRupiah(item.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Metode pembayaran */}
            <section className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 mb-3">💳 Metode Pembayaran Hari Ini</h2>
              <div className="space-y-3">
                {[
                  { label: 'Online (Midtrans)', value: summary.paymentStats.midtrans, icon: '💳', color: 'bg-blue-500' },
                  { label: 'Cash', value: summary.paymentStats.cash, icon: '💵', color: 'bg-green-500' },
                ].map((method) => {
                  const total = summary.paymentStats.midtrans + summary.paymentStats.cash
                  const pct = total > 0 ? Math.round((method.value / total) * 100) : 0
                  return (
                    <div key={method.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{method.icon} {method.label}</span>
                        <span className="font-medium">{method.value} order ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`${method.color} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>

          {/* ── Export Excel ── */}
          <section className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-1">📥 Export Laporan Excel</h2>
            <p className="text-sm text-gray-500 mb-4">Download data transaksi dalam format Excel (.xlsx)</p>

            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Dari tanggal</label>
                <input
                  type="date"
                  value={exportFrom}
                  onChange={(e) => setExportFrom(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Sampai tanggal</label>
                <input
                  type="date"
                  value={exportTo}
                  onChange={(e) => setExportTo(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors flex items-center gap-2"
              >
                {isExporting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Mengexport...
                  </>
                ) : (
                  <>📊 Download Excel</>
                )}
              </button>
            </div>

            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-xs text-blue-700">
                💡 <strong>Laporan otomatis</strong> — sistem akan mengirimkan ringkasan laporan harian ke email admin setiap malam jam 23:00 WIB beserta file Excel terlampir.
              </p>
            </div>
          </section>

        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-5xl mb-3">📊</div>
          <p className="text-gray-500">Gagal memuat data laporan</p>
          <button onClick={() => window.location.reload()} className="mt-3 text-orange-500 text-sm hover:underline">
            Coba lagi
          </button>
        </div>
      )}
    </div>
  )
}
