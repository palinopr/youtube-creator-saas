/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // Ensure Turbopack treats this folder as the project root
    root: __dirname,
  },
  // Ensure serverless output tracing uses the same root as Turbopack.
  // This avoids missing dependencies in production builds on Vercel.
  outputFileTracingRoot: __dirname,
  async redirects() {
    return [
      {
        source: "/blog/best-times-to-post-youtube-2024",
        destination: "/blog/best-times-to-post-youtube-2025",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yt3.ggpht.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
    ],
  },
};

module.exports = nextConfig;
