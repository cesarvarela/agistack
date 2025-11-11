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
		node = new Node(nodePort, "test-secret")
		await node.start()

		// Start ControlPlane
		controlPlane = new ControlPlane(testDb.db, port, "test-secret")
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
		await client.actions.deleteNode.mutate({ id: nodeId })

		// Cleanup: Close WebSocket client
		wsClient.close()

		// Cleanup: Stop the Node server
		await node.stop()

		// Cleanup: Stop the Control Plane server
		await controlPlane.stop()

		// Cleanup: Destroy test database
		await testDb.cleanup()
	}, 15000) // 15 second timeout for cleanup

	it("should return parsed stats as typed objects", async () => {
		// Get a running container to test with
		const containers = await client.proxy.container.list.query({ nodeId })

		// Test fails if no containers exist
		expect(containers.containers.length).toBeGreaterThan(0)
		// biome-ignore lint/style/noNonNullAssertion: asserted non-empty above
		const testContainer = containers.containers[0]!

		// Subscribe to streamStats
		const statsChunks: Array<
			| {
					cpu: number
					memory: { usage: number; limit: number; percent: number }
					network: { rx: number; tx: number }
					blockIO: { read: number; write: number }
			  }
			| undefined
		> = []

		await new Promise<void>((resolve, reject) => {
			let eventCount = 0
			const subscription = client.proxy.container.streamStats.subscribe(
				{ nodeId, dockerId: testContainer.dockerId },
				{
					onData: (event: unknown) => {
						eventCount++
						const typedEvent = event as { type: string; data?: unknown; error?: unknown }

						// Fail test if we get an error event
						expect(typedEvent.type).not.toBe("error")

						// Only process data events, skip started/other events
						const stats = typedEvent.data as
							| {
									cpu: number
									memory: { usage: number; limit: number; percent: number }
									network: { rx: number; tx: number }
									blockIO: { read: number; write: number }
							  }
							| undefined

						// Stats can be undefined for non-data events like "started"
						statsChunks.push(stats)

						// After 3 events total, stop (usually: 1 started + 2 data events)
						expect(eventCount).toBeLessThanOrEqual(3)
						subscription.unsubscribe()
						resolve()
					},
					onError: (error) => {
						reject(error)
					},
				},
			)
		})

		// Filter out undefined (non-data events) and verify we got 2 real stats
		const validStats = statsChunks.filter((s): s is NonNullable<typeof s> => s !== undefined)
		expect(validStats.length).toBe(2)

		// Verify first stats chunk structure
		// biome-ignore lint/style/noNonNullAssertion: asserted length above
		const firstStats = validStats[0]!
		expect(firstStats.cpu).toBeTypeOf("number")
		expect(firstStats.memory.usage).toBeTypeOf("number")
		expect(firstStats.memory.limit).toBeTypeOf("number")
		expect(firstStats.memory.percent).toBeTypeOf("number")
		expect(firstStats.network.rx).toBeTypeOf("number")
		expect(firstStats.network.tx).toBeTypeOf("number")
		expect(firstStats.blockIO.read).toBeTypeOf("number")
		expect(firstStats.blockIO.write).toBeTypeOf("number")
	}, 10000) // 10 second timeout for this test
})
