/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable experimental features if needed
  },
  webpack: (config, { isServer }) => {
    // Fix for face-api.js and other browser incompatible modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        encoding: false,
      };
    }

    // Ignore certain warnings
    config.ignoreWarnings = [
      { module: /node_modules\/face-api\.js/ },
      { module: /node_modules\/node-fetch/ },
      { module: /node_modules\/@tensorflow/ },
    ];

    return config;
  },
  // Disable strict mode temporarily to avoid double rendering issues with face-api.js
  reactStrictMode: false,
};

module.exports = nextConfig;
