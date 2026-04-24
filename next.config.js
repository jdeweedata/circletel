// Only load bundle analyzer when ANALYZE=true (avoids Vercel build failure)
const withBundleAnalyzer = process.env.ANALYZE === 'true'
  ? require('@next/bundle-analyzer')({ enabled: true })
  : (config) => config;

const isVercel = process.env.VERCEL === '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Docker/Coolify deployment — produces self-contained server.js
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
  // Exclude heavy/server-only packages from webpack bundling — Node loads them natively at runtime
  serverExternalPackages: [
    'sanity',
    'puppeteer-core',
    '@sparticuz/chromium-min',
    'cheerio',
    'xml2js',
    'adm-zip',
    'resend',
    '@react-email/components',
    '@react-email/render',
    '@mendable/firecrawl-js',
    '@modelcontextprotocol/sdk',
  ],
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'react-icons',
      'lucide-react',
      '@phosphor-icons/react',
      '@tabler/icons-react',
      'date-fns',
      '@tanstack/react-table',
      'recharts',
      'zod',
      '@hookform/resolvers',
      'framer-motion',
      'motion',
      '@tanstack/react-query',
    ],
    // Vercel Enhanced (16GB): keep 1 core to stay within memory budget
    // VPS (24GB/8 cores): 4 cores for parallel compilation via child processes
    // workerThreads disabled — causes DataCloneError when custom webpack function
    // (and next-pwa) are present, because functions can't be structuredClone'd
    workerThreads: false,
    cpus: isVercel ? 1 : 4,
  },
  webpack: (config, { isServer }) => {
    // Optimize chunk loading for dynamic imports
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
  redirects: async () => [
    { source: '/get-connected', destination: '/check-coverage', permanent: true },
    { source: '/order/coverage', destination: '/check-coverage', permanent: true },
  ],
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

if (isVercel) {
  module.exports = withBundleAnalyzer(nextConfig);
} else {
  const withPWA = require('next-pwa')({
    dest: 'public',
    // Disable PWA in development (saves ~2GB RAM)
    disable: process.env.NODE_ENV === 'development',
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
  module.exports = withBundleAnalyzer(withPWA(nextConfig));
}