// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Domain yang diizinkan untuk next/image
    // Tambahkan domain lain kalau gambar di-host di tempat berbeda
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com', // kalau pakai Cloudinary untuk upload gambar menu
      },
    ],
  },
}

export default nextConfig
