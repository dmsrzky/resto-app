'use client'
// src/app/admin/menu/page.tsx
// Halaman manajemen menu.
// Admin bisa: tambah, edit, hapus, dan toggle ketersediaan menu item.

import { useState, useEffect } from 'react'
import { useAdminStore } from '@/store/admin-store'
import { apiFetch } from '@/lib/api'

type Category = { id: string; name: string; slug: string }
type MenuItem = {
  id: string
  name: string
  description: string
  price: number
  image: string
  isAvailable: boolean
  isBestSeller: boolean
  isSpicy: boolean
  categoryId: string
  category: Category
}

type MenuForm = {
  name: string
  description: string
  price: string
  image: string
  categoryId: string
  isAvailable: boolean
  isBestSeller: boolean
  isSpicy: boolean
}

const EMPTY_FORM: MenuForm = {
  name: '', description: '', price: '', image: '',
  categoryId: '', isAvailable: true, isBestSeller: false, isSpicy: false,
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

export default function AdminMenuPage() {
  const { token } = useAdminStore()
  const [items, setItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [form, setForm] = useState<MenuForm>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')

  const fetchData = async () => {
    try {
      const [menuData, catData] = await Promise.all([
        apiFetch('/api/menu', {}, token || ''),
        apiFetch('/api/menu/categories', {}, token || ''),
      ])
      setItems(menuData.data || [])
      setCategories(catData.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const openAdd = () => {
    setEditingItem(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setShowModal(true)
  }

  const openEdit = (item: MenuItem) => {
    setEditingItem(item)
    setForm({
      name: item.name,
      description: item.description,
      price: String(item.price),
      image: item.image,
      categoryId: item.categoryId,
      isAvailable: item.isAvailable,
      isBestSeller: item.isBestSeller,
      isSpicy: item.isSpicy,
    })
    setFormError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.price || !form.categoryId || !form.image) {
      setFormError('Nama, harga, kategori, dan gambar wajib diisi')
      return
    }
    setIsSaving(true)
    setFormError('')
    try {
      const body = { ...form, price: parseInt(form.price) }
      if (editingItem) {
        const data = await apiFetch(`/api/admin/menu/${editingItem.id}`, { method: 'PUT', body: JSON.stringify(body) }, token || '')
        setItems((prev) => prev.map((i) => (i.id === editingItem.id ? data.data : i)))
      } else {
        const data = await apiFetch('/api/admin/menu', { method: 'POST', body: JSON.stringify(body) }, token || '')
        setItems((prev) => [...prev, data.data])
      }
      setShowModal(false)
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (item: MenuItem) => {
    if (!confirm(`Hapus "${item.name}"? Aksi ini tidak bisa dibatalkan.`)) return
    try {
      await apiFetch(`/api/admin/menu/${item.id}`, { method: 'DELETE' }, token || '')
      setItems((prev) => prev.filter((i) => i.id !== item.id))
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus')
    }
  }

  const handleToggle = async (item: MenuItem) => {
    try {
      const data = await apiFetch(`/api/admin/menu/${item.id}/toggle`, { method: 'PATCH' }, token || '')
      setItems((prev) => prev.map((i) => (i.id === item.id ? data.data : i)))
    } catch (err: any) {
      alert(err.message || 'Gagal update')
    }
  }

  const filteredItems = activeCategory === 'all'
    ? items
    : items.filter((i) => i.categoryId === activeCategory)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Manajemen Menu</h1>
          <p className="text-sm text-gray-500 mt-0.5">{items.length} item menu terdaftar</p>
        </div>
        <button onClick={openAdd} className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2">
          + Tambah Menu
        </button>
      </div>

      {/* Filter kategori */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        <button
          onClick={() => setActiveCategory('all')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeCategory === 'all' ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          Semua
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeCategory === cat.id ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Menu list */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse flex gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredItems.map((item) => (
            <div key={item.id} className={`bg-white rounded-2xl border overflow-hidden flex gap-0 ${!item.isAvailable ? 'opacity-60' : 'border-gray-100'}`}>
              {/* Gambar */}
              <div className="w-24 h-24 flex-shrink-0 bg-gray-100 relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" onError={(e: any) => { e.target.style.display='none' }} />
              </div>

              {/* Info */}
              <div className="flex-1 px-4 py-3 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900 truncate">{item.name}</span>
                      {item.isBestSeller && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">⭐</span>}
                      {item.isSpicy && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">🌶️</span>}
                      {!item.isAvailable && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Habis</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{item.category.name}</p>
                    <p className="text-sm font-bold text-orange-600 mt-1">{formatRupiah(item.price)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Toggle tersedia */}
                    <button
                      onClick={() => handleToggle(item)}
                      title={item.isAvailable ? 'Nonaktifkan' : 'Aktifkan'}
                      className={`p-1.5 rounded-lg text-sm transition-colors ${item.isAvailable ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                    >
                      {item.isAvailable ? '✓' : '✗'}
                    </button>
                    <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm transition-colors">✏️</button>
                    <button onClick={() => handleDelete(item)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-sm transition-colors">🗑️</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal tambah/edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{editingItem ? 'Edit Menu Item' : 'Tambah Menu Item'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{formError}</div>
              )}

              {[
                { label: 'Nama menu', key: 'name', placeholder: 'Contoh: Nasi Goreng Spesial' },
                { label: 'Deskripsi', key: 'description', placeholder: 'Deskripsi singkat menu...' },
                { label: 'Harga (Rp)', key: 'price', placeholder: 'Contoh: 35000', type: 'number' },
                { label: 'URL Gambar', key: 'image', placeholder: 'https://...' },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                  {key === 'description' ? (
                    <textarea
                      value={form[key as keyof MenuForm] as string}
                      onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                    />
                  ) : (
                    <input
                      type={type || 'text'}
                      value={form[key as keyof MenuForm] as string}
                      onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                  )}
                </div>
              ))}

              {/* Kategori */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Kategori</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
                >
                  <option value="">-- Pilih kategori --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Checkboxes */}
              <div className="space-y-2">
                {[
                  { key: 'isAvailable', label: 'Tersedia (aktif di menu)' },
                  { key: 'isBestSeller', label: 'Best Seller ⭐' },
                  { key: 'isSpicy', label: 'Pedas 🌶️' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form[key as keyof MenuForm] as boolean}
                      onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.checked }))}
                      className="w-4 h-4 rounded accent-orange-500"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white px-5 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
                Batal
              </button>
              <button onClick={handleSave} disabled={isSaving} className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
                {isSaving ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Tambah Menu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
