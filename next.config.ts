import type { NextConfig } from "next";

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
        hostname: 'images.unsplash.com',
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

  // Webpack configuration to handle chunk loading issues
  webpack: (config, { dev, isServer }) => {
    // Exclude browser-only packages from server bundle
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'lenis': false,
        'recharts': false,
        'framer-motion': false,
      };

      // Exclude problematic modules from server bundle
      config.externals = config.externals || [];
      config.externals.push({
        'lenis': 'lenis',
        'recharts': 'recharts',
        'framer-motion': 'framer-motion',
      });
    }

    // Fix for chunk loading errors
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      http: false,
      https: false,
      zlib: false,
      path: false,
      os: false,
    };

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
      };
    }

    return config;
  },

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', 'react-hot-toast'],
    // Remove turbo as it can cause chunk loading issues
  },

  // Build-time optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // Environment-specific redirects
  async redirects() {
    const redirects = [];

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
      );
    }

    return redirects;
  },

  // Output configuration
  output: 'standalone',
  
  // Disable static optimization for pages with dynamic imports
  staticPageGenerationTimeout: 1000,
};

export default nextConfig;
