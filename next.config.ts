import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const config: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  devIndicators: false,
  experimental: {globalNotFound: true},
};

export default createNextIntlPlugin()(config);
