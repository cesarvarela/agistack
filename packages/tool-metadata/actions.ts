import { z } from "zod"

export const addNodeMetadata = {
	name: "addNode" as const,
	description: "Add a new node to the system for managing containers and infrastructure.",
	inputSchema: z.object({
		name: z.string().describe("Display name for the node"),
		url: z.string().url().describe("Base URL of the node API (e.g., http://localhost:3000)"),
	}),
	outputSchema: z.object({
		node: z.object({
			id: z.string(),
			name: z.string(),
			url: z.string(),
			createdAt: z.coerce.date(),
			updatedAt: z.coerce.date(),
		}),
	}),
}

export const deleteNodeMetadata = {
	name: "deleteNode" as const,
	description: "Delete a node from the system.",
	inputSchema: z.object({
		id: z.string().describe("The ID of the node to delete"),
	}),
	outputSchema: z.object({
		success: z.boolean(),
	}),
}

export const listNodesMetadata = {
	name: "listNodes" as const,
	description: "List all registered nodes in the system.",
	inputSchema: z.object({}),
	outputSchema: z.object({
		nodes: z.array(
			z.object({
				id: z.string(),
				name: z.string(),
				url: z.string(),
				createdAt: z.coerce.date(),
				updatedAt: z.coerce.date(),
			}),
		),
	}),
}

export const getNodeInfoMetadata = {
	name: "getNodeInfo" as const,
	description: "Get detailed information about a specific node.",
	inputSchema: z.object({
		nodeId: z.string().describe("The ID of the node to retrieve"),
	}),
	outputSchema: z.object({
		node: z.object({
			id: z.string(),
			name: z.string(),
			url: z.string(),
			createdAt: z.coerce.date(),
			updatedAt: z.coerce.date(),
		}),
	}),
}
