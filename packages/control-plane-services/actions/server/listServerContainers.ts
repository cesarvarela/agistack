import { listContainersOperation } from "@agistack/node-services/operations"
import { z } from "zod"
import type { Action, ActionDependencies } from "../types"

export const inputSchema = z.intersection(
	listContainersOperation.metadata.inputSchema,
	z.object({
		nodeId: z.string().describe("The ID of the node to query for containers"),
	}),
)

export const outputSchema = listContainersOperation.metadata.outputSchema

type InputSchema = z.infer<typeof inputSchema>
type OutputSchema = z.infer<typeof outputSchema>

export const listServerContainers: Action<InputSchema, OutputSchema> = {
	metadata: {
		name: "listServerContainers" as const,
		description:
			"List all containers from a specific node/server. Delegates to the node's ListContainersOperation.",
		inputSchema,
		outputSchema,
	},

	execute: async (deps: ActionDependencies, input: InputSchema): Promise<OutputSchema> => {
		const { nodeId, ...nodeInput } = input

		// Get node client from registry
		const nodeClient = deps.nodeRegistry.getClient(nodeId)

		// Call node operation
		const result = await nodeClient.client.container.list.query(nodeInput)

		return result
	},
}
