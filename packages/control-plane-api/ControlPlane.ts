import type { Server } from "node:http"
import {
	addNode,
	listNodes,
	getNodeInfo,
	deleteNode,
	NodeRegistry,
} from "@agistack/control-plane-services"
import type { DatabaseClient } from "@agistack/db"
import { createTRPCServerWithWebSocket } from "@agistack/node-api"
import {
	getContainerLogsOperation,
	inspectContainerOperation,
	listContainersOperation,
	restartContainerOperation,
	startContainerOperation,
	stopContainerOperation,
	streamLogsOperation,
	streamStatsOperation,
} from "@agistack/node-services/operations"
import { initTRPC } from "@trpc/server"
import type { WebSocketServer } from "ws"
import { z } from "zod"
import superjson from "superjson"
import { setupTerminalWebSocketProxy } from "./terminal-websocket-proxy"

/**
 * Converts a tRPC client subscription (callback-based) to an async generator.
 * This bridges the gap between tRPC's callback API and the new async generator pattern.
 */
function subscriptionToAsyncGenerator<T>(
	subscribeCallback: (callbacks: {
		onData: (data: T) => void
		onError: (error: unknown) => void
		onComplete: () => void
	}) => { unsubscribe: () => void },
): AsyncGenerator<T> {
	return (async function* () {
		// Create a queue to bridge callback-based subscription to async generator
		const queue: Array<{ type: "data" | "error" | "complete"; payload?: any }> = []
		let resolveNext: ((value: boolean) => void) | null = null
		let isComplete = false

		const subscription = subscribeCallback({
			onData: (event) => {
				queue.push({ type: "data", payload: event })
				resolveNext?.(true)
				resolveNext = null
			},
			onError: (err) => {
				queue.push({ type: "error", payload: err })
				isComplete = true
				resolveNext?.(true)
				resolveNext = null
			},
			onComplete: () => {
				queue.push({ type: "complete" })
				isComplete = true
				resolveNext?.(true)
				resolveNext = null
			},
		})

		try {
			while (!isComplete || queue.length > 0) {
				// Wait for next event if queue is empty
				if (queue.length === 0) {
					await new Promise<boolean>((resolve) => {
						resolveNext = resolve
					})
				}

				const event = queue.shift()
				if (!event) continue

				if (event.type === "data") {
					yield event.payload
				} else if (event.type === "error") {
					throw event.payload
				} else if (event.type === "complete") {
					break
				}
			}
		} finally {
			subscription.unsubscribe()
		}
	})()
}

const t = initTRPC.create({ transformer: superjson })

export class ControlPlane {
	private httpServer: Server | null = null
	private wss: WebSocketServer | null = null
	private port: number
	private nodeRegistry: NodeRegistry

	constructor(
		private db: DatabaseClient,
		port = 4002,
	) {
		this.port = port
		this.nodeRegistry = new NodeRegistry(db)
	}

	/**
	 * Creates the tRPC router with all operations
	 */
	private getRouter() {
		return t.router({
			// Local actions
			actions: t.router({
				addNode: t.procedure
					.input(addNode.metadata.inputSchema)
					.output(addNode.metadata.outputSchema)
					.mutation(async ({ input }) => {
						return await addNode.execute({ db: this.db, nodeRegistry: this.nodeRegistry }, input)
					}),

				listNodes: t.procedure
					.input(listNodes.metadata.inputSchema)
					.output(listNodes.metadata.outputSchema)
					.query(async ({ input }) => {
						return await listNodes.execute({ db: this.db, nodeRegistry: this.nodeRegistry }, input)
					}),

				getNodeInfo: t.procedure
					.input(getNodeInfo.metadata.inputSchema)
					.output(getNodeInfo.metadata.outputSchema)
					.query(async ({ input }) => {
						return await getNodeInfo.execute(
							{ db: this.db, nodeRegistry: this.nodeRegistry },
							input,
						)
					}),

				deleteNode: t.procedure
					.input(deleteNode.metadata.inputSchema)
					.output(deleteNode.metadata.outputSchema)
					.mutation(async ({ input }) => {
						return await deleteNode.execute({ db: this.db, nodeRegistry: this.nodeRegistry }, input)
					}),
			}),

			// Proxy to Node operations
			proxy: t.router({
				container: t.router({
					// Extend Node operation schema with nodeId
					list: t.procedure
						.input(
							z.intersection(
								listContainersOperation.metadata.inputSchema,
								z.object({ nodeId: z.string() }),
							),
						)
						.output(listContainersOperation.metadata.outputSchema)
						.query(async ({ input }) => {
							const { nodeId, ...nodeInput } = input as { nodeId: string; [key: string]: any }
							const nodeClient = this.nodeRegistry.getClient(nodeId)
							return await nodeClient.client.container.list.query(nodeInput)
						}),

					inspect: t.procedure
						.input(
							z.intersection(
								inspectContainerOperation.metadata.inputSchema,
								z.object({ nodeId: z.string() }),
							),
						)
						.output(inspectContainerOperation.metadata.outputSchema)
						.query(async ({ input }) => {
							const { nodeId, ...nodeInput } = input as { nodeId: string; [key: string]: any }
							const nodeClient = this.nodeRegistry.getClient(nodeId)
							return await nodeClient.client.container.inspect.query(nodeInput)
						}),

					logs: t.procedure
						.input(
							z.intersection(
								getContainerLogsOperation.metadata.inputSchema,
								z.object({ nodeId: z.string() }),
							),
						)
						.output(getContainerLogsOperation.metadata.outputSchema)
						.query(async ({ input }) => {
							const { nodeId, ...nodeInput } = input as { nodeId: string; [key: string]: any }
							const nodeClient = this.nodeRegistry.getClient(nodeId)
							return await nodeClient.client.container.logs.query(nodeInput)
						}),

					start: t.procedure
						.input(
							z.intersection(
								startContainerOperation.metadata.inputSchema,
								z.object({ nodeId: z.string() }),
							),
						)
						.output(startContainerOperation.metadata.outputSchema)
						.mutation(async ({ input }) => {
							const { nodeId, ...nodeInput } = input as { nodeId: string; [key: string]: any }
							const nodeClient = this.nodeRegistry.getClient(nodeId)
							return await nodeClient.client.container.start.mutate(nodeInput)
						}),

					stop: t.procedure
						.input(
							z.intersection(
								stopContainerOperation.metadata.inputSchema,
								z.object({ nodeId: z.string() }),
							),
						)
						.output(stopContainerOperation.metadata.outputSchema)
						.mutation(async ({ input }) => {
							const { nodeId, ...nodeInput } = input as { nodeId: string; [key: string]: any }
							const nodeClient = this.nodeRegistry.getClient(nodeId)
							return await nodeClient.client.container.stop.mutate(nodeInput)
						}),

					restart: t.procedure
						.input(
							z.intersection(
								restartContainerOperation.metadata.inputSchema,
								z.object({ nodeId: z.string() }),
							),
						)
						.output(restartContainerOperation.metadata.outputSchema)
						.mutation(async ({ input }) => {
							const { nodeId, ...nodeInput } = input as { nodeId: string; [key: string]: any }
							const nodeClient = this.nodeRegistry.getClient(nodeId)
							return await nodeClient.client.container.restart.mutate(nodeInput)
						}),

					// WebSocket proxy: Frontend → ControlPlane → Node
					streamLogs: t.procedure
						.input(
							z.intersection(
								streamLogsOperation.metadata.inputSchema,
								z.object({ nodeId: z.string() }),
							),
						)
						.subscription(({ input }) => {
							const { nodeId, ...nodeInput } = input as { nodeId: string; [key: string]: any }
							const nodeClient = this.nodeRegistry.getClient(nodeId)

							return subscriptionToAsyncGenerator((callbacks) =>
								nodeClient.client.container.streamLogs.subscribe(nodeInput, callbacks),
							)
						}),

					streamStats: t.procedure
						.input(
							z.intersection(
								streamStatsOperation.metadata.inputSchema,
								z.object({ nodeId: z.string() }),
							),
						)
						.subscription(({ input }) => {
							const { nodeId, ...nodeInput } = input as { nodeId: string; [key: string]: any }
							const nodeClient = this.nodeRegistry.getClient(nodeId)

							return subscriptionToAsyncGenerator((callbacks) =>
								nodeClient.client.container.streamStats.subscribe(nodeInput, callbacks),
							)
						}),
				}),
			}),
		})
	}

	async start() {
		const router = this.getRouter()

		const { httpServer, wss } = createTRPCServerWithWebSocket({
			router,
			port: this.port,
			serverName: "Control Plane tRPC server",
		})

		this.httpServer = httpServer
		this.wss = wss

		// Set up raw WebSocket proxy for terminal (like Dokploy)
		setupTerminalWebSocketProxy(wss, (nodeId: string) => {
			const node = this.nodeRegistry.getClient(nodeId)
			return node.url
		})

		return router
	}

	async stop() {
		return new Promise<void>((resolve, reject) => {
			// Close WebSocket server first
			if (this.wss) {
				this.wss.close((err) => {
					if (err) {
						reject(err)
						return
					}

					// Then close HTTP server
					if (this.httpServer) {
						this.httpServer.close((err) => {
							if (err) {
								reject(err)
								return
							}
							resolve()
						})
					} else {
						resolve()
					}
				})
			} else if (this.httpServer) {
				this.httpServer.close((err) => {
					if (err) {
						reject(err)
						return
					}
					resolve()
				})
			} else {
				resolve()
			}
		})
	}
}

export type ControlPlaneRouter = ReturnType<ControlPlane["getRouter"]>
