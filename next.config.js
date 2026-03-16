/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Disable Next.js image cache so Supabase Storage updates are shown immediately
    minimumCacheTTL: 0,
  },
};

export default nextConfig;
