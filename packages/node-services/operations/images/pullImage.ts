import { z } from "zod"
import type { StreamOperation } from "../types"
import { createPtyStream } from "../utils/ptyOperation"

const inputSchema = z.object({
	image: z.string().describe("Docker image reference (e.g., 'node:20', 'ubuntu:latest')"),
})

const outputSchema = z.object({
	output: z.string().describe("Raw terminal output with ANSI escape codes"),
})

type InputSchema = z.infer<typeof inputSchema>
type OutputSchema = z.infer<typeof outputSchema>

export const pullImageOperation: StreamOperation<InputSchema, OutputSchema> = {
	metadata: {
		name: "image.pull" as const,
		description: "Pull a Docker image with terminal formatting and colors",
		inputSchema,
		outputSchema,
		cancellable: true,
	},

	stream: createPtyStream(
		(input: InputSchema) => ({
			command: "docker",
			args: ["pull", input.image],
		}),
		{ cols: 80 },
	),
}
