import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { serverActions: { bodySizeLimit: '3mb' } },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2678400, // 31 days edge cache
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tcjeiizrarwerarcfyky.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
