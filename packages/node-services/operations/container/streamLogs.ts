import { z } from "zod"
import type { StreamOperation } from "../types"
import { createPtyStream } from "../utils/ptyOperation"

const inputSchema = z.object({
	dockerId: z.string().describe("Docker container ID or name"),
	tail: z.coerce
		.number()
		.optional()
		.default(100)
		.describe("Number of log lines to show from the end"),
	follow: z.coerce.boolean().optional().default(true).describe("Follow log output"),
})

const outputSchema = z.object({
	output: z.string().describe("Raw terminal output with ANSI escape codes"),
})

type InputSchema = z.infer<typeof inputSchema>
type OutputSchema = z.infer<typeof outputSchema>

export const streamLogsOperation: StreamOperation<InputSchema, OutputSchema> = {
	metadata: {
		name: "container.streamLogs" as const,
		description: "Stream logs from a Docker container with terminal formatting and colors",
		inputSchema,
		outputSchema,
		cancellable: true,
	},

	stream: createPtyStream((input: InputSchema) => {
		const args = ["logs"]

		if (input.tail) {
			args.push("--tail", input.tail.toString())
		}

		if (input.follow) {
			args.push("--follow")
		}

		args.push(input.dockerId)

		return { command: "docker", args }
	}),
}
