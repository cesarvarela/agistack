import { execCommandMetadata } from "@agistack/tool-metadata/actions"
import type { ActionDependencies } from "../types"
import { defineOperation } from "../types"

export const execCommand = defineOperation<
	typeof execCommandMetadata.inputSchema,
	typeof execCommandMetadata.outputSchema,
	ActionDependencies
>(execCommandMetadata, async (input, deps) => {
	if (!deps) throw new Error("Dependencies are required for this action")

	const { nodeId, command, args, cwd, env } = input
	const { settings, nodeRegistry } = deps

	// Validate command against whitelist
	const allowedCommands = settings.getAllowedCommands()

	if (!allowedCommands.includes(command)) {
		throw new Error(
			`Command "${command}" is not allowed. Allowed commands: ${allowedCommands.join(", ")}`,
		)
	}

	// Get node client
	const nodeClient = nodeRegistry.getClient(nodeId)

	// Proxy to node operation
	const result = await nodeClient.client.server.exec.mutate({
		command,
		args,
		cwd,
		env,
	})

	return result
})
