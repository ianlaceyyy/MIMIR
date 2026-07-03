/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@mimir/db", "@mimir/shared"],
  experimental: {
    // The Prisma client is used only in server components / route handlers.
    serverComponentsExternalPackages: ["@prisma/client"],
  },
};

export default nextConfig;
