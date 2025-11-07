import { z } from "zod"
import { execMetadata } from "./operations"

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

export const execCommandMetadata = {
	name: "server.execCommand" as const,
	description: "Execute a command on a node (with whitelist validation)",
	inputSchema: z.object({
		nodeId: z.string().describe("The ID of the node to execute the command on"),
		command: z.string().describe("The command to execute (e.g., 'docker', 'ls')"),
		args: z.array(z.string()).optional().describe("Command arguments"),
		cwd: z.string().optional().describe("Working directory for command execution"),
		env: z.record(z.string(), z.string()).optional().describe("Environment variables"),
	}),
	outputSchema: execMetadata.outputSchema,
}

export const getExecutableCommandsMetadata = {
	name: "system.getExecutableCommands" as const,
	description: "Get list of commands available for execution on nodes",
	inputSchema: z.object({}),
	outputSchema: z.object({
		allowedCommands: z.array(z.string()).describe("List of whitelisted commands"),
	}),
}

export const getSettingsMetadata = {
	name: "system.getSettings" as const,
	description: "Get all system settings (UI only, not exposed to AI)",
	inputSchema: z.object({}),
	outputSchema: z.object({
		allowedCommands: z.array(z.string()).describe("List of whitelisted commands"),
	}),
}

export const updateSettingsMetadata = {
	name: "system.updateSettings" as const,
	description: "Update system settings (UI only, not exposed to AI)",
	inputSchema: z.object({
		allowedCommands: z
			.array(z.string())
			.min(1)
			.describe("List of whitelisted commands for execution on nodes"),
	}),
	outputSchema: z.object({
		allowedCommands: z.array(z.string()).describe("Updated list of whitelisted commands"),
	}),
}
