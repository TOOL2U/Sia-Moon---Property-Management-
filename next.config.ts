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

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', 'react-hot-toast'],
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
};

export default nextConfig;
