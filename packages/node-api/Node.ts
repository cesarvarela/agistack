import type { Server } from "node:http"
import {
	getContainerLogsOperation,
	inspectContainerOperation,
	listContainersOperation,
	pullImageOperation,
	restartContainerOperation,
	startContainerOperation,
	stopContainerOperation,
	streamLogsOperation,
	streamStatsOperation,
} from "@agistack/node-services/operations"
import { initTRPC } from "@trpc/server"
import type { WebSocketServer } from "ws"
import {
	createTRPCServerWithWebSocket,
	executeHttpOperation,
	executeStreamOperation,
	setupTerminalWebSocket,
} from "./helpers"

const t = initTRPC.create()

export class Node {
	private httpServer: Server | null = null
	private wss: WebSocketServer | null = null
	private port: number

	constructor(port = 4001) {
		this.port = port
	}

	/**
	 * Creates the tRPC router with all operations
	 */
	private getRouter() {
		return t.router({
			container: t.router({
				list: t.procedure
					.input(listContainersOperation.metadata.inputSchema)
					.output(listContainersOperation.metadata.outputSchema)
					.query(({ input }) => executeHttpOperation(listContainersOperation, input)),

				inspect: t.procedure
					.input(inspectContainerOperation.metadata.inputSchema)
					.output(inspectContainerOperation.metadata.outputSchema)
					.query(({ input }) => executeHttpOperation(inspectContainerOperation, input)),

				logs: t.procedure
					.input(getContainerLogsOperation.metadata.inputSchema)
					.output(getContainerLogsOperation.metadata.outputSchema)
					.query(({ input }) => executeHttpOperation(getContainerLogsOperation, input)),

				start: t.procedure
					.input(startContainerOperation.metadata.inputSchema)
					.output(startContainerOperation.metadata.outputSchema)
					.mutation(({ input }) => executeHttpOperation(startContainerOperation, input)),

				stop: t.procedure
					.input(stopContainerOperation.metadata.inputSchema)
					.output(stopContainerOperation.metadata.outputSchema)
					.mutation(({ input }) => executeHttpOperation(stopContainerOperation, input)),

				restart: t.procedure
					.input(restartContainerOperation.metadata.inputSchema)
					.output(restartContainerOperation.metadata.outputSchema)
					.mutation(({ input }) => executeHttpOperation(restartContainerOperation, input)),

				streamLogs: t.procedure
					.input(streamLogsOperation.metadata.inputSchema)
					.subscription(({ input }) => executeStreamOperation(streamLogsOperation, input)),

				streamStats: t.procedure
					.input(streamStatsOperation.metadata.inputSchema)
					.subscription(({ input }) => executeStreamOperation(streamStatsOperation, input)),
			}),

			image: t.router({
				pullImage: t.procedure
					.input(pullImageOperation.metadata.inputSchema)
					.subscription(({ input }) => executeStreamOperation(pullImageOperation, input)),
			}),
		})
	}

	async start() {
		const router = this.getRouter()

		const { httpServer, wss } = createTRPCServerWithWebSocket({
			router,
			port: this.port,
			serverName: "Node tRPC server",
		})

		this.httpServer = httpServer
		this.wss = wss

		// Set up terminal WebSocket handler for Docker containers
		setupTerminalWebSocket(wss)

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

export type AppRouter = ReturnType<Node["getRouter"]>
