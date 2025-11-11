"use client"

import { NuqsAdapter } from "nuqs/adapters/next/app"
import type { ReactNode } from "react"
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
					<SidebarProvider>{children}</SidebarProvider>
				</TRPCProvider>
			</EnvironmentProvider>
		</NuqsAdapter>
	)
}
