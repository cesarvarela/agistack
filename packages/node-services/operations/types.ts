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
 */
export type HttpOperation<TInput = unknown, TOutput = unknown> = {
	readonly metadata: {
		readonly name: string
		readonly description: string
		readonly inputSchema: z.ZodType<TInput>
		readonly outputSchema: z.ZodType<TOutput>
		readonly [key: string]: unknown
	}
	execute: (input: TInput) => Promise<TOutput>
}

/**
 * Stream operation type - WebSocket streaming with cancellation support
 */
export type StreamOperation<TInput = unknown, TOutput = unknown> = {
	readonly metadata: {
		readonly name: string
		readonly description: string
		readonly inputSchema: z.ZodType<TInput>
		readonly outputSchema: z.ZodType<TOutput>
		readonly cancellable: true
		readonly [key: string]: unknown
	}
	stream: (input: TInput, signal?: AbortSignal) => AsyncGenerator<TOutput>
}
