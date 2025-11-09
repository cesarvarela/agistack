"use client"

import { EnvironmentProvider, type RuntimeConfig } from "@/context/environment-context"
import { TRPCProvider } from "@/lib/trpc"
import { SidebarProvider } from "@/components/ui/sidebar"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import type { ReactNode } from "react"

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
