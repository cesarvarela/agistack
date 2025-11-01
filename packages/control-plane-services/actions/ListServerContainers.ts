import {
	listContainersInputSchema,
	listContainersOutputSchema,
} from "@agistack/node-services/operations"
import { z } from "zod"
import { Action } from "./BaseAction"

export const inputSchema = listContainersInputSchema.extend({
	nodeId: z.string().describe("The ID of the node to query for containers"),
})

export const outputSchema = listContainersOutputSchema

type InputSchema = z.infer<typeof inputSchema>
type OutputSchema = z.infer<typeof outputSchema>

export class ListServerContainersAction extends Action<InputSchema, OutputSchema> {
	static readonly metadata = {
		name: "listServerContainers" as const,
		description:
			"List all containers from a specific node/server. Delegates to the node's ListContainersOperation.",
		inputSchema,
		outputSchema,
	}

	async execute(input: InputSchema): Promise<OutputSchema> {
		const { nodeId, ...nodeInput } = input
		
		const node = this.nodeRegistry.getNode(nodeId)

		const response = await node.client.containers.list.post(nodeInput)

		if (response.error) {
			throw new Error(`Failed to list containers: ${response.error}`)
		}

		return response.data
	}
}
