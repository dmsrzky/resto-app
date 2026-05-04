// src/app/admin/page.tsx
// Redirect /admin ke /admin/orders

import { redirect } from 'next/navigation'

export default function AdminPage() {
  redirect('/admin/orders')
}
