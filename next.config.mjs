/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Preview environments proxy the dev server through an e2b.app host.
  allowedDevOrigins: ['*.e2b.app'],
};

export default nextConfig;
