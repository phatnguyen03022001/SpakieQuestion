import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com", // Domain của Cloudinary
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
