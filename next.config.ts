import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Prisma's native runtime out of the Turbopack bundle (avoids stale DMMF after `prisma generate`).
  serverExternalPackages: ["@prisma/client", "prisma"],
  transpilePackages: ["webeyetrack"],
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
