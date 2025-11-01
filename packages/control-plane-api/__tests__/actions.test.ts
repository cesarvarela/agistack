import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { createTRPCClient, httpBatchLink } from "@trpc/client"
import { ControlPlane } from "../ControlPlane"
import type { ControlPlaneRouter } from "../ControlPlane"
import { setupTestDatabase, type TestDatabase } from "./utils"

describe("Control Plane API - Actions", () => {
	let controlPlane: ControlPlane
	let client: ReturnType<typeof createTRPCClient<ControlPlaneRouter>>
	let testDb: TestDatabase
	const port = 4002

	beforeAll(async () => {
		// Setup database
		testDb = await setupTestDatabase("control-plane-actions")

		// Start ControlPlane
		controlPlane = new ControlPlane(testDb.db, port)
		await controlPlane.start()

		// Create tRPC client (HTTP only)
		client = createTRPCClient<ControlPlaneRouter>({
			links: [
				httpBatchLink({
					url: `http://localhost:${port}`,
				}),
			],
		})

		// Wait for server to be ready
		await new Promise((resolve) => setTimeout(resolve, 500))
	})

	afterAll(async () => {
		// Cleanup: Stop the Control Plane server
		await controlPlane.stop()

		// Cleanup: Destroy test database
		await testDb.cleanup()
	})

	describe("addNode", () => {
		it("should add a new node", async () => {
			const response = await client.actions.addNode.mutate({
				name: "test-node",
				url: "http://localhost:4001",
			})

			// Type inference is now working - response.node is properly typed!
			expect(response).toHaveProperty("node")
			expect(response.node).toHaveProperty("id")
			expect(typeof response.node.id).toBe("string")
			expect(response.node.name).toBe("test-node")
			expect(response.node.url).toBe("http://localhost:4001")
		})

		it("should add multiple nodes with different names", async () => {
			const response1 = await client.actions.addNode.mutate({
				name: "node-1",
				url: "http://localhost:4003",
			})

			const response2 = await client.actions.addNode.mutate({
				name: "node-2",
				url: "http://localhost:4004",
			})

			expect(response1.node.id).not.toBe(response2.node.id)
			expect(response1.node.name).toBe("node-1")
			expect(response2.node.name).toBe("node-2")
		})

		it("should return node with all required fields", async () => {
			const response = await client.actions.addNode.mutate({
				name: "complete-node",
				url: "http://localhost:4005",
			})

			const { node } = response

			// Validate all expected fields exist
			expect(node).toHaveProperty("id")
			expect(node).toHaveProperty("name")
			expect(node).toHaveProperty("url")

			// Validate field types
			expect(typeof node.id).toBe("string")
			expect(typeof node.name).toBe("string")
			expect(typeof node.url).toBe("string")

			// Validate values
			expect(node.id.length).toBeGreaterThan(0)
			expect(node.name).toBe("complete-node")
			expect(node.url).toBe("http://localhost:4005")
		})
	})
})
