import { type DBNode, nodes } from "@agistack/db"
import { z } from "zod"
import type { Action, ActionDependencies } from "../types"

export const inputSchema = z.object({})

export const outputSchema = z.object({
	nodes: z.array(
		z.object({
			id: z.string(),
			name: z.string(),
			url: z.string(),
			createdAt: z.coerce.date(),
			updatedAt: z.coerce.date(),
		}),
	),
})

type InputSchema = z.infer<typeof inputSchema>
type OutputSchema = z.infer<typeof outputSchema>

export const listNodes: Action<InputSchema, OutputSchema> = {
	metadata: {
		name: "listNodes" as const,
		description: "List all registered nodes in the system.",
		inputSchema,
		outputSchema,
	},

	execute: async (deps: ActionDependencies, input: InputSchema): Promise<OutputSchema> => {
		const allNodes = (await deps.db.select().from(nodes)) as DBNode[]

		return {
			nodes: allNodes,
		}
	},
}
