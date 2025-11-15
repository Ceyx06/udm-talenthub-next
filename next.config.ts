import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ✅ Don't fail the build if ESLint has errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ✅ Don't fail the build if TypeScript has errors
    ignoreBuildErrors: true,
  },
};

export default nextConfig;