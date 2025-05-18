/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  transpilePackages: ['leaflet'],
  output: 'export', // Enable static HTML export for GitHub Pages
  images: {
    unoptimized: true, // Required for static export
  },
  basePath: '/ArtivismA', // Repo name for GitHub Pages (case sensitive)
  assetPrefix: '/ArtivismA/', // Prefix for assets (case sensitive)
  trailingSlash: true, // Add trailing slashes to URLs
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