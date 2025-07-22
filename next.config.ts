import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'prd-lifullconnect-projects-admin-images.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // Production optimizations
  compress: true,
  poweredByHeader: false,

  // ESLint configuration for build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // TypeScript configuration for build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Server external packages (for Node.js compatibility)
  serverExternalPackages: [
    'firebase-admin',
    'node-fetch',
    'googleapis'
  ],

  // Experimental features (cleaned up)
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Fix for chunk loading errors
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }

    // Optimize chunk splitting (fixed for Next.js 15)
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              chunks: 'all',
            },
            common: {
              name: 'common',
              minChunks: 2,
              priority: -30,
              reuseExistingChunk: true,
            },
          },
        },
        // Remove usedExports to fix cacheUnaffected conflict
        usedExports: false,
      }
    }

    return config
  },

  // Build-time optimizations
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'],
          }
        : false,
  },

  // Environment-specific redirects
  async redirects() {
    const redirects = []

    if (process.env.NODE_ENV === 'production') {
      redirects.push(
        {
          source: '/test-:path*',
          destination: '/',
          permanent: false,
        },
        {
          source: '/dev-:path*',
          destination: '/',
          permanent: false,
        },
        {
          source: '/developers',
          destination: '/',
          permanent: false,
        }
      )
    }

    return redirects
  },

  // Output configuration
  output: 'standalone',
  staticPageGenerationTimeout: 1000,
}

export default nextConfig
