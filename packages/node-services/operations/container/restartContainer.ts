import { restartContainerMetadata } from "@agistack/tool-metadata/operations"
import { defineOperation } from "../types"
import { createPtyExecute } from "../utils/ptyOperation"

export const restartContainerOperation = defineOperation(
	restartContainerMetadata,
	createPtyExecute(
		(input) => ({
			command: "docker",
			args: [
				"restart",
				...(input.timeout !== undefined ? ["--time", input.timeout.toString()] : []),
				input.dockerId,
			],
		}),
		(input, _output) => {
			return {
				success: true,
				dockerId: input.dockerId,
				message: `Container ${input.dockerId} restarted successfully`,
			}
		},
	),
)
