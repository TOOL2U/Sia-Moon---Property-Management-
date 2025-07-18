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
    // Allow production builds to complete even if there are ESLint errors
    ignoreDuringBuilds: true,
  },

  // TypeScript configuration for build
  typescript: {
    // Allow production builds to complete even if there are TypeScript errors
    ignoreBuildErrors: true,
  },

  // Webpack configuration to handle chunk loading issues
  webpack: (config, { dev, isServer }) => {
    // Add polyfill for self on server-side
    if (isServer) {
      const originalEntry = config.entry
      config.entry = async () => {
        const entries = await originalEntry()

        // Add polyfill to all server entries
        for (const key in entries) {
          if (Array.isArray(entries[key])) {
            entries[key].unshift('./polyfills/self-polyfill.js')
          } else if (typeof entries[key] === 'string') {
            entries[key] = ['./polyfills/self-polyfill.js', entries[key]]
          }
        }

        return entries
      }
    }

    // Fix for chunk loading errors
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }

    // Exclude problematic browser-only libraries from server bundle
    if (isServer) {
      config.externals = config.externals || []
      // Temporarily comment out externals to test
      // config.externals.push({
      //   'lenis': 'lenis',
      //   'framer-motion': 'framer-motion',
      //   'recharts': 'recharts'
      // });
    }

    // Optimize chunk splitting
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
      }
    }

    return config
  },

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react'],
    esmExternals: 'loose',
    // Remove turbo as it can cause chunk loading issues
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

    // Redirect test pages in production
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

  // Disable static optimization for pages with dynamic imports
  staticPageGenerationTimeout: 1000,
}

export default nextConfig
