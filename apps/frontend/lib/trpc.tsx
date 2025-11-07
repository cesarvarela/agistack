"use client"

import type { ControlPlaneRouter } from "@agistack/control-plane-api"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createWSClient, wsLink } from "@trpc/client"
import { createTRPCReact, httpBatchLink, splitLink } from "@trpc/react-query"
import type { inferRouterInputs } from "@trpc/server"
import { useState } from "react"
import superjson from "superjson"
import env from "../env-client"

export const trpc = createTRPCReact<ControlPlaneRouter>()

export type RouterInputs = inferRouterInputs<ControlPlaneRouter>

function getUrl() {
	const port = env.NEXT_PUBLIC_CP_PORT
	return `http://localhost:${port}`
}

function getWsUrl() {
	const url = getUrl()
	return url.replace("http://", "ws://").replace("https://", "wss://")
}

function makeQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				// With SSR, we usually want to set some default staleTime
				// above 0 to avoid refetching immediately on the client
				staleTime: 30 * 1000,
			},
		},
	})
}

let browserQueryClient: QueryClient | undefined

function getQueryClient() {
	if (typeof window === "undefined") {
		// Server: always make a new query client
		return makeQueryClient()
	}
	// Browser: make a new query client if we don't already have one
	if (!browserQueryClient) browserQueryClient = makeQueryClient()
	return browserQueryClient
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
	const queryClient = getQueryClient()

	const [trpcClient] = useState(() => {
		// Only create WebSocket client in browser
		const wsClient =
			typeof window !== "undefined"
				? createWSClient({
						url: getWsUrl(),
					})
				: null

		return trpc.createClient({
			links: [
				splitLink({
					condition: (op) => op.type === "subscription",
					true: wsClient
						? wsLink<ControlPlaneRouter>({
								client: wsClient,
								transformer: superjson,
							})
						: httpBatchLink({
								url: getUrl(),
								transformer: superjson,
							}),
					false: httpBatchLink({
						url: getUrl(),
						transformer: superjson,
					}),
				}),
			],
		})
	})

	return (
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</trpc.Provider>
	)
}
