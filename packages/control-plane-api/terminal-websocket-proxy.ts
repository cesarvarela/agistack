import type { IncomingMessage } from "node:http"
import WebSocket, { type WebSocketServer } from "ws"

/**
 * Sets up WebSocket proxy for Docker container terminal
 * Proxies terminal connections from frontend to the appropriate Node server
 */
export function setupTerminalWebSocketProxy(
	wss: WebSocketServer,
	getNodeUrl: (nodeId: string) => string,
) {
	let proxyConnectionCount = 0

	wss.on("connection", (clientWs: WebSocket, req: IncomingMessage) => {
		proxyConnectionCount++
		const proxyId = `proxy-${proxyConnectionCount}-${Date.now()}`

		console.log(`[Proxy][${proxyId}] NEW PROXY CONNECTION (total: ${proxyConnectionCount})`)

		try {
			const url = new URL(req.url || "", `http://${req.headers.host}`)

			// Only handle /terminal path
			if (url.pathname !== "/terminal") {
				return
			}

			// Get query parameters
			const nodeId = url.searchParams.get("nodeId")
			const containerId = url.searchParams.get("containerId")
			const shell = url.searchParams.get("shell") || "/bin/sh"

			if (!nodeId) {
				clientWs.send("Error: nodeId is required")
				clientWs.close(4000, "nodeId is required")
				return
			}

			if (!containerId) {
				clientWs.send("Error: containerId is required")
				clientWs.close(4000, "containerId is required")
				return
			}

			console.log(`[Proxy][${proxyId}] Connecting to node ${nodeId} for container ${containerId}`)

			// Get Node server URL
			let nodeUrl: string
			try {
				nodeUrl = getNodeUrl(nodeId)
			} catch (error) {
				console.error(`[Proxy][${proxyId}] Failed to get node URL:`, error)
				clientWs.send(`\r\n\x1b[31mError: Failed to find node server\x1b[0m\r\n`)
				clientWs.close(4002, "Node not found")
				return
			}

			const nodeWsUrl = nodeUrl.replace("http://", "ws://").replace("https://", "wss://")
			console.log(
				`[Proxy][${proxyId}] Connecting to: ${nodeWsUrl}/terminal?containerId=${containerId}&shell=${shell}`,
			)

			// Connect to Node's terminal WebSocket
			const nodeWs = new WebSocket(
				`${nodeWsUrl}/terminal?containerId=${containerId}&shell=${shell}`,
			)

			let nodeToClientCount = 0
			let clientToNodeCount = 0

			// Node → Client: Forward all data
			nodeWs.on("message", (data) => {
				nodeToClientCount++
				const dataLength = data instanceof ArrayBuffer ? data.byteLength : data.length
				console.log(`[Proxy][${proxyId}] Node->Client #${nodeToClientCount}: ${dataLength} bytes`)

				if (clientWs.readyState === WebSocket.OPEN) {
					clientWs.send(data)
				}
			})

			// Client → Node: Forward all data
			clientWs.on("message", (data) => {
				clientToNodeCount++
				const dataLength = data instanceof ArrayBuffer ? data.byteLength : data.length
				const preview =
					data instanceof ArrayBuffer ? "[ArrayBuffer]" : data.toString().substring(0, 50)
				console.log(
					`[Proxy][${proxyId}] Client->Node #${clientToNodeCount}: ${dataLength} bytes: ${JSON.stringify(preview)}`,
				)

				if (nodeWs.readyState === WebSocket.OPEN) {
					nodeWs.send(data)
				}
			})

			// Handle Node connection open
			nodeWs.on("open", () => {
				console.log(`[Proxy][${proxyId}] Connected to node ${nodeId}`)
			})

			// Handle Node connection errors
			nodeWs.on("error", (error) => {
				console.error(`[Proxy][${proxyId}] Node connection error:`, error)
				if (clientWs.readyState === WebSocket.OPEN) {
					clientWs.send(`\r\n\x1b[31mError: Failed to connect to node server\x1b[0m\r\n`)
					clientWs.close()
				}
			})

			// Handle Node connection close
			nodeWs.on("close", () => {
				console.log(`[Proxy][${proxyId}] Node connection closed`)
				console.log(
					`[Proxy][${proxyId}] STATS: Node->Client: ${nodeToClientCount}, Client->Node: ${clientToNodeCount}`,
				)
				if (clientWs.readyState === WebSocket.OPEN) {
					clientWs.close()
				}
			})

			// Handle client close
			clientWs.on("close", () => {
				console.log(`[Proxy][${proxyId}] Client disconnected`)
				console.log(
					`[Proxy][${proxyId}] STATS: Node->Client: ${nodeToClientCount}, Client->Node: ${clientToNodeCount}`,
				)
				if (nodeWs.readyState === WebSocket.OPEN) {
					nodeWs.close()
				}
			})

			// Handle client error
			clientWs.on("error", (error) => {
				console.error(`[Proxy][${proxyId}] Client connection error:`, error)
				if (nodeWs.readyState === WebSocket.OPEN) {
					nodeWs.close()
				}
			})
		} catch (error) {
			console.error(`[Terminal Proxy] Fatal error in connection handler:`, error)
			try {
				clientWs.send(`\r\n\x1b[31mError: ${error}\x1b[0m\r\n`)
				clientWs.close(4003, "Internal error")
			} catch {
				// Ignore if already closed
			}
		}
	})
}
