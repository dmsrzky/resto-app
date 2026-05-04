// ============================================================
// app/layout.tsx
// Root layout — dibungkus di semua halaman.
// Pasang font, metadata, dan global CSS di sini.
// ============================================================

import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Warung Barokah',
  description: 'Pesan makanan favoritmu secara online',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={`${geist.className} antialiased`}>
        {children}
      </body>
    </html>
  )
}
