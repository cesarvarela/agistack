import type { AppRouter } from "@agistack/node-api"
import { createTRPCProxyClient, createWSClient, wsLink } from "@trpc/client"

export class NodeClient {
	private trpcClient: ReturnType<typeof createTRPCProxyClient<AppRouter>>
	private wsClient: ReturnType<typeof createWSClient>

	constructor(nodeUrl: string) {
		this.wsClient = createWSClient({ url: nodeUrl })
		this.trpcClient = createTRPCProxyClient<AppRouter>({
			links: [wsLink({ client: this.wsClient })],
		})
	}

	/**
	 * Get the underlying tRPC client for making requests to the node
	 */
	get client() {
		return this.trpcClient
	}

	/**
	 * Clean up the WebSocket connection
	 */
	dispose() {
		this.wsClient.close()
	}
}
