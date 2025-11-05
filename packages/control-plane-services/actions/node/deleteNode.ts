import { nodes } from "@agistack/db"
import { eq } from "drizzle-orm"
import { z } from "zod"
import type { Action, ActionDependencies } from "../types"

export const inputSchema = z.object({
	id: z.string().describe("The ID of the node to delete"),
})

export const outputSchema = z.object({
	success: z.boolean(),
})

type InputSchema = z.infer<typeof inputSchema>
type OutputSchema = z.infer<typeof outputSchema>

export const deleteNode: Action<InputSchema, OutputSchema> = {
	metadata: {
		name: "deleteNode" as const,
		description: "Delete a node from the system.",
		inputSchema,
		outputSchema,
	},

	execute: async (deps: ActionDependencies, input: InputSchema): Promise<OutputSchema> => {
		await deps.db.delete(nodes).where(eq(nodes.id, input.id))

		// Remove from NodeRegistry if it exists
		if (deps.nodeRegistry) {
			deps.nodeRegistry.removeNode(input.id)
		}

		return {
			success: true,
		}
	},
}
