import { z } from "zod"
import type { HttpOperation } from "../types"
import { createPtyExecute } from "../utils/ptyOperation"

const inputSchema = z.object({
	containerId: z.string().describe("The ID or name of the container"),
	lines: z
		.number()
		.int()
		.positive()
		.optional()
		.describe("Number of lines to return from the end of the logs. Defaults to 100."),
	since: z
		.string()
		.optional()
		.describe(
			"Show logs since timestamp (e.g. 2013-01-02T13:23:37Z) or relative (e.g. 42m for 42 minutes)",
		),
})

const outputSchema = z.object({
	logs: z.array(z.string()).describe("Array of log lines from the container"),
})

type InputSchema = z.infer<typeof inputSchema>
type OutputSchema = z.infer<typeof outputSchema>

export const getContainerLogsOperation: HttpOperation<InputSchema, OutputSchema> = {
	metadata: {
		name: "container.logs" as const,
		description:
			"Get recent logs from a Docker container. Returns the last N lines of logs or logs since a specific timestamp.",
		inputSchema,
		outputSchema,
	},

	execute: createPtyExecute(
		(input: InputSchema) => {
			const args = ["logs"]

			// Add lines limit (default to 100 if not specified)
			const lines = input.lines ?? 100
			args.push("--tail", lines.toString())

			// Add since filter if provided
			if (input.since) {
				args.push("--since", input.since)
			}

			args.push(input.containerId)

			return {
				command: "docker",
				args,
			}
		},
		(input: InputSchema, stdout: string) => {
			// Split output into lines and filter out empty lines
			const logs = stdout
				.split("\n")
				.map((line) => line.trim())
				.filter(Boolean)

			return {
				logs,
			}
		},
	),
}
