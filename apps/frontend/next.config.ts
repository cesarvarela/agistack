import type { NextConfig } from "next"
import "env-server"

const nextConfig: NextConfig = {
	// Transpile packages from the monorepo
	transpilePackages: [
		"@agistack/node-api",
		"@agistack/control-plane-api",
		"@agistack/control-plane-clients",
	],

	// Enable experimental features if needed
	experimental: {},
}

export default nextConfig
