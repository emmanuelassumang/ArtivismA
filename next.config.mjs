/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  transpilePackages: ['leaflet'],
  webpack: (config) => {
    // Handle SVG files
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  }
};

export default nextConfig;