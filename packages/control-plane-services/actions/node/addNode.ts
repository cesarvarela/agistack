import { type DBNode, type NewDBNode, nodes } from "@agistack/db"
import { defineOperation } from "@agistack/node-services/operations"
import { addNodeMetadata } from "@agistack/tool-metadata/actions"
import { nanoid } from "nanoid"
import type { ActionDependencies } from "../types"

/**
 * Normalizes a URL to always use HTTP/HTTPS protocol
 * Converts ws:// to http:// and wss:// to https://
 */
function normalizeNodeUrl(url: string): string {
	return url.replace(/^ws:\/\//, "http://").replace(/^wss:\/\//, "https://")
}

export const addNode = defineOperation<
	typeof addNodeMetadata.inputSchema,
	typeof addNodeMetadata.outputSchema,
	ActionDependencies
>(addNodeMetadata, async (input, deps) => {
	if (!deps) throw new Error("Dependencies are required for this action")

	const newNode: NewDBNode = {
		id: nanoid(),
		name: input.name,
		url: normalizeNodeUrl(input.url),
	}

	const insertedNode = deps.db.insert(nodes).values(newNode).returning().get() as DBNode

	return {
		node: insertedNode,
	}
})
