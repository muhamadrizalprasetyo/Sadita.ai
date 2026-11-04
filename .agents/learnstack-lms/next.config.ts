import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        hostname: "learnstack-lms.t3.storage.dev",
        port: "",
        protocol: "https",
      },
    ],
  },
};
export default nextConfig;
