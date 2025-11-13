import "env-server"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	// Create standalone output for optimized Docker builds
	output: "standalone",

	// Enable experimental features if needed
	experimental: {},
}

export default nextConfig
