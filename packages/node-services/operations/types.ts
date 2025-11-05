import type { z } from "zod"

/**
 * Unified event schema for all streaming operations
 * All operations emit these events through WebSocket connections
 */
export type OperationEvent<TData = unknown> =
	| { type: "started"; opId: string }
	| { type: "progress"; opId: string; message: string; percent?: number }
	| { type: "data"; opId: string; data: TData }
	| { type: "complete"; opId: string }
	| { type: "error"; opId: string; error: string }

/**
 * HTTP operation type - simple request-response pattern
 * Supports optional dependencies for Control Plane actions
 */
export type HttpOperation<
	TInputSchema extends z.ZodType,
	TOutputSchema extends z.ZodType,
	TDeps = z.ZodAny,
> = {
	metadata: {
		name: string
		description: string
		inputSchema: TInputSchema
		outputSchema: TOutputSchema
	}
	execute: (input: z.infer<TInputSchema>, deps?: TDeps) => Promise<z.infer<TOutputSchema>>
}

/**
 * Stream operation type - WebSocket streaming with cancellation support
 */
export type StreamOperation<TInputSchema extends z.ZodType, TOutputSchema extends z.ZodType> = {
	metadata: {
		name: string
		description: string
		inputSchema: TInputSchema
		outputSchema: TOutputSchema
		cancellable: true
		[key: string]: unknown
	}
	stream: (
		input: z.infer<TInputSchema>,
		signal?: AbortSignal,
	) => AsyncGenerator<z.infer<TOutputSchema>>
}

/**
 * Unified helper function to define operations with perfect type inference
 * Works for both Node operations (no deps) and Control Plane actions (with deps)
 */
export function defineOperation<
	TInputSchema extends z.ZodType,
	TOutputSchema extends z.ZodType,
	TDeps = void,
>(
	metadata: {
		name: string
		description: string
		inputSchema: TInputSchema
		outputSchema: TOutputSchema
	},
	execute: (input: z.infer<TInputSchema>, deps?: TDeps) => Promise<z.infer<TOutputSchema>>,
): HttpOperation<TInputSchema, TOutputSchema, TDeps> {
	return { metadata, execute }
}

/**
 * @deprecated Use defineOperation instead
 */
export const defineHttpOperation = defineOperation

/**
 * Helper function to define stream operations with perfect type inference
 */
export function defineStreamOperation<
	TInputSchema extends z.ZodType,
	TOutputSchema extends z.ZodType,
>(
	metadata: {
		name: string
		description: string
		inputSchema: TInputSchema
		outputSchema: TOutputSchema
		cancellable: true
		[key: string]: unknown
	},
	stream: (
		input: z.infer<TInputSchema>,
		signal?: AbortSignal,
	) => AsyncGenerator<z.infer<TOutputSchema>>,
): StreamOperation<TInputSchema, TOutputSchema> {
	return { metadata, stream }
}
