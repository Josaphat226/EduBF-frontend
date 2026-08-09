/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://edubf.onrender.com/api/:path*',
      },
      {
        source: '/auth/:path*',
        destination: 'https://edubf.onrender.com/auth/:path*',
      },
    ]
  },
}

module.exports = nextConfig