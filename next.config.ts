/** @type {import('next').NextConfig} */
const nextConfig = {
  // Forza Next.js a non fare il pre-rendering statico delle API
  output: 'standalone',
  experimental: {
    // Disabilita la raccolta dati automatica delle rotte dinamiche
    ppr: false,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;