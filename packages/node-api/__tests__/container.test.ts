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

			expect(response.containers).toBeDefined()
			expect(response.containers.length).toBeGreaterThan(0)
		})

		it("should filter running containers", async () => {
			const response = await client.container.list.query({ status: "running" })

			expect(response.containers).toBeDefined()
			expect(response.containers.length).toBeGreaterThan(0)
			expect(response.containers.every((c) => c.state === "running")).toBe(true)
		})

		it("should filter stopped containers", async () => {
			const response = await client.container.list.query({ status: "stopped" })

			expect(response.containers).toBeDefined()
			expect(response.containers.length).toBeGreaterThan(0)
			expect(response.containers.every((c) => c.state !== "running")).toBe(true)
		})

		it("should return proper container structure", async () => {
			const response = await client.container.list.query({})

			expect(response.containers.length).toBeGreaterThan(0)
			// biome-ignore lint/style/noNonNullAssertion: asserted non-empty above
			const container = response.containers[0]!

			expect(container.dockerId).toBeTypeOf("string")
			expect(container.name).toBeTypeOf("string")
			expect(container.image).toBeTypeOf("string")
			expect(container.state).toBeTypeOf("string")
			expect(container.status).toBeTypeOf("string")
			expect(container.created).toBeTypeOf("number")
		})

		it("should handle status parameter of 'all'", async () => {
			const responseAll = await client.container.list.query({ status: "all" })
			const responseDefault = await client.container.list.query({})

			expect(responseAll.containers.length).toBe(responseDefault.containers.length)
		})
	})
})
