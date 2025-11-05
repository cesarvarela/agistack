import { stopContainerMetadata } from "@agistack/tool-metadata/operations"
import { defineHttpOperation } from "../types"
import { createPtyExecute } from "../utils/ptyOperation"

export const stopContainerOperation = defineHttpOperation(
	stopContainerMetadata,
	createPtyExecute(
		(input) => ({
			command: "docker",
			args: [
				"stop",
				...(input.timeout !== undefined ? ["--time", input.timeout.toString()] : []),
				input.dockerId,
			],
		}),
		(input, _stdout: string) => {
			return {
				success: true,
				dockerId: input.dockerId,
				message: `Container ${input.dockerId} stopped successfully`,
			}
		},
	),
)
