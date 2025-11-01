import type { Server } from "node:http"
import { addNode, NodeRegistry } from "@agistack/control-plane-services"
import type { DatabaseClient } from "@agistack/db"
import { createTRPCServerWithWebSocket } from "@agistack/node-api"
import {
	inspectContainerOperation,
	listContainersOperation,
	streamLogsOperation,
} from "@agistack/node-services/operations"
import { initTRPC } from "@trpc/server"
import type { WebSocketServer } from "ws"
import { z } from "zod"

const t = initTRPC.create()

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

							return (async function* () {
								try {
									// Subscribe to Node's streamLogs and proxy events
									const subscription = nodeClient.client.container.streamLogs.subscribe(nodeInput, {})
									for await (const event of subscription as any) {
										yield event // Proxy OperationEvent<{output: string}>
									}
								} catch (error) {
									// Yield error event if connection fails
									yield {
										type: "error" as const,
										opId: crypto.randomUUID(),
										error: error instanceof Error ? error.message : "Failed to connect to node",
									}
								}
							})()
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
