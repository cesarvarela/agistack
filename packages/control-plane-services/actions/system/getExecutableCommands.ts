import { getExecutableCommandsMetadata } from "@agistack/tool-metadata/actions"
import type { ActionDependencies } from "../types"
import { defineOperation } from "../types"

export const getExecutableCommands = defineOperation<
	typeof getExecutableCommandsMetadata.inputSchema,
	typeof getExecutableCommandsMetadata.outputSchema,
	ActionDependencies
>(getExecutableCommandsMetadata, async (_input, deps) => {
	if (!deps) throw new Error("Dependencies are required for this action")

	const allowedCommands = deps.settings.getAllowedCommands()

	return {
		allowedCommands,
	}
})
