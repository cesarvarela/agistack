import type { DatabaseClient, Node } from "@agistack/db"
import { eq, nodes } from "@agistack/db"
import type { NodeApi } from "@agistack/node-api"
import { treaty } from "@elysiajs/eden"

/**
 * Type-safe HTTP client for calling operations on a remote node
 */
export class NodeClient {
	public readonly client: ReturnType<typeof treaty<NodeApi>>

	constructor(node: Node) {
		this.client = treaty<NodeApi>(node.url)
	}
}

/**
 * Registry for managing node connections
 */
export class NodeRegistry {
	constructor(private db: DatabaseClient) {}

	getNode(nodeId: string): NodeClient {
		// For now, we'll query synchronously when needed
		// In production, you might want to cache this
		const node = this.db.select().from(nodes).where(eq(nodes.id, nodeId)).get() as Node | undefined

		if (!node) {
			throw new Error(`Node not found: ${nodeId}`)
		}

		return new NodeClient(node)
	}
}
