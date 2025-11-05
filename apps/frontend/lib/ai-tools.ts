import { createTRPCClient, httpBatchLink } from "@trpc/client"
import type { ControlPlaneRouter } from "@agistack/control-plane-api"
import {
	addNode,
	deleteNode,
	getNodeInfo,
	listNodes,
} from "@agistack/control-plane-services/actions"
import {
	getContainerLogsOperation,
	inspectContainerOperation,
	listContainersOperation,
	restartContainerOperation,
	startContainerOperation,
	stopContainerOperation,
} from "@agistack/node-services/operations"
import superjson from "superjson"
import { z } from "zod"
import { tool } from "ai"

/**
 * Creates AI SDK tools from the Control Plane tRPC API.
 * Split into queries (read-only) and mutations (write operations).
 */
export function getAiTools() {
	const controlPlaneUrl = process.env.NEXT_PUBLIC_CP_URL || "http://localhost:4002"

	// Create server-side tRPC client
	const client = createTRPCClient<ControlPlaneRouter>({
		links: [
			httpBatchLink({
				url: controlPlaneUrl,
				transformer: superjson,
			}),
		],
	})

	// Query tools (read-only operations)
	const queries = {
		listNodes: tool({
			description: listNodes.metadata.description,
			inputSchema: listNodes.metadata.inputSchema,
			execute: async (args) => {
				return await client.actions.listNodes.query(args)
			},
		}),

		getNodeInfo: tool({
			description: getNodeInfo.metadata.description,
			inputSchema: getNodeInfo.metadata.inputSchema,
			execute: async ({ nodeId }) => {
				return await client.actions.getNodeInfo.query({ nodeId })
			},
		}),

		listContainers: tool({
			description: listContainersOperation.metadata.description,
			inputSchema: z.intersection(
				listContainersOperation.metadata.inputSchema,
				z.object({ nodeId: z.string().describe("The ID of the node to query containers from") }),
			),
			execute: async (args) => {
				return await client.proxy.container.list.query(args)
			},
		}),

		inspectContainer: tool({
			description: inspectContainerOperation.metadata.description,
			inputSchema: z.intersection(
				inspectContainerOperation.metadata.inputSchema,
				z.object({ nodeId: z.string().describe("The ID of the node where the container is running") }),
			),
			execute: async (args) => {
				return await client.proxy.container.inspect.query(args)
			},
		}),

		getContainerLogs: tool({
			description: getContainerLogsOperation.metadata.description,
			inputSchema: z.intersection(
				getContainerLogsOperation.metadata.inputSchema,
				z.object({ nodeId: z.string().describe("The ID of the node where the container is running") }),
			),
			execute: async (args) => {
				return await client.proxy.container.logs.query(args)
			},
		}),
	}

	// Mutation tools (write operations)
	const mutations = {
		addNode: tool({
			description: addNode.metadata.description,
			inputSchema: addNode.metadata.inputSchema,
			execute: async ({ name, url }) => {
				return await client.actions.addNode.mutate({ name, url })
			},
		}),

		deleteNode: tool({
			description: deleteNode.metadata.description,
			inputSchema: deleteNode.metadata.inputSchema,
			execute: async ({ nodeId }) => {
				return await client.actions.deleteNode.mutate({ nodeId })
			},
		}),

		startContainer: tool({
			description: startContainerOperation.metadata.description,
			inputSchema: z.intersection(
				startContainerOperation.metadata.inputSchema,
				z.object({ nodeId: z.string().describe("The ID of the node where the container is running") }),
			),
			execute: async (args) => {
				return await client.proxy.container.start.mutate(args)
			},
		}),

		stopContainer: tool({
			description: stopContainerOperation.metadata.description,
			inputSchema: z.intersection(
				stopContainerOperation.metadata.inputSchema,
				z.object({ nodeId: z.string().describe("The ID of the node where the container is running") }),
			),
			execute: async (args) => {
				return await client.proxy.container.stop.mutate(args)
			},
		}),

		restartContainer: tool({
			description: restartContainerOperation.metadata.description,
			inputSchema: z.intersection(
				restartContainerOperation.metadata.inputSchema,
				z.object({ nodeId: z.string().describe("The ID of the node where the container is running") }),
			),
			execute: async (args) => {
				return await client.proxy.container.restart.mutate(args)
			},
		}),
	}

	return { queries, mutations }
}
