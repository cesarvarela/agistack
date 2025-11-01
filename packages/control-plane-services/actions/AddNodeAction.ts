import type { NewNode, Node } from "@agistack/db"
import { nodes } from "@agistack/db"
import { nanoid } from "nanoid"
import { z } from "zod"
import { Action } from "./BaseAction"

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

export class AddNodeAction extends Action<InputSchema, OutputSchema> {
	static readonly metadata = {
		name: "addNode" as const,
		description: "Add a new node to the system for managing containers and infrastructure.",
		inputSchema,
		outputSchema,
	}

	async execute(input: InputSchema): Promise<OutputSchema> {
		const newNode: NewNode = {
			id: nanoid(),
			name: input.name,
			url: input.url,
		}

		const insertedNode = this.db.insert(nodes).values(newNode).returning().get() as Node

		return {
			node: insertedNode,
		}
	}
}
