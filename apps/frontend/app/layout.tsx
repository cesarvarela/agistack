import type { Metadata } from "next"
import "./globals.css"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { TRPCProvider } from "@/lib/trpc"
import { Providers } from "./providers"

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
				<Providers>
					<TRPCProvider>
						<LayoutWrapper>{children}</LayoutWrapper>
					</TRPCProvider>
				</Providers>
			</body>
		</html>
	)
}
