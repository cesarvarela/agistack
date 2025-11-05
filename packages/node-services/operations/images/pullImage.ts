import { pullImageMetadata } from "@agistack/tool-metadata/operations"
import { defineStreamOperation } from "../types"
import { createPtyStream } from "../utils/ptyOperation"

export const pullImageOperation = defineStreamOperation(
	pullImageMetadata,
	createPtyStream(
		(input) => ({
			command: "docker",
			args: ["pull", input.image],
		}),
		{ cols: 80 },
	),
)
