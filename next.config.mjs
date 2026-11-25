const BACKEND = process.env.BACKEND_URL || 'https://edubf.onrender.com'
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND}/api/:path*`,
      },
      {
        source: '/auth/:path*',
        destination: `${BACKEND}/auth/:path*`,
      },
    ]
  },
}

export default nextConfig