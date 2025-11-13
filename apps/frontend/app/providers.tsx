"use client"

import { NuqsAdapter } from "nuqs/adapters/next/app"
import type { ReactNode } from "react"
import { ThemeProvider } from "next-themes"
import { SidebarProvider } from "@/components/ui/sidebar"
import { EnvironmentProvider, type RuntimeConfig } from "@/context/environment-context"
import { TRPCProvider } from "@/lib/trpc"

export function Providers({
	children,
	runtimeConfig,
}: {
	children: ReactNode
	runtimeConfig: RuntimeConfig
}) {
	return (
		<NuqsAdapter>
			<EnvironmentProvider runtimeConfig={runtimeConfig}>
				<TRPCProvider>
					<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
						<SidebarProvider>{children}</SidebarProvider>
					</ThemeProvider>
				</TRPCProvider>
			</EnvironmentProvider>
		</NuqsAdapter>
	)
}
