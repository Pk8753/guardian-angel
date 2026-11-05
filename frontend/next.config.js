/** @type {import('next').NextConfig} */
const backendPort = process.env.BACKEND_PORT || '5000';

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `http://127.0.0.1:${backendPort}/api/:path*`,
      },
      {
        source: '/data/:path*',
        destination: `http://127.0.0.1:${backendPort}/data/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

