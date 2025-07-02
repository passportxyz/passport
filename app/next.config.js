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

    // In dev mode, replace wagmi imports with mocks
    if (process.env.NEXT_PUBLIC_DEV_MODE === "true") {
      config.resolve.alias = {
        ...config.resolve.alias,
        wagmi: require.resolve("./mocks/wagmi.tsx"),
        "@reown/appkit/networks": require.resolve("./mocks/appkit-networks.ts"),
        "../context/datastoreConnectionContext": require.resolve("./mocks/datastoreConnectionContext.tsx"),
      };
    }

    return config;
  },
};
