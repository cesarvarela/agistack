import { inspectContainerMetadata } from "@agistack/tool-metadata/operations"
import { defineHttpOperation } from "../types"
import { createPtyExecute } from "../utils/ptyOperation"

export const inspectContainerOperation = defineHttpOperation(
	inspectContainerMetadata,
	createPtyExecute(
		(input) => ({
			command: "docker",
			args: ["inspect", input.dockerId],
		}),
		(input, stdout: string) => {
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
)
