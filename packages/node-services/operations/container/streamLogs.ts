import { streamLogsMetadata } from "@agistack/tool-metadata/operations"
import { defineStreamOperation } from "../types"
import { createPtyStream } from "../utils/ptyOperation"

export const streamLogsOperation = defineStreamOperation(
	streamLogsMetadata,
	createPtyStream((input) => {
		const args = ["logs"]

		if (input.tail) {
			args.push("--tail", input.tail.toString())
		}

		if (input.follow) {
			args.push("--follow")
		}

		args.push(input.dockerId)

		return { command: "docker", args }
	}),
)
