import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;