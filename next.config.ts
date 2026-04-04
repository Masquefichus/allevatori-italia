import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Wikimedia Commons — breed photos (CC BY-SA)
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        // FCI illustrations — fallback breed photos
        protocol: "https",
        hostname: "www.fci.be",
      },
      {
        // Supabase Storage — user uploaded images
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
