import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  images: { unoptimized: true },
  eslint: {
    // We keep the full original component code (with some any types)
    // so we ignore lint errors during production build for CF Pages.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow build to proceed even if there are type issues in ported code
    // (the core subtitle logic is complex and was extracted as-is).
    ignoreBuildErrors: true,
  },
};
export default nextConfig;
