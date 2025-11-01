import type { HttpOperation, OperationEvent, StreamOperation } from "@agistack/node-services/operations"
import type { AnyRouter } from "@trpc/server"
import { createHTTPServer } from "@trpc/server/adapters/standalone"
import { applyWSSHandler } from "@trpc/server/adapters/ws"
import { WebSocketServer } from "ws"

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
	// Create WebSocket server with noServer mode
	const wss = new WebSocketServer({ noServer: true })

	// Apply tRPC WebSocket handler
	applyWSSHandler({
		wss,
		router,
		createContext: () => ({}),
	})

	// Create HTTP server with tRPC
	const httpServer = createHTTPServer({
		router,
		createContext: () => ({}),
	})

	// Handle WebSocket upgrade requests
	httpServer.on("upgrade", (request, socket, head) => {
		wss.handleUpgrade(request, socket, head, (ws) => {
			wss.emit("connection", ws, request)
		})
	})

	// Listen on the configured port
	httpServer.listen(port);

	console.log(`🚀 ${serverName} running at http://localhost:${port}`)

	return { httpServer, wss }
}
