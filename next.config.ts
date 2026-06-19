import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/Splitter',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
