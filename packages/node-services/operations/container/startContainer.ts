import { startContainerMetadata } from "@agistack/tool-metadata/operations"
import { defineOperation } from "../types"
import { createPtyExecute } from "../utils/ptyOperation"

export const startContainerOperation = defineOperation(
	startContainerMetadata,
	createPtyExecute(
		(input) => ({
			command: "docker",
			args: ["start", input.dockerId],
		}),
		(input, _output) => {
			return {
				success: true,
				dockerId: input.dockerId,
				message: `Container ${input.dockerId} started successfully`,
			}
		},
	),
)
