import { execMetadata } from "@agistack/tool-metadata/operations"
import { defineOperation } from "../types"
import { createPtyExecute } from "../utils/ptyOperation"

export const execOperation = defineOperation(
	execMetadata,
	createPtyExecute(
		(input) => ({
			command: input.command,
			args: input.args || [],
			cwd: input.cwd,
			env: input.env,
		}),
		(_input, { stdout, stderr, exitCode }) => ({
			exitCode,
			stdout,
			stderr,
		}),
	),
)
