import { createTRPCClient, httpBatchLink } from "@trpc/client"
import getPort from "get-port"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import type { AppRouter } from "../Node"
import { Node } from "../Node"

describe("Node API - Container Operations", () => {
	let node: Node
	let client: ReturnType<typeof createTRPCClient<AppRouter>>
	let port: number

	beforeAll(async () => {
		// Get a free port dynamically to avoid conflicts
		port = await getPort()

		// Setup: Start Node instance
		node = new Node(port)
		await node.start()

		// Create tRPC client (HTTP only for simple queries)
		client = createTRPCClient<AppRouter>({
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
		// Cleanup: Stop the Node server
		await node.stop()
	})

	describe("listContainers", () => {
		it("should list all containers", async () => {
			const response = await client.container.list.query({})

			expect(response).toHaveProperty("containers")
			expect(Array.isArray(response.containers)).toBe(true)
		})

		it("should filter running containers", async () => {
			const response = await client.container.list.query({
				status: "running",
			})

			expect(response).toHaveProperty("containers")
			expect(Array.isArray(response.containers)).toBe(true)

			// If there are running containers, verify they're all running
			if (response.containers.length > 0) {
				expect(response.containers.every((c) => c.state === "running")).toBe(true)
			}
		})

		it("should filter stopped containers", async () => {
			const response = await client.container.list.query({
				status: "stopped",
			})

			expect(response).toHaveProperty("containers")
			expect(Array.isArray(response.containers)).toBe(true)

			// If there are stopped containers, verify none are running
			if (response.containers.length > 0) {
				expect(response.containers.every((c) => c.state !== "running")).toBe(true)
			}
		})

		it("should return proper container structure", async () => {
			const response = await client.container.list.query({})

			// If there are containers, validate the structure
			if (response.containers.length > 0) {
				const container = response.containers[0]!

				expect(container).toHaveProperty("dockerId")
				expect(typeof container.dockerId).toBe("string")

				expect(container).toHaveProperty("name")
				expect(typeof container.name).toBe("string")

				expect(container).toHaveProperty("image")
				expect(typeof container.image).toBe("string")

				expect(container).toHaveProperty("state")
				expect(typeof container.state).toBe("string")

				expect(container).toHaveProperty("status")
				expect(typeof container.status).toBe("string")

				expect(container).toHaveProperty("ports")
				expect(Array.isArray(container.ports)).toBe(true)

				expect(container).toHaveProperty("labels")
				expect(typeof container.labels).toBe("object")

				expect(container).toHaveProperty("created")
				expect(typeof container.created).toBe("number")
			}
		})

		it("should handle status parameter of 'all'", async () => {
			const responseAll = await client.container.list.query({ status: "all" })
			const responseDefault = await client.container.list.query({})

			// Both should return the same results
			expect(responseAll.containers.length).toBe(responseDefault.containers.length)
		})
	})
})
