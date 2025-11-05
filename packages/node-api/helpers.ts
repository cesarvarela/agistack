import type {
	HttpOperation,
	OperationEvent,
	StreamOperation,
} from "@agistack/node-services/operations"
import type { AnyRouter } from "@trpc/server"
import { createHTTPServer } from "@trpc/server/adapters/standalone"
import { applyWSSHandler } from "@trpc/server/adapters/ws"
import { WebSocketServer } from "ws"
import superjson from "superjson"
import * as pty from "node-pty"
import type { IncomingMessage } from "node:http"
import type { WebSocket } from "ws"

/**
 * Generic helper for executing stream operations with standardized event wrapping
 */
export async function* executeStreamOperation<TInput, TOutput>(
	operation: StreamOperation<TInput, TOutput>,
	input: TInput,
): AsyncGenerator<OperationEvent<TOutput>> {
	const opId = crypto.randomUUID()
	const abortController = new AbortController()

	console.log(`[${opId}] Starting stream operation: ${operation.metadata.name}`)

	try {
		// Send started event
		yield { type: "started", opId }

		// Execute the stream operation
		const generator = operation.stream(input, abortController.signal)

		for await (const data of generator) {
			yield { type: "data", opId, data }
		}

		// Send complete event
		console.log(`[${opId}] Stream operation complete: ${operation.metadata.name}`)
		yield { type: "complete", opId }
	} catch (error) {
		console.error(`[${opId}] Stream operation failed: ${operation.metadata.name}`, error)
		yield {
			type: "error",
			opId,
			error: error instanceof Error ? error.message : "Unknown error",
		}
	} finally {
		// Cleanup on unsubscribe or completion
		console.log(`[${opId}] Aborting operation on unsubscribe`)
		abortController.abort()
	}
}

/**
 * Generic helper for executing HTTP operations with standardized logging and error handling
 */
export async function executeHttpOperation<TInput, TOutput>(
	operation: HttpOperation<TInput, TOutput>,
	input: TInput,
): Promise<TOutput> {
	const opId = crypto.randomUUID()

	console.log(`[${opId}] Starting operation: ${operation.metadata.name}`)

	try {
		const result = await operation.execute(input)
		console.log(`[${opId}] Operation complete: ${operation.metadata.name}`)
		return result
	} catch (error) {
		console.error(`[${opId}] Operation failed: ${operation.metadata.name}`, error)
		throw error
	}
}

/**
 * Sets up WebSocket handler for Docker container terminal (Node servers only)
 * Based on Dokploy's implementation: direct piping between WebSocket and PTY
 */
export function setupTerminalWebSocket(wss: WebSocketServer) {
	let connectionCount = 0
	wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
		connectionCount++
		const sessionId = `session-${connectionCount}-${Date.now()}`

		console.log(`[Terminal][${sessionId}] NEW CONNECTION (total connections: ${connectionCount})`)

		const url = new URL(req.url || "", `http://${req.headers.host}`)

		// Only handle /terminal path
		if (url.pathname !== "/terminal") {
			console.log(`[Terminal][${sessionId}] REJECTED - not /terminal path`)
			return
		}

		// Get query parameters
		const containerId = url.searchParams.get("containerId")
		const shell = url.searchParams.get("shell") || "/bin/sh"

		if (!containerId) {
			ws.send("Error: containerId is required")
			ws.close(4000, "containerId is required")
			return
		}

		console.log(
			`[Terminal][${sessionId}] Starting session for container ${containerId} with shell ${shell}`,
		)

		let ptyProcess: pty.IPty

		try {
			// Spawn PTY process with docker exec wrapped in shell (Dokploy approach)
			// Using -it flags for full TTY support inside the container
			const dockerCommand = `docker exec -it -w / ${containerId} ${shell}`
			ptyProcess = pty.spawn("sh", ["-c", dockerCommand], {
				name: "xterm-256color",
				cols: 120,
				rows: 30,
				cwd: process.cwd(),
				env: {
					...(process.env as Record<string, string>),
					TERM: "xterm-256color",
				},
			})

			console.log(`[Terminal][${sessionId}] PTY spawned successfully for container ${containerId}`)
		} catch (error) {
			console.error(`[Terminal][${sessionId}] Failed to spawn PTY:`, error)
			ws.send(`\r\n\x1b[31mError: Failed to start terminal - ${error}\x1b[0m\r\n`)
			ws.close(4001, "Failed to spawn PTY")
			return
		}

		let ptyDataCount = 0
		let wsSendCount = 0

		// PTY → WebSocket: Forward all output to client
		ptyProcess.onData((data) => {
			ptyDataCount++
			console.log(
				`[Terminal][${sessionId}] PTY->WS #${ptyDataCount}: ${data.length} bytes: ${JSON.stringify(data.substring(0, 50))}`,
			)

			if (ws.readyState === ws.OPEN) {
				wsSendCount++
				console.log(`[Terminal][${sessionId}] WS.SEND #${wsSendCount}`)
				ws.send(data)
			}
		})

		// PTY exit: Notify client and close connection
		ptyProcess.onExit(({ exitCode }) => {
			console.log(`[Terminal] PTY exited with code ${exitCode}`)
			if (ws.readyState === ws.OPEN) {
				ws.send(`\r\n\x1b[31mTerminal session ended (exit code: ${exitCode})\x1b[0m\r\n`)
				ws.close()
			}
		})

		let wsMessageCount = 0

		// WebSocket → PTY: Forward all input to PTY
		ws.on("message", (data) => {
			wsMessageCount++
			console.log(
				`[Terminal][${sessionId}] WS->PTY #${wsMessageCount}: ${data.length} bytes: ${JSON.stringify(data.toString().substring(0, 50))}`,
			)

			try {
				ptyProcess.write(data.toString())
			} catch (error) {
				console.error(`[Terminal][${sessionId}] Error writing to PTY:`, error)
			}
		})

		// WebSocket close: Kill PTY process
		ws.on("close", () => {
			console.log(`[Terminal][${sessionId}] WebSocket closed, killing PTY`)
			console.log(
				`[Terminal][${sessionId}] STATS: PTY data events: ${ptyDataCount}, WS sends: ${wsSendCount}, WS messages received: ${wsMessageCount}`,
			)
			ptyProcess.kill()
		})

		// WebSocket error: Clean up
		ws.on("error", (error) => {
			console.error(`[Terminal][${sessionId}] WebSocket error:`, error)
			ptyProcess.kill()
		})
	})
}

/**
 * Creates a tRPC server with HTTP and WebSocket support
 * Handles all boilerplate for setting up WebSocket upgrades and listening
 */
export function createTRPCServerWithWebSocket<TRouter extends AnyRouter>({
	router,
	port,
	serverName = "tRPC server",
}: {
	router: TRouter
	port: number
	serverName?: string
}) {
	// Create WebSocket server for tRPC with noServer mode
	const trpcWss = new WebSocketServer({ noServer: true })

	// Create separate WebSocket server for terminal connections
	const terminalWss = new WebSocketServer({ noServer: true })

	// Apply tRPC WebSocket handler to its dedicated WSS
	applyWSSHandler({
		wss: trpcWss,
		router,
		createContext: () => ({}),
		transformer: superjson,
	})

	// Create HTTP server with tRPC and CORS support
	const httpServer = createHTTPServer({
		router,
		createContext: () => ({}),
		transformer: superjson,
		middleware: (req, res, next) => {
			// Enable CORS for all origins in development
			res.setHeader("Access-Control-Allow-Origin", "*")
			res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
			res.setHeader("Access-Control-Allow-Credentials", "true")

			// Handle preflight requests
			if (req.method === "OPTIONS") {
				res.writeHead(204)
				res.end()
				return
			}

			next()
		},
	})

	// Handle WebSocket upgrade requests
	httpServer.on("upgrade", (request, socket, head) => {
		const { pathname } = new URL(request.url || "", "http://localhost")

		// Route /terminal to terminal WebSocket server
		if (pathname === "/terminal") {
			terminalWss.handleUpgrade(request, socket, head, (ws) => {
				terminalWss.emit("connection", ws, request)
			})
			return
		}

		// Route all other paths to tRPC WebSocket server
		trpcWss.handleUpgrade(request, socket, head, (ws) => {
			trpcWss.emit("connection", ws, request)
		})
	})

	// Listen on the configured port
	httpServer.listen(port)

	console.log(`🚀 ${serverName} running at http://localhost:${port}`)

	return { httpServer, wss: terminalWss }
}
