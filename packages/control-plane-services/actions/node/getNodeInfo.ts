import { defineOperation } from "@agistack/node-services/operations"
import { getNodeInfoMetadata } from "@agistack/tool-metadata/actions"
import type { ActionDependencies } from "../types"

export const getNodeInfo = defineOperation<
	typeof getNodeInfoMetadata.inputSchema,
	typeof getNodeInfoMetadata.outputSchema,
	ActionDependencies
>(getNodeInfoMetadata, async (input, deps) => {
	if (!deps) throw new Error("Dependencies are required for this action")

	const node = deps.nodeRegistry.getNodeRecord(input.nodeId)

	return {
		node,
	}
})
