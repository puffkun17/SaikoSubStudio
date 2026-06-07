import type { NextConfig } from 'next';

const isCF = process.env.CF_PAGES === '1' || !!process.env.CF_PAGES_URL;

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  eslint: {
    // For CF Pages builds we allow some issues from the extracted NAS code.
    // For other platforms (Vercel, Netlify, containers, local) we enforce lint.
    ignoreDuringBuilds: isCF,
  },
  typescript: {
    // Same as above: extracted code may have loose types.
    // Enable strict checking for non-CF deploys to improve quality/portability.
    ignoreBuildErrors: isCF,
  },
  // For better portability on pure static hosts (GitHub Pages, Surge, etc.)
  // you can experiment with output: 'export' but note app-router limitations
  // (no server components/actions). Current setup works for most static + edge.
};

export default nextConfig;
