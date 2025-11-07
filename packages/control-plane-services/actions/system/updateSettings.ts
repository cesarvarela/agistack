import { defineOperation } from "@agistack/node-services/operations"
import { updateSettingsMetadata } from "@agistack/tool-metadata/actions"
import type { ActionDependencies } from "../types"

export const updateSettings = defineOperation<
	typeof updateSettingsMetadata.inputSchema,
	typeof updateSettingsMetadata.outputSchema,
	ActionDependencies
>(updateSettingsMetadata, async (input, deps) => {
	if (!deps) throw new Error("Dependencies are required")

	// Validate that allowedCommands is not empty
	if (!input.allowedCommands || input.allowedCommands.length === 0) {
		throw new Error("allowedCommands cannot be empty")
	}

	// Validate that commands don't contain invalid characters
	const invalidCommands = input.allowedCommands.filter((cmd: string) => /[;&|<>$`\\]/.test(cmd))
	if (invalidCommands.length > 0) {
		throw new Error(`Invalid characters in commands: ${invalidCommands.join(", ")}`)
	}

	await deps.settings.setAllowedCommands(input.allowedCommands)

	return {
		allowedCommands: input.allowedCommands,
	}
})
