import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ignora gli errori di tipo TypeScript durante il build su Vercel
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignora i controlli ESLint durante il build su Vercel
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;