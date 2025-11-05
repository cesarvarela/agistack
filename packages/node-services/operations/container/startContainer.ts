import { z } from "zod"
import type { HttpOperation } from "../types"
import { createPtyExecute } from "../utils/ptyOperation"

const inputSchema = z.object({
	dockerId: z.string().describe("Docker container ID"),
})

const outputSchema = z.object({
	success: z.boolean(),
	dockerId: z.string(),
	message: z.string().optional(),
})

type InputSchema = z.infer<typeof inputSchema>
type OutputSchema = z.infer<typeof outputSchema>

export const startContainerOperation: HttpOperation<InputSchema, OutputSchema> = {
	metadata: {
		name: "container.start" as const,
		description: "Start a Docker container.",
		inputSchema,
		outputSchema,
	},

	execute: createPtyExecute(
		(input: InputSchema) => ({
			command: "docker",
			args: ["start", input.dockerId],
		}),
		(input: InputSchema, stdout: string) => {
			return {
				success: true,
				dockerId: input.dockerId,
				message: `Container ${input.dockerId} started successfully`,
			}
		},
	),
}
