import { Node } from "@agistack/node-api"
import { createTRPCClient, createWSClient, wsLink } from "@trpc/client"
import getPort from "get-port"
import superjson from "superjson"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import type { ControlPlaneRouter } from "../ControlPlane"
import { ControlPlane } from "../ControlPlane"
import { setupTestDatabase, type TestDatabase } from "./utils"

describe("Control Plane API - streamStats Subscription", () => {
	let node: Node
	let nodePort: number
	let controlPlane: ControlPlane
	let client: ReturnType<typeof createTRPCClient<ControlPlaneRouter>>
	let testDb: TestDatabase
	let wsClient: ReturnType<typeof createWSClient>
	let port: number
	let nodeId: string

	beforeAll(async () => {
		// Get free ports dynamically to avoid conflicts
		port = await getPort()
		nodePort = await getPort()

		// Setup database
		testDb = await setupTestDatabase("control-plane-stream-stats")

		// Start Node server first
		node = new Node(nodePort)
		await node.start()

		// Start ControlPlane
		controlPlane = new ControlPlane(testDb.db, port)
		await controlPlane.start()

		// Create WebSocket client for subscriptions
		wsClient = createWSClient({
			url: `ws://localhost:${port}`,
		})

		// Create tRPC client with WebSocket support
		client = createTRPCClient<ControlPlaneRouter>({
			links: [
				wsLink({
					client: wsClient,
					transformer: superjson,
				}),
			],
		})

		// Wait for servers to be ready
		await new Promise((resolve) => setTimeout(resolve, 500))

		// Add the ephemeral node to ControlPlane
		const addResponse = await client.actions.addNode.mutate({
			name: "test-node-for-stats",
			url: `http://localhost:${nodePort}`,
		})
		nodeId = addResponse.node.id
	})

	afterAll(async () => {
		// Cleanup: Remove node from registry first
		if (nodeId) {
			try {
				await client.actions.deleteNode.mutate({ id: nodeId })
			} catch (error) {
				console.warn("Failed to delete node from registry:", error)
			}
		}

		// Cleanup: Close WebSocket client
		wsClient.close()

		// Cleanup: Stop the Node server
		if (node) {
			await node.stop()
		}

		// Cleanup: Stop the Control Plane server
		await controlPlane.stop()

		// Cleanup: Destroy test database
		await testDb.cleanup()
	}, 15000) // 15 second timeout for cleanup

	it("should return parsed stats as typed objects", async () => {
		// Get a running container to test with
		const containers = await client.proxy.container.list.query({
			nodeId,
		})

		if (containers.containers.length === 0) {
			console.warn("Skipping streamStats test: No containers available")
			return
		}

		const testContainer = containers.containers[0]!

		// Subscribe to streamStats
		const statsChunks: any[] = []
		const startTime = Date.now()

		await new Promise<void>((resolve, reject) => {
			const subscription = client.proxy.container.streamStats.subscribe(
				{
					nodeId,
					dockerId: testContainer.dockerId,
				},
				{
					onData: (event: any) => {
						try {
							console.log("Received event:", JSON.stringify(event, null, 2))

							// Check if it's a data event with stats
							if (event.type === "data") {
								const stats = event.data

								// Verify stats object is defined
								expect(stats).toBeDefined()

								// Verify stats has all required properties with correct types
								expect(stats.cpu).toBeTypeOf("number")
								expect(stats.memory).toBeDefined()
								expect(stats.memory.usage).toBeTypeOf("number")
								expect(stats.memory.limit).toBeTypeOf("number")
								expect(stats.memory.percent).toBeTypeOf("number")
								expect(stats.network).toBeDefined()
								expect(stats.network.rx).toBeTypeOf("number")
								expect(stats.network.tx).toBeTypeOf("number")
								expect(stats.blockIO).toBeDefined()
								expect(stats.blockIO.read).toBeTypeOf("number")
								expect(stats.blockIO.write).toBeTypeOf("number")

								statsChunks.push(stats)

								// Collect 2 chunks then stop
								if (statsChunks.length >= 2) {
									subscription.unsubscribe()
									resolve()
								}
							} else if (event.type === "started") {
								console.log("Stream started")
							} else if (event.type === "error") {
								console.error("Stream error:", event.error)
								subscription.unsubscribe()
								reject(new Error(event.error))
							}

							// Timeout after 5 seconds
							if (Date.now() - startTime > 5000) {
								subscription.unsubscribe()
								resolve()
							}
						} catch (error) {
							console.error("Test error:", error)
							subscription.unsubscribe()
							reject(error)
						}
					},
					onError: (error) => {
						reject(error)
					},
				},
			)
		})

		// Verify we got at least one stats chunk
		expect(statsChunks.length).toBeGreaterThan(0)
	}, 10000) // 10 second timeout for this test
})
