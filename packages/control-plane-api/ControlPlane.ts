import type { Server } from "node:http"
import {
	addNode,
	deleteNode,
	execCommand,
	getExecutableCommands,
	getNodeInfo,
	getSettings,
	listNodes,
	NodeRegistry,
	SettingsService,
	updateSettings,
} from "@agistack/control-plane-services"
import type { DatabaseClient } from "@agistack/db"
import { createTRPCServerWithWebSocket } from "@agistack/node-api"
import {
	getContainerEnvOperation,
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
import superjson from "superjson"
import type { WebSocketServer } from "ws"
import { z } from "zod"
import { subscriptionToAsyncGenerator } from "./helpers"
import { setupTerminalWebSocketProxy } from "./terminal-websocket-proxy"

const t = initTRPC.create({ transformer: superjson })

export class ControlPlane {
	private httpServer: Server | null = null
	private wss: WebSocketServer | null = null
	private port: number
	private secret: string
	private nodeRegistry: NodeRegistry
	private settings: SettingsService

	constructor(
		private db: DatabaseClient,
		port: number,
		secret: string,
	) {
		this.port = port
		this.secret = secret
		this.nodeRegistry = new NodeRegistry(db, secret)
		this.settings = new SettingsService(db)
	}

	private getRouter() {
		return t.router({
			// Local actions
			actions: t.router({
				addNode: t.procedure
					.input(addNode.metadata.inputSchema)
					.output(addNode.metadata.outputSchema)
					.mutation(async ({ input }) => {
						return await addNode.execute(input, {
							db: this.db,
							nodeRegistry: this.nodeRegistry,
							settings: this.settings,
						})
					}),

				listNodes: t.procedure
					.input(listNodes.metadata.inputSchema)
					.output(listNodes.metadata.outputSchema)
					.query(async ({ input }) => {
						return await listNodes.execute(input, {
							db: this.db,
							nodeRegistry: this.nodeRegistry,
							settings: this.settings,
						})
					}),

				getNodeInfo: t.procedure
					.input(getNodeInfo.metadata.inputSchema)
					.output(getNodeInfo.metadata.outputSchema)
					.query(async ({ input }) => {
						return await getNodeInfo.execute(input, {
							db: this.db,
							nodeRegistry: this.nodeRegistry,
							settings: this.settings,
						})
					}),

				deleteNode: t.procedure
					.input(deleteNode.metadata.inputSchema)
					.output(deleteNode.metadata.outputSchema)
					.mutation(async ({ input }) => {
						return await deleteNode.execute(input, {
							db: this.db,
							nodeRegistry: this.nodeRegistry,
							settings: this.settings,
						})
					}),

				execCommand: t.procedure
					.input(execCommand.metadata.inputSchema)
					.output(execCommand.metadata.outputSchema)
					.mutation(async ({ input }) => {
						return await execCommand.execute(input, {
							db: this.db,
							nodeRegistry: this.nodeRegistry,
							settings: this.settings,
						})
					}),

				getExecutableCommands: t.procedure
					.input(getExecutableCommands.metadata.inputSchema)
					.output(getExecutableCommands.metadata.outputSchema)
					.query(async ({ input }) => {
						return await getExecutableCommands.execute(input, {
							db: this.db,
							nodeRegistry: this.nodeRegistry,
							settings: this.settings,
						})
					}),

				getSettings: t.procedure
					.input(getSettings.metadata.inputSchema)
					.output(getSettings.metadata.outputSchema)
					.query(async ({ input }) => {
						return await getSettings.execute(input, {
							db: this.db,
							nodeRegistry: this.nodeRegistry,
							settings: this.settings,
						})
					}),

				updateSettings: t.procedure
					.input(updateSettings.metadata.inputSchema)
					.output(updateSettings.metadata.outputSchema)
					.mutation(async ({ input }) => {
						return await updateSettings.execute(input, {
							db: this.db,
							nodeRegistry: this.nodeRegistry,
							settings: this.settings,
						})
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
							const { nodeId, ...nodeInput } = input
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
							const { nodeId, ...nodeInput } = input
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
							const { nodeId, ...nodeInput } = input
							const nodeClient = this.nodeRegistry.getClient(nodeId)
							return await nodeClient.client.container.logs.query(nodeInput)
						}),

					env: t.procedure
						.input(
							z.intersection(
								getContainerEnvOperation.metadata.inputSchema,
								z.object({ nodeId: z.string() }),
							),
						)
						.output(getContainerEnvOperation.metadata.outputSchema)
						.query(async ({ input }) => {
							const { nodeId, ...nodeInput } = input
							const nodeClient = this.nodeRegistry.getClient(nodeId)
							return await nodeClient.client.container.env.query(nodeInput)
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
							const { nodeId, ...nodeInput } = input
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
							const { nodeId, ...nodeInput } = input
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
							const { nodeId, ...nodeInput } = input
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
							const { nodeId, ...nodeInput } = input
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
							const { nodeId, ...nodeInput } = input
							const nodeClient = this.nodeRegistry.getClient(nodeId)

							return subscriptionToAsyncGenerator((callbacks) =>
								nodeClient.client.container.streamStats.subscribe(nodeInput, callbacks),
							)
						}),
				}),

				server: t.router({
					stats: t.procedure
						.input(z.object({ nodeId: z.string() }))
						.query(async ({ input }) => {
							const nodeClient = this.nodeRegistry.getClient(input.nodeId)
							return await nodeClient.client.server.stats.query({})
						}),

					streamStats: t.procedure
						.input(z.object({ nodeId: z.string() }))
						.subscription(({ input }) => {
							const nodeClient = this.nodeRegistry.getClient(input.nodeId)

							return subscriptionToAsyncGenerator((callbacks) =>
								nodeClient.client.server.streamStats.subscribe({}, callbacks),
							)
						}),
				}),
			}),
		})
	}

	async start() {
		this.settings.initSettings()

		const router = this.getRouter()

		const { httpServer, wss } = createTRPCServerWithWebSocket({
			router,
			port: this.port,
			serverName: "Control Plane tRPC server",
		})

		this.httpServer = httpServer
		this.wss = wss

		// Set up raw WebSocket proxy for terminal (like Dokploy)
		setupTerminalWebSocketProxy(
			wss,
			(nodeId: string) => {
				const node = this.nodeRegistry.getClient(nodeId)
				return node.url
			},
			this.secret,
		)

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
