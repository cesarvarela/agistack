import { nodes } from "@agistack/db"
import { defineOperation } from "@agistack/node-services/operations"
import { deleteNodeMetadata } from "@agistack/tool-metadata/actions"
import { eq } from "drizzle-orm"
import type { ActionDependencies } from "../types"

export const deleteNode = defineOperation<
	typeof deleteNodeMetadata.inputSchema,
	typeof deleteNodeMetadata.outputSchema,
	ActionDependencies
>(deleteNodeMetadata, async (input, deps) => {
	if (!deps) throw new Error("Dependencies are required for this action")

	await deps.db.delete(nodes).where(eq(nodes.id, input.id))

	// Remove from NodeRegistry if it exists
	if (deps.nodeRegistry) {
		deps.nodeRegistry.removeNode(input.id)
	}

	return {
		success: true,
	}
})
