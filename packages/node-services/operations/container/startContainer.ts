import { startContainerMetadata } from "@agistack/tool-metadata/operations"
import { defineHttpOperation } from "../types"
import { createPtyExecute } from "../utils/ptyOperation"

export const startContainerOperation = defineHttpOperation(
	startContainerMetadata,
	createPtyExecute(
		(input) => ({
			command: "docker",
			args: ["start", input.dockerId],
		}),
		(input, _stdout: string) => {
			return {
				success: true,
				dockerId: input.dockerId,
				message: `Container ${input.dockerId} started successfully`,
			}
		},
	),
)
