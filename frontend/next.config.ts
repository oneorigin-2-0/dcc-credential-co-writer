import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/laiser', // Your client-side path
        destination: 'https://uhao2r8hue.execute-api.us-east-1.amazonaws.com/dev/laiser', // The actual API endpoint
      },
      {
        source: '/api/dev/result', // Your client-side path
        destination: 'https://uhao2r8hue.execute-api.us-east-1.amazonaws.com/dev/result', // The actual API endpoint
      },
    ];
  },
};

export default nextConfig;
