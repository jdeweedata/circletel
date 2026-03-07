const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const withPWA = require('next-pwa')({
  dest: 'public',
  // Disable PWA during development AND Vercel builds (saves ~2GB RAM)
  disable: process.env.NODE_ENV === 'development' || process.env.VERCEL === '1',
  register: true,
  skipWaiting: true,
  buildExcludes: [/app-build-manifest\.json$/],
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 365 days
        }
      }
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-static',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 365 days
        }
      }
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-image-assets',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        }
      }
    },
    {
      urlPattern: /\.(?:js|css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        }
      }
    },
    {
      urlPattern: ({ url }) => url.origin === 'https://agyjovdugmtopasyvlng.supabase.co',
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-api',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 60 * 60 // 1 hour
        },
        networkTimeoutSeconds: 10
      }
    }
  ]
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Disable source maps in production to reduce memory
  productionBrowserSourceMaps: false,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has TypeScript errors.
    ignoreBuildErrors: true,
  },
  // Exclude Sanity from bundling (large package, causes Turbopack issues)
  serverExternalPackages: ['sanity'],
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'react-icons',
      'lucide-react',
      '@phosphor-icons/react',
      'date-fns',
      '@tanstack/react-table',
      'recharts',
      'zod',
      '@hookform/resolvers'
    ],
    // Reduce memory usage during builds by disabling worker threads
    workerThreads: false,
    // Reduce memory by limiting parallel routes compilation
    cpus: 1,
  },
  webpack: (config, { isServer }) => {
    // Optimize chunk loading for dynamic imports
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            // Create a separate chunk for Google Maps related code
            googleMaps: {
              test: /[\\/]services[\\/]googleMaps/,
              priority: 20,
              chunks: 'async',
              reuseExistingChunk: true
            }
          }
        }
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'agyjovdugmtopasyvlng.supabase.co',
        port: '',
        pathname: '/storage/**'
      },
      {
        protocol: 'https',
        hostname: 'www-dev-cms.afrihost.com',
        port: '',
        pathname: '/imager/**'
      },
      {
        protocol: 'https',
        hostname: 'design.canva.ai',
        port: '',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        port: '',
        pathname: '/images/**'
      }
    ]
  }
};

module.exports = withBundleAnalyzer(withPWA(nextConfig));