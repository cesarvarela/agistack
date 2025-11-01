import type { DatabaseClient, DBNode } from "@agistack/db"
import { eq, nodes } from "@agistack/db"
import { NodeClient } from "./NodeClient"

/**
 * Registry for managing node connections
 */
export class NodeRegistry {
	private clientCache = new Map<string, NodeClient>()

	constructor(private db: DatabaseClient) {}

	/**
	 * Get node database record by ID
	 */
	getNodeRecord(nodeId: string): DBNode {
		const node = this.db.select().from(nodes).where(eq(nodes.id, nodeId)).get() as DBNode | undefined

		if (!node) {
			throw new Error(`Node not found: ${nodeId}`)
		}

		return node
	}

	/**
	 * Get or create a client connection to a node
	 */
	getClient(nodeId: string): NodeClient {
		if (!this.clientCache.has(nodeId)) {
			const node = this.getNodeRecord(nodeId)
			this.clientCache.set(nodeId, new NodeClient(node.url))
		}
		return this.clientCache.get(nodeId)!
	}

	/**
	 * Remove a node and clean up its client connection
	 */
	removeNode(nodeId: string): void {
		const client = this.clientCache.get(nodeId)
		if (client) {
			client.dispose()
			this.clientCache.delete(nodeId)
		}
	}
}
