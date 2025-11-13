import type { Metadata } from "next"
import { cookies } from "next/headers"
import env from "../env-server"
import "./globals.css"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { Providers } from "./providers"

export const metadata: Metadata = {
	title: "AGIStack - Container Orchestration",
	description: "AI-powered Docker container management",
}

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	const runtimeConfig = {
		controlPlanePort: env.CONTROL_PLANE_PORT,
		nodeSecret: env.NODE_SECRET,
		nodePort: env.NODE_PORT,
	}

	const cookieStore = await cookies()
	const defaultSidebarOpen = cookieStore.get("sidebar_state")?.value === "true"

	return (
		<html lang="en" suppressHydrationWarning>
			<body className="antialiased">
				<Providers runtimeConfig={runtimeConfig} defaultSidebarOpen={defaultSidebarOpen}>
					<LayoutWrapper>{children}</LayoutWrapper>
				</Providers>
			</body>
		</html>
	)
}
