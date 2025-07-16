import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		domains: ["res.cloudinary.com"] // Add Cloudinary hostname
	}
};

export default nextConfig;
