'use client'
// src/app/admin/layout.tsx
// UPDATED: tambah menu Laporan di sidebar navigasi

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAdminStore } from '@/store/admin-store'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isLoggedIn, admin, logout } = useAdminStore()

  useEffect(() => {
    if (!isLoggedIn() && pathname !== '/admin/login') {
      router.replace('/admin/login')
    }
  }, [pathname])

  if (pathname === '/admin/login') return <>{children}</>

  const navItems = [
    { href: '/admin/orders', label: 'Pesanan', icon: '📋' },
    { href: '/admin/menu', label: 'Menu', icon: '🍽️' },
    { href: '/admin/laporan', label: 'Laporan', icon: '📊' },
  ]

  const handleLogout = () => {
    logout()
    router.replace('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col fixed h-full z-20">
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍜</span>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">Warung Barokah</p>
              <p className="text-xs text-gray-400">Admin Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                pathname === item.href
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 truncate mb-2">{admin?.name}</p>
          <button
            onClick={handleLogout}
            className="w-full text-left text-xs text-red-500 hover:text-red-600 font-medium"
          >
            Keluar
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-56 min-h-screen">
        {children}
      </main>
    </div>
  )
}
