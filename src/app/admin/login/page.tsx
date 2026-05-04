'use client'
// src/app/admin/login/page.tsx
// Halaman login admin. Setelah login berhasil, token disimpan
// di Zustand store dan redirect ke /admin/orders.

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminStore } from '@/store/admin-store'
import { apiFetch } from '@/lib/api'

export default function AdminLoginPage() {
  const router = useRouter()
  const { setAuth, isLoggedIn } = useAdminStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Kalau sudah login, langsung redirect
  useEffect(() => {
    if (isLoggedIn()) router.replace('/admin/orders')
  }, [])

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email dan password wajib diisi')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setAuth(data.data.token, data.data.admin)
      router.replace('/admin/orders')
    } catch (err: any) {
      setError(err.message || 'Login gagal')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🍜</div>
          <h1 className="text-2xl font-bold text-gray-900">Warung Barokah</h1>
          <p className="text-gray-500 text-sm mt-1">Dashboard Admin</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Masuk ke Dashboard</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@warungbarokah.com"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full mt-6 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {isLoading ? 'Memproses...' : 'Masuk'}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Default: admin@warungbarokah.com / admin123
        </p>
      </div>
    </div>
  )
}
