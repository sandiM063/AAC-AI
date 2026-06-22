import { createRequire } from "node:module";
import type { NextConfig } from "next";

const require = createRequire(import.meta.url);
const { PrismaPlugin } = require("@prisma/nextjs-monorepo-workaround-plugin");

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma"],
  outputFileTracingIncludes: {
    "/*": ["./node_modules/.prisma/client/**/*"],
    "/api/*": ["./node_modules/.prisma/client/**/*"],
  },
  transpilePackages: ["webeyetrack"],
  turbopack: {
    root: import.meta.dirname,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }
    return config;
  },
};

export default nextConfig;
