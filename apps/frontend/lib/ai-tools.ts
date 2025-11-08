import {
	addNodeMetadata,
	deleteNodeMetadata,
	execCommandMetadata,
	getExecutableCommandsMetadata,
	getNodeInfoMetadata,
	listNodesMetadata,
} from "@agistack/tool-metadata/actions"
import {
	restartContainerMetadata,
	startContainerMetadata,
	stopContainerMetadata,
} from "@agistack/tool-metadata/operations"
import { tool } from "ai"
import { z } from "zod"

/**
 * Creates AI SDK tools for the chatbot.
 * All tools are executed client-side via the onToolCall callback.
 */
export function getAiTools() {
	// Query tools (read-only operations)
	const queries = {
		listNodes: tool({
			description: listNodesMetadata.description,
			inputSchema: listNodesMetadata.inputSchema,
		}),

		getNodeInfo: tool({
			description: getNodeInfoMetadata.description,
			inputSchema: getNodeInfoMetadata.inputSchema,
		}),

		getExecutableCommands: tool({
			description: getExecutableCommandsMetadata.description,
			inputSchema: getExecutableCommandsMetadata.inputSchema,
		}),
	}

	// Mutation tools (write operations)
	const mutations = {
		addNode: tool({
			description: addNodeMetadata.description,
			inputSchema: addNodeMetadata.inputSchema,
		}),

		deleteNode: tool({
			description: deleteNodeMetadata.description,
			inputSchema: deleteNodeMetadata.inputSchema,
		}),

		startContainer: tool({
			description: startContainerMetadata.description,
			inputSchema: z.intersection(
				startContainerMetadata.inputSchema,
				z.object({
					nodeId: z.string().describe("The ID of the node where the container is running"),
				}),
			),
		}),

		stopContainer: tool({
			description: stopContainerMetadata.description,
			inputSchema: z.intersection(
				stopContainerMetadata.inputSchema,
				z.object({
					nodeId: z.string().describe("The ID of the node where the container is running"),
				}),
			),
		}),

		restartContainer: tool({
			description: restartContainerMetadata.description,
			inputSchema: z.intersection(
				restartContainerMetadata.inputSchema,
				z.object({
					nodeId: z.string().describe("The ID of the node where the container is running"),
				}),
			),
		}),

		execCommand: tool({
			description: `${execCommandMetadata.description}. IMPORTANT: Call getExecutableCommands first to see which commands are available before attempting to execute.`,
			inputSchema: execCommandMetadata.inputSchema,
		}),
	}

	return { ...queries, ...mutations }
}
