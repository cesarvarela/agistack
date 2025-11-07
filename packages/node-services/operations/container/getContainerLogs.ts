import { getContainerLogsMetadata } from "@agistack/tool-metadata/operations"
import { defineOperation } from "../types"
import { createPtyExecute } from "../utils/ptyOperation"

export const getContainerLogsOperation = defineOperation(
	getContainerLogsMetadata,
	createPtyExecute(
		(input) => {
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
		(_input, { stdout }) => {
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
)
