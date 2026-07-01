import withNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = withNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/sensorhub/:path*',

        destination: `${process.env.SENSORHUB_URL}/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
