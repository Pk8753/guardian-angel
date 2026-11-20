// Fix for [DEP0060] DeprecationWarning: The `util._extend` API is deprecated
const util = require('util');
if (util && util._extend) {
  util._extend = Object.assign;
}

/** @type {import('next').NextConfig} */
const backendPort = process.env.BACKEND_PORT || '5000';
const isDev = process.env.NODE_ENV !== 'production';
const defaultBackend = isDev ? `http://127.0.0.1:${backendPort}` : 'https://guardian-angel-703744831646.us-central1.run.app';
const backendBase = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || defaultBackend;

const nextConfig = {
  reactStrictMode: true,
  devIndicators: {
    buildActivity: false,
    appIsrStatus: false,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendBase}/api/:path*`,
      },
      {
        source: '/data/:path*',
        destination: `${backendBase}/data/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
