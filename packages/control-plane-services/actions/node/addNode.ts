import { type NewDBNode, type DBNode, nodes } from "@agistack/db"
import { nanoid } from "nanoid"
import { z } from "zod"
import type { Action, ActionDependencies } from "../types"

export const inputSchema = z.object({
	name: z.string().describe("Display name for the node"),
	url: z.string().url().describe("Base URL of the node API (e.g., http://localhost:3000)"),
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

export const addNode: Action<InputSchema, OutputSchema> = {
	metadata: {
		name: "addNode" as const,
		description: "Add a new node to the system for managing containers and infrastructure.",
		inputSchema,
		outputSchema,
	},

	execute: async (deps: ActionDependencies, input: InputSchema): Promise<OutputSchema> => {
		const newNode: NewDBNode = {
			id: nanoid(),
			name: input.name,
			url: input.url,
		}

		const insertedNode = deps.db.insert(nodes).values(newNode).returning().get() as DBNode

		return {
			node: insertedNode,
		}
	},
}
