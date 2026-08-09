import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Explicitly set root to the frontend directory to avoid Next.js
    // incorrectly inferring the monorepo parent as the workspace root.
    root: path.resolve(__dirname),
  },
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_URL ?? "blabla";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
