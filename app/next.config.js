/** @type {import('next').NextConfig} */
module.exports = {
  exportPathMap: function () {
    return {
      "/": { page: "/" },
      "/dashboard": { page: "/Dashboard" },
    };
  },
  reactStrictMode: true,
};
