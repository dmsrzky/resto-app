# Resto App — Frontend (Next.js)

Aplikasi pemesanan makanan untuk resto single-tenant dengan integrasi Midtrans.

## Struktur Project

```
src/
├── app/
│   ├── page.tsx              # Halaman menu utama (/)
│   ├── cart/
│   │   └── page.tsx          # Halaman keranjang (/cart)
│   ├── checkout/
│   │   └── page.tsx          # Halaman checkout (/checkout)
│   ├── order/
│   │   └── [id]/
│   │       └── page.tsx      # Status pesanan (/order/:id)
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/index.tsx          # Komponen UI reusable (Button, Badge, dll)
│   ├── menu/
│   │   └── MenuCard.tsx      # Kartu item menu
│   └── cart/
│       └── index.tsx         # CartFloatingButton + CartItemRow
├── store/
│   └── cart-store.ts         # Zustand store untuk cart
├── lib/
│   └── mock-data.ts          # Data dummy + helper formatRupiah
└── types/
    └── index.ts              # Semua TypeScript types
```

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup environment variables
cp .env.local.example .env.local
# Edit .env.local dan isi NEXT_PUBLIC_API_URL + Midtrans keys

# 3. Jalankan development server
npm run dev

# Buka http://localhost:3000
```

## Mengganti Mock Data dengan API

Setelah backend selesai, ganti bagian fetch di setiap halaman:

### Halaman Menu (app/page.tsx)
```typescript
// Ganti import mock data:
// import { menuItems, categories } from '@/lib/mock-data'

// Dengan fetch ke API:
const [menuItems, setMenuItems] = useState([])
useEffect(() => {
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/menu`)
    .then(r => r.json())
    .then(setMenuItems)
}, [])
```

### Halaman Order Status (app/order/[id]/page.tsx)
```typescript
// Ganti mock fetch dengan:
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${id}`)
const data = await res.json()
setOrder(data)
```

## Integrasi Midtrans

1. Daftar di https://dashboard.midtrans.com
2. Gunakan mode **Sandbox** untuk development
3. Isi `.env.local`:
   - `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` = Client Key dari dashboard
4. Di backend (Express), gunakan Server Key untuk buat transaksi
5. Alur:
   ```
   Frontend → POST /api/orders → Backend buat transaksi Midtrans
   Backend → return { snapToken } → Frontend jalankan snap.pay(token)
   Midtrans → callback ke backend webhook → update status order
   ```

## Deployment ke Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables di Vercel Dashboard
# Settings → Environment Variables
```

## Yang Perlu Ditambahkan Nanti

- [ ] Halaman autentikasi customer (opsional, bisa tanpa login)
- [ ] PWA support (supaya bisa di-install di HP)
- [ ] Push notification status order
- [ ] Review & rating setelah order selesai
- [ ] Halaman riwayat pesanan customer
