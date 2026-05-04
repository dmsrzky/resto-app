'use client'
// src/store/admin-store.ts
// Simpan token JWT dan data admin setelah login.
// Pakai persist supaya tidak logout kalau refresh halaman.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type AdminUser = {
  id: string
  name: string
  email: string
}

type AdminStore = {
  token: string | null
  admin: AdminUser | null
  setAuth: (token: string, admin: AdminUser) => void
  logout: () => void
  isLoggedIn: () => boolean
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      token: null,
      admin: null,
      setAuth: (token, admin) => set({ token, admin }),
      logout: () => set({ token: null, admin: null }),
      isLoggedIn: () => !!get().token,
    }),
    { name: 'resto-admin' }
  )
)
