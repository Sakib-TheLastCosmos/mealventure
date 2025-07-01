/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/mealventure",
  assetPrefix: "/mealventure", // <-- Add this line
  trailingSlash: true,

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
