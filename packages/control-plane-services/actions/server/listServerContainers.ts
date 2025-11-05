import { defineOperation, listContainersOperation } from "@agistack/node-services/operations"
import { z } from "zod"
import type { ActionDependencies } from "../types"

export const inputSchema = z.intersection(
	listContainersOperation.metadata.inputSchema,
	z.object({
		nodeId: z.string().describe("The ID of the node to query for containers"),
	}),
)

export const outputSchema = listContainersOperation.metadata.outputSchema

export const listServerContainers = defineOperation<typeof inputSchema, typeof outputSchema, ActionDependencies>(
	{
		name: "listServerContainers" as const,
		description:
			"List all containers from a specific node/server. Delegates to the node's ListContainersOperation.",
		inputSchema,
		outputSchema,
	},
	async (input, deps) => {
		if (!deps) throw new Error("Dependencies are required for this action")

		const { nodeId, ...nodeInput } = input

		// Get node client from registry
		const nodeClient = deps.nodeRegistry.getClient(nodeId)

		// Call node operation
		const result = await nodeClient.client.container.list.query(nodeInput)

		return result
	},
)
