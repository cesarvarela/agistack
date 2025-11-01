import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	// Transpile packages from the monorepo
  transpilePackages: ["@agistack/agent-api", "@agistack/control-plane-api"],

	// Enable experimental features if needed
	experimental: {},
}

export default nextConfig
