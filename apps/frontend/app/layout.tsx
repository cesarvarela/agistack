import type { Metadata } from "next"
import env from "../env-server"
import "./globals.css"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { Providers } from "./providers"

export const metadata: Metadata = {
	title: "AGIStack - Container Orchestration",
	description: "AI-powered Docker container management",
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	const runtimeConfig = {
		controlPlanePort: env.CONTROL_PLANE_PORT,
		agentSecret: env.AGENT_SECRET,
	}

	return (
		<html lang="en">
			<body className="antialiased">
				<Providers runtimeConfig={runtimeConfig}>
					<LayoutWrapper>{children}</LayoutWrapper>
				</Providers>
			</body>
		</html>
	)
}
