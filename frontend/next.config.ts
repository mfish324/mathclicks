import type { NextConfig } from "next";
import { execSync } from "child_process";

function getGitCommitHash(): string {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "unknown";
  }
}

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || getGitCommitHash(),
  },
};

export default nextConfig;
