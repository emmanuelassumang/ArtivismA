/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  transpilePackages: ['leaflet'],
  output: 'export', // Enable static HTML export for Pages
  images: {
    unoptimized: true, // Required for static export
  },
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