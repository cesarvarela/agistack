import type { Metadata } from "next"
import "./globals.css"
import { LayoutWrapper } from "@/components/layout-wrapper"

export const metadata: Metadata = {
	title: "AgStack - Container Orchestration",
	description: "AI-powered Docker container management",
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="en">
			<body className="antialiased">
				<LayoutWrapper>{children}</LayoutWrapper>
			</body>
		</html>
	)
}
