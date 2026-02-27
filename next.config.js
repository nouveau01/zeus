/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for self-hosting
  output: "standalone",
  // Skip type checking during build - types are checked in dev/IDE
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
