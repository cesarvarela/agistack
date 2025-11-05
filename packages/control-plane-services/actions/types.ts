import type { DatabaseClient } from "@agistack/db"
import { defineOperation } from "@agistack/node-services/operations"
import type { z } from "zod"
import type { NodeRegistry } from "../NodeRegistry"

export type ActionDependencies = {
	db: DatabaseClient
	nodeRegistry: NodeRegistry
}

/**
 * Re-export defineOperation for convenience
 * Use this to define Control Plane actions with ActionDependencies
 */
export { defineOperation }

/**
 * @deprecated Use defineOperation instead
 */
export interface Action<
	TInputSchema extends z.ZodObject<any> = z.ZodObject<any>,
	TOutputSchema extends z.ZodObject<any> = z.ZodObject<any>,
	TInput = z.infer<TInputSchema>,
	TOutput = z.infer<TOutputSchema>,
> {
	metadata: {
		name: string
		description: string
		inputSchema: TInputSchema
		outputSchema: TOutputSchema
	}
	execute: (deps: ActionDependencies, input: TInput) => Promise<TOutput>
}
