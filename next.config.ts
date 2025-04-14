import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'im6fgcuietoqkw1u.public.blob.vercel-storage.com', 
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
