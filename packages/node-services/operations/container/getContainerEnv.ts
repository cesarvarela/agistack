import { getContainerEnvMetadata } from "@agistack/tool-metadata/operations"
import { defineOperation } from "../types"
import { createPtyExecute } from "../utils/ptyOperation"

export const getContainerEnvOperation = defineOperation(
	getContainerEnvMetadata,
	createPtyExecute(
		(input) => {
			return {
				command: "docker",
				args: ["exec", input.dockerId, "env"],
			}
		},
		(_input, { stdout }) => {
			// Parse the env output (one KEY=VALUE per line)
			const env = stdout
				.split("\n")
				.map((line) => line.trim())
				.filter(Boolean)
			return {
				env,
			}
		},
	),
)
