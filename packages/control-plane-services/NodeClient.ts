import type { AppRouter } from "@agistack/node-api"
import { createTRPCProxyClient, createWSClient, wsLink } from "@trpc/client"

/**
 * Converts HTTP/HTTPS URL to WebSocket URL
 * http:// becomes ws://, https:// becomes wss://
 */
function toWebSocketUrl(url: string): string {
	return url.replace(/^http:\/\//, "ws://").replace(/^https:\/\//, "wss://")
}

export class NodeClient {
	private trpcClient: ReturnType<typeof createTRPCProxyClient<AppRouter>>
	private wsClient: ReturnType<typeof createWSClient>
	public readonly url: string

	constructor(nodeUrl: string) {
		this.url = nodeUrl
		const wsUrl = toWebSocketUrl(nodeUrl)
		this.wsClient = createWSClient({ url: wsUrl })
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
