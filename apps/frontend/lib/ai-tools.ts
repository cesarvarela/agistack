import {
	addNodeMetadata,
	deleteNodeMetadata,
	getNodeInfoMetadata,
	listNodesMetadata,
} from "@agistack/tool-metadata/actions"
import {
	getContainerLogsMetadata,
	inspectContainerMetadata,
	listContainersMetadata,
	restartContainerMetadata,
	startContainerMetadata,
	stopContainerMetadata,
} from "@agistack/tool-metadata/operations"
import { tool } from "ai"
import { z } from "zod"

/**
 * Tool executor interface - defines all operations that can be performed by AI tools.
 * This allows tools to execute via tRPC mutations (client-side) or direct API calls (server-side).
 */
export type ToolExecutor = {
	// Queries
	listNodes: () => Promise<unknown>
	getNodeInfo: (args: { nodeId: string }) => Promise<unknown>
	listContainers: (args: {
		nodeId: string
		status?: "all" | "running" | "stopped"
	}) => Promise<unknown>
	inspectContainer: (args: { nodeId: string; dockerId: string }) => Promise<unknown>
	getContainerLogs: (args: {
		nodeId: string
		containerId: string
		lines?: number
		since?: string
	}) => Promise<unknown>

	// Mutations
	addNode: (args: { name: string; url: string }) => Promise<unknown>
	deleteNode: (args: { id: string }) => Promise<unknown>
	startContainer: (args: { nodeId: string; dockerId: string }) => Promise<unknown>
	stopContainer: (args: { nodeId: string; dockerId: string; timeout?: number }) => Promise<unknown>
	restartContainer: (args: {
		nodeId: string
		dockerId: string
		timeout?: number
	}) => Promise<unknown>
}

/**
 * Creates AI SDK tools that use the provided executor to perform operations.
 * Split into queries (read-only) and mutations (write operations).
 */
export function getAiTools(executor: ToolExecutor) {
	// Query tools (read-only operations)
	const queries = {
		listNodes: tool({
			description: listNodesMetadata.description,
			inputSchema: listNodesMetadata.inputSchema,
			execute: async () => executor.listNodes(),
		}),

		getNodeInfo: tool({
			description: getNodeInfoMetadata.description,
			inputSchema: getNodeInfoMetadata.inputSchema,
			execute: async ({ nodeId }) => executor.getNodeInfo({ nodeId }),
		}),

		listContainers: tool({
			description: listContainersMetadata.description,
			inputSchema: z.intersection(
				listContainersMetadata.inputSchema,
				z.object({ nodeId: z.string().describe("The ID of the node to query containers from") }),
			),
			execute: async (args) => executor.listContainers(args),
		}),

		inspectContainer: tool({
			description: inspectContainerMetadata.description,
			inputSchema: z.intersection(
				inspectContainerMetadata.inputSchema,
				z.object({
					nodeId: z.string().describe("The ID of the node where the container is running"),
				}),
			),
			execute: async (args) => executor.inspectContainer(args),
		}),

		getContainerLogs: tool({
			description: getContainerLogsMetadata.description,
			inputSchema: z.intersection(
				getContainerLogsMetadata.inputSchema,
				z.object({
					nodeId: z.string().describe("The ID of the node where the container is running"),
				}),
			),
			execute: async (args) => executor.getContainerLogs(args),
		}),
	}

	// Mutation tools (write operations)
	const mutations = {
		addNode: tool({
			description: addNodeMetadata.description,
			inputSchema: addNodeMetadata.inputSchema,
			execute: async ({ name, url }) => executor.addNode({ name, url }),
		}),

		deleteNode: tool({
			description: deleteNodeMetadata.description,
			inputSchema: deleteNodeMetadata.inputSchema,
			execute: async ({ id }) => executor.deleteNode({ id }),
		}),

		startContainer: tool({
			description: startContainerMetadata.description,
			inputSchema: z.intersection(
				startContainerMetadata.inputSchema,
				z.object({
					nodeId: z.string().describe("The ID of the node where the container is running"),
				}),
			),
			execute: async (args) => executor.startContainer(args),
		}),

		stopContainer: tool({
			description: stopContainerMetadata.description,
			inputSchema: z.intersection(
				stopContainerMetadata.inputSchema,
				z.object({
					nodeId: z.string().describe("The ID of the node where the container is running"),
				}),
			),
			execute: async (args) => executor.stopContainer(args),
		}),

		restartContainer: tool({
			description: restartContainerMetadata.description,
			inputSchema: z.intersection(
				restartContainerMetadata.inputSchema,
				z.object({
					nodeId: z.string().describe("The ID of the node where the container is running"),
				}),
			),
			execute: async (args) => executor.restartContainer(args),
		}),
	}

	return { ...queries, ...mutations }
}
