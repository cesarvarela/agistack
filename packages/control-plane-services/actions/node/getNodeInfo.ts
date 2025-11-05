import { z } from "zod"
import type { Action, ActionDependencies } from "../types"

export const inputSchema = z.object({
	nodeId: z.string().describe("The ID of the node to retrieve"),
})

export const outputSchema = z.object({
	node: z.object({
		id: z.string(),
		name: z.string(),
		url: z.string(),
		createdAt: z.coerce.date(),
		updatedAt: z.coerce.date(),
	}),
})

type InputSchema = z.infer<typeof inputSchema>
type OutputSchema = z.infer<typeof outputSchema>

export const getNodeInfo: Action<InputSchema, OutputSchema> = {
	metadata: {
		name: "getNodeInfo" as const,
		description: "Get detailed information about a specific node.",
		inputSchema,
		outputSchema,
	},

	execute: async (deps: ActionDependencies, input: InputSchema): Promise<OutputSchema> => {
		const node = deps.nodeRegistry.getNodeRecord(input.nodeId)

		return {
			node,
		}
	},
}
