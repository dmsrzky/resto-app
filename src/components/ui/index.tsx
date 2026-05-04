// ============================================================
// components/ui/index.tsx
// Komponen UI kecil yang dipakai berulang di berbagai halaman.
// Lebih baik dibuat di sini daripada copy-paste di setiap file.
// ============================================================

import { ReactNode } from 'react'

// --- Badge ---
// Dipakai untuk label "Best Seller", "Pedas", "Habis", dll.
type BadgeVariant = 'bestseller' | 'spicy' | 'unavailable' | 'success' | 'warning' | 'info'

const badgeStyles: Record<BadgeVariant, string> = {
  bestseller: 'bg-amber-100 text-amber-800 border-amber-200',
  spicy:      'bg-red-100 text-red-700 border-red-200',
  unavailable:'bg-gray-100 text-gray-500 border-gray-200',
  success:    'bg-green-100 text-green-800 border-green-200',
  warning:    'bg-yellow-100 text-yellow-800 border-yellow-200',
  info:       'bg-blue-100 text-blue-800 border-blue-200',
}

export function Badge({ variant, children }: { variant: BadgeVariant; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badgeStyles[variant]}`}>
      {children}
    </span>
  )
}

// --- Button ---
// Komponen tombol dengan beberapa varian tampilan
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

const btnVariants: Record<ButtonVariant, string> = {
  primary:   'bg-orange-500 hover:bg-orange-600 text-white border-transparent',
  secondary: 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300',
  ghost:     'bg-transparent hover:bg-gray-100 text-gray-600 border-transparent',
  danger:    'bg-red-500 hover:bg-red-600 text-white border-transparent',
}

const btnSizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

type ButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit' | 'reset'
  fullWidth?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled,
  className = '',
  type = 'button',
  fullWidth,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-xl
        border transition-all duration-150 active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed
        ${btnVariants[variant]}
        ${btnSizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  )
}

// --- QuantityControl ---
// Tombol +/- untuk mengatur jumlah item di cart
type QuantityControlProps = {
  quantity: number
  onIncrease: () => void
  onDecrease: () => void
  min?: number
}

export function QuantityControl({ quantity, onIncrease, onDecrease, min = 0 }: QuantityControlProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onDecrease}
        disabled={quantity <= min}
        className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center
          text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed
          transition-colors font-medium text-lg leading-none"
      >
        −
      </button>
      <span className="w-6 text-center font-medium text-sm">{quantity}</span>
      <button
        onClick={onIncrease}
        className="w-8 h-8 rounded-lg bg-orange-500 hover:bg-orange-600 flex items-center
          justify-center text-white transition-colors font-medium text-lg leading-none"
      >
        +
      </button>
    </div>
  )
}

// --- EmptyState ---
// Tampilan ketika tidak ada data (cart kosong, menu kosong, dll)
export function EmptyState({ icon, title, description, action }: {
  icon: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="text-5xl">{icon}</div>
      <h3 className="font-semibold text-gray-800">{title}</h3>
      <p className="text-sm text-gray-500 max-w-xs">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

// --- LoadingSpinner ---
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className={`${sizes[size]} border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin`} />
  )
}

// --- SectionHeader ---
// Header dengan garis bawah tipis, dipakai di tiap section halaman
export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-semibold text-gray-900">{title}</h2>
      {action}
    </div>
  )
}

// --- Divider ---
export function Divider({ className = '' }: { className?: string }) {
  return <hr className={`border-gray-100 ${className}`} />
}

// --- StatusBadge ---
// Khusus untuk status order, warnanya berbeda-beda sesuai status
import { OrderStatus } from '@/types'

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  pending_payment: { label: 'Menunggu Pembayaran', className: 'bg-yellow-100 text-yellow-800' },
  paid:            { label: 'Pembayaran Berhasil', className: 'bg-blue-100 text-blue-800' },
  preparing:       { label: 'Sedang Dimasak',      className: 'bg-orange-100 text-orange-800' },
  ready:           { label: 'Siap Diambil',         className: 'bg-green-100 text-green-800' },
  completed:       { label: 'Selesai',              className: 'bg-gray-100 text-gray-600' },
  cancelled:       { label: 'Dibatalkan',           className: 'bg-red-100 text-red-700' },
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status]
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
