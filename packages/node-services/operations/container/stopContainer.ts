import { z } from "zod"
import type { HttpOperation } from "../types"
import { createPtyExecute } from "../utils/ptyOperation"

const inputSchema = z.object({
	dockerId: z.string().describe("Docker container ID"),
	timeout: z.number().optional().describe("Timeout in seconds before forcing kill"),
})

const outputSchema = z.object({
	success: z.boolean(),
	dockerId: z.string(),
	message: z.string().optional(),
})

type InputSchema = z.infer<typeof inputSchema>
type OutputSchema = z.infer<typeof outputSchema>

export const stopContainerOperation: HttpOperation<InputSchema, OutputSchema> = {
	metadata: {
		name: "container.stop" as const,
		description: "Stop a Docker container.",
		inputSchema,
		outputSchema,
	},

	execute: createPtyExecute(
		(input: InputSchema) => ({
			command: "docker",
			args: [
				"stop",
				...(input.timeout !== undefined ? ["--time", input.timeout.toString()] : []),
				input.dockerId,
			],
		}),
		(input: InputSchema, stdout: string) => {
			return {
				success: true,
				dockerId: input.dockerId,
				message: `Container ${input.dockerId} stopped successfully`,
			}
		},
	),
}
