import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
                          new Date().toISOString().slice(0, 16).replace("T", "-"),
  },
};

export default nextConfig;
