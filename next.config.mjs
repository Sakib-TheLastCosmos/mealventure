/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // Important for static HTML export
  basePath: "/mealventure", // Subpath used by GitHub Pages
  trailingSlash: true, // Required for GitHub Pages to serve routes correctly

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true, // Needed because Next.js image optimization doesn't work in static mode
  },
};

export default nextConfig;
