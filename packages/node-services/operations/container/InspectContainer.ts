import { z } from "zod"
import type { HttpOperation } from "../types"
import { createPtyExecute } from "../utils/ptyOperation"
import { dockerInspectSchema } from "../../types"

const inputSchema = z.object({
	dockerId: z.string().describe("Docker container ID"),
})

const outputSchema = z.object({
	dockerId: z.string(),
	inspect: dockerInspectSchema,
})

type InputSchema = z.infer<typeof inputSchema>
type OutputSchema = z.infer<typeof outputSchema>

export const inspectContainerOperation: HttpOperation<InputSchema, OutputSchema> = {
	metadata: {
		name: "container.inspect" as const,
		description: "Inspect a Docker container and return raw Docker inspect JSON.",
		inputSchema,
		outputSchema,
	},

	execute: createPtyExecute(
		(input: InputSchema) => ({
			command: "docker",
			args: ["inspect", input.dockerId],
		}),
		(input: InputSchema, stdout: string) => {
			// docker inspect returns an array, even for single containers
			const inspectArray = JSON.parse(stdout)
			const containerData = inspectArray[0]

			if (!containerData) {
				throw new Error(`Container ${input.dockerId} not found`)
			}

			return {
				dockerId: input.dockerId,
				inspect: containerData,
			}
		},
	),
}
