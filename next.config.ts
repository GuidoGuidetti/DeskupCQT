import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Aumenta il limite per supportare allegati fino a 10MB
    },
  },
};

export default nextConfig;
