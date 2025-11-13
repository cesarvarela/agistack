import crypto from "node:crypto"
import type { Server } from "node:http"
import {
	execOperation,
	getContainerLogsOperation,
	inspectContainerOperation,
	listContainersOperation,
	pullImageOperation,
	restartContainerOperation,
	serverStatsOperation,
	setStatsService,
	startContainerOperation,
	stopContainerOperation,
	streamLogsOperation,
	streamServerStatsOperation,
	streamStatsOperation,
} from "@agistack/node-services/operations"
import { initTRPC, TRPCError } from "@trpc/server"
import superjson from "superjson"
import type { WebSocketServer } from "ws"
import {
	createTRPCServerWithWebSocket,
	executeHttpOperation,
	executeStreamOperation,
	setupTerminalWebSocket,
	type TRPCContext,
} from "./helpers"
import { ServerStatsService } from "./ServerStatsService"

const t = initTRPC.context<TRPCContext>().create({
	transformer: superjson,
})

export class Node {
	private httpServer: Server | null = null
	private wss: WebSocketServer | null = null
	private port: number
	private secret: string
	private protectedProcedure: ReturnType<typeof t.procedure.use>
	private statsService: ServerStatsService

	constructor(port: number, secret: string) {
		this.port = port
		this.secret = secret
		this.statsService = new ServerStatsService()

		// Initialize stats service for stream operation
		setStatsService(this.statsService)

		// Create auth middleware inline - validates AGISTACK_SECRET using timing-safe comparison
		const authMiddleware = t.middleware(({ ctx, next }) => {
			const authHeader = ctx.req?.headers?.authorization

			if (!authHeader || !authHeader.startsWith("Bearer ")) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Missing or invalid authorization header",
				})
			}

			const providedSecret = authHeader.substring(7) // Remove "Bearer "

			// Timing-safe comparison to prevent timing attacks
			const expectedBuffer = Buffer.from(secret, "utf8")
			const providedBuffer = Buffer.from(providedSecret, "utf8")

			if (expectedBuffer.length !== providedBuffer.length) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Invalid secret",
				})
			}

			if (!crypto.timingSafeEqual(expectedBuffer, providedBuffer)) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Invalid secret",
				})
			}

			return next({ ctx })
		})

		this.protectedProcedure = t.procedure.use(authMiddleware)
	}

	/**
	 * Creates the tRPC router with all operations
	 */
	private getRouter() {
		const protectedProcedure = this.protectedProcedure
		return t.router({
			container: t.router({
				list: protectedProcedure
					.input(listContainersOperation.metadata.inputSchema)
					.output(listContainersOperation.metadata.outputSchema)
					.query(({ input }) => executeHttpOperation(listContainersOperation, input)),

				inspect: protectedProcedure
					.input(inspectContainerOperation.metadata.inputSchema)
					.output(inspectContainerOperation.metadata.outputSchema)
					.query(({ input }) => executeHttpOperation(inspectContainerOperation, input)),

				logs: protectedProcedure
					.input(getContainerLogsOperation.metadata.inputSchema)
					.output(getContainerLogsOperation.metadata.outputSchema)
					.query(({ input }) => executeHttpOperation(getContainerLogsOperation, input)),

				start: protectedProcedure
					.input(startContainerOperation.metadata.inputSchema)
					.output(startContainerOperation.metadata.outputSchema)
					.mutation(({ input }) => executeHttpOperation(startContainerOperation, input)),

				stop: protectedProcedure
					.input(stopContainerOperation.metadata.inputSchema)
					.output(stopContainerOperation.metadata.outputSchema)
					.mutation(({ input }) => executeHttpOperation(stopContainerOperation, input)),

				restart: protectedProcedure
					.input(restartContainerOperation.metadata.inputSchema)
					.output(restartContainerOperation.metadata.outputSchema)
					.mutation(({ input }) => executeHttpOperation(restartContainerOperation, input)),

				streamLogs: protectedProcedure
					.input(streamLogsOperation.metadata.inputSchema)
					.subscription(({ input }) => executeStreamOperation(streamLogsOperation, input)),

				streamStats: protectedProcedure
					.input(streamStatsOperation.metadata.inputSchema)
					.subscription(({ input }) => executeStreamOperation(streamStatsOperation, input)),
			}),

			image: t.router({
				pullImage: protectedProcedure
					.input(pullImageOperation.metadata.inputSchema)
					.subscription(({ input }) => executeStreamOperation(pullImageOperation, input)),
			}),

			server: t.router({
				exec: protectedProcedure
					.input(execOperation.metadata.inputSchema)
					.output(execOperation.metadata.outputSchema)
					.mutation(({ input }) => executeHttpOperation(execOperation, input)),

				stats: protectedProcedure
					.input(serverStatsOperation.metadata.inputSchema)
					.output(serverStatsOperation.metadata.outputSchema)
					.query(({ input }) =>
						executeHttpOperation(serverStatsOperation, input, { statsService: this.statsService }),
					),

				streamStats: protectedProcedure
					.input(streamServerStatsOperation.metadata.inputSchema)
					.subscription(({ input }) => executeStreamOperation(streamServerStatsOperation, input)),
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

		setupTerminalWebSocket(wss, this.secret)

		// Start stats collection
		this.statsService.start()

		return router
	}

	async stop() {
		// Stop stats collection
		this.statsService.stop()

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
