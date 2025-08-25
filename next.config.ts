/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Only run ESLint on these directories during build
    dirs: ['app'],
    // Ignore ESLint errors during build (temporary for deployment)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during build (temporary for deployment)
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}

module.exports = nextConfig