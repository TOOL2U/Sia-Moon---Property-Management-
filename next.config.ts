import type { NextConfig } from "next";
import { NODE_ENV, isProduction } from "./src/lib/env";

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
    removeConsole: isProduction ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // Environment-specific redirects
  async redirects() {
    const redirects = [];

    // Redirect test pages in production
    if (isProduction) {
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
