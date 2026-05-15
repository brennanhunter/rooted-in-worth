import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Google account profile photos (captured for OAuth sign-ups)
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      // Supabase Storage public objects only (uploaded avatars) —
      // scoped to the public object path, not the whole host
      {
        protocol: "https",
        hostname: "jrwktwbwryghzomyiuug.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
