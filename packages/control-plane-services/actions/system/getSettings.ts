import { defineOperation } from "@agistack/node-services/operations"
import { getSettingsMetadata } from "@agistack/tool-metadata/actions"
import type { ActionDependencies } from "../types"

export const getSettings = defineOperation<
	typeof getSettingsMetadata.inputSchema,
	typeof getSettingsMetadata.outputSchema,
	ActionDependencies
>(getSettingsMetadata, async (_input, deps) => {
	if (!deps) throw new Error("Dependencies are required")

	const allowedCommands = await deps.settings.getAllowedCommands()

	return {
		allowedCommands,
	}
})
