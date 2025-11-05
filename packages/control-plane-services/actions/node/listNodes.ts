import { type DBNode, nodes } from "@agistack/db"
import { defineOperation } from "@agistack/node-services/operations"
import { listNodesMetadata } from "@agistack/tool-metadata/actions"
import type { ActionDependencies } from "../types"

export const listNodes = defineOperation<
	typeof listNodesMetadata.inputSchema,
	typeof listNodesMetadata.outputSchema,
	ActionDependencies
>(listNodesMetadata, async (_input, deps) => {
	if (!deps) throw new Error("Dependencies are required for this action")

	const allNodes = (await deps.db.select().from(nodes)) as DBNode[]

	return {
		nodes: allNodes,
	}
})
