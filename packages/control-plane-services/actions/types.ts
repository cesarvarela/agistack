import type { DatabaseClient } from "@agistack/db"
import type { z } from "zod"
import type { NodeRegistry } from "../NodeRegistry"

export type ActionDependencies = {
	db: DatabaseClient
	nodeRegistry: NodeRegistry
}

export interface Action<TInput = unknown, TOutput = unknown> {
	metadata: {
		name: string
		description: string
		inputSchema: z.ZodType<TInput>
		outputSchema: z.ZodType<TOutput>
	}
	execute: (deps: ActionDependencies, input: TInput) => Promise<TOutput>
}
