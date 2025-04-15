/** @type {import('next').NextConfig} */
module.exports = {
  output: "export",
  swcMinify: false,
  exportPathMap: function () {
    return {
      "/": { page: "/" },
    };
  },
  reactStrictMode: true,
  webpack: function (config, { _isServer }) {
    config.experiments = { asyncWebAssembly: true };
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
};
