/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.freepik.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn-magnific.freepik.com',
      },
      {
        protocol: 'https',
        hostname: 'ai-statics.freepik.com',
      },
    ],
  },
  allowedDevOrigins: ['*'],
}

module.exports = nextConfig