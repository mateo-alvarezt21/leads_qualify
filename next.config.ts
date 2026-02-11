import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@whiskeysockets/baileys'],
};

export default nextConfig;
