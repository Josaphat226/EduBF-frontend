/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
{
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*',
      },
      {
        source: '/auth/:path*',
        destination: 'http://localhost:3000/auth/:path*',
      },
    ]
  },
}

export default nextConfig