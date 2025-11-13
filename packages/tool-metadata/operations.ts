import { z } from "zod"
import { containerListItemSchema, dockerInspectSchema } from "./schemas"

export const startContainerMetadata = {
	name: "container.start" as const,
	description: "Start a Docker container.",
	inputSchema: z.object({
		dockerId: z.string().describe("Docker container ID"),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		dockerId: z.string(),
		message: z.string().optional(),
	}),
}

export const stopContainerMetadata = {
	name: "container.stop" as const,
	description: "Stop a Docker container.",
	inputSchema: z.object({
		dockerId: z.string().describe("Docker container ID"),
		timeout: z.number().optional().describe("Timeout in seconds before forcing kill"),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		dockerId: z.string(),
		message: z.string().optional(),
	}),
}

export const restartContainerMetadata = {
	name: "container.restart" as const,
	description: "Restart a Docker container.",
	inputSchema: z.object({
		dockerId: z.string().describe("Docker container ID"),
		timeout: z.number().optional().describe("Timeout in seconds before forcing kill"),
	}),
	outputSchema: z.object({
		success: z.boolean(),
		dockerId: z.string(),
		message: z.string().optional(),
	}),
}

export const getContainerLogsMetadata = {
	name: "container.logs" as const,
	description:
		"Get recent logs from a Docker container. Returns the last N lines of logs or logs since a specific timestamp.",
	inputSchema: z.object({
		containerId: z.string().describe("The ID or name of the container"),
		lines: z
			.number()
			.int()
			.positive()
			.optional()
			.describe("Number of lines to return from the end of the logs. Defaults to 100."),
		since: z
			.string()
			.optional()
			.describe(
				"Show logs since timestamp (e.g. 2013-01-02T13:23:37Z) or relative (e.g. 42m for 42 minutes)",
			),
	}),
	outputSchema: z.object({
		logs: z.array(z.string()).describe("Array of log lines from the container"),
	}),
}

export const inspectContainerMetadata = {
	name: "container.inspect" as const,
	description: "Inspect a Docker container and return raw Docker inspect JSON.",
	inputSchema: z.object({
		dockerId: z.string().describe("Docker container ID"),
	}),
	outputSchema: z.object({
		dockerId: z.string(),
		inspect: dockerInspectSchema,
	}),
}

export const listContainersMetadata = {
	name: "container.list" as const,
	description:
		"List all containers with their current state from Docker. Returns pure Docker data without metadata. Control plane enriches with metadata.",
	inputSchema: z.object({
		status: z
			.enum(["running", "stopped", "all"])
			.optional()
			.describe('Filter by container status. Defaults to "all".'),
	}),
	outputSchema: z.object({
		containers: z.array(containerListItemSchema),
	}),
}

export const streamLogsMetadata = {
	name: "container.streamLogs" as const,
	description: "Stream logs from a Docker container with terminal formatting and colors",
	inputSchema: z.object({
		dockerId: z.string().describe("Docker container ID or name"),
		tail: z.coerce
			.number()
			.optional()
			.default(100)
			.describe("Number of log lines to show from the end"),
		follow: z.coerce.boolean().optional().default(true).describe("Follow log output"),
	}),
	outputSchema: z.object({
		output: z.string().describe("Raw terminal output with ANSI escape codes"),
	}),
	cancellable: true as const,
}

export const streamStatsMetadata = {
	name: "container.streamStats" as const,
	description: "Stream real-time statistics from a Docker container",
	inputSchema: z.object({
		dockerId: z.string().describe("Docker container ID or name"),
	}),
	outputSchema: z.object({
		cpu: z.number().describe("CPU usage percentage"),
		memory: z.object({
			usage: z.number().describe("Memory usage in bytes"),
			limit: z.number().describe("Memory limit in bytes"),
			percent: z.number().describe("Memory usage percentage"),
		}),
		network: z.object({
			rx: z.number().describe("Network bytes received"),
			tx: z.number().describe("Network bytes transmitted"),
		}),
		blockIO: z.object({
			read: z.number().describe("Block I/O bytes read"),
			write: z.number().describe("Block I/O bytes written"),
		}),
	}),
	cancellable: true as const,
}

export const pullImageMetadata = {
	name: "image.pull" as const,
	description: "Pull a Docker image with terminal formatting and colors",
	inputSchema: z.object({
		image: z.string().describe("Docker image reference (e.g., 'node:20', 'ubuntu:latest')"),
	}),
	outputSchema: z.object({
		output: z.string().describe("Raw terminal output with ANSI escape codes"),
	}),
	cancellable: true as const,
}

export const execMetadata = {
	name: "server.exec" as const,
	description: "Execute a shell command on the node server",
	inputSchema: z.object({
		command: z.string().describe("The command to execute (e.g., 'docker', 'ls')"),
		args: z.array(z.string()).optional().describe("Command arguments"),
		cwd: z.string().optional().describe("Working directory for command execution"),
		env: z.record(z.string(), z.string()).optional().describe("Environment variables"),
	}),
	outputSchema: z.object({
		exitCode: z.number().describe("Command exit code"),
		stdout: z.string().describe("Standard output"),
		stderr: z.string().describe("Standard error output"),
	}),
}

export const serverStatsMetadata = {
	name: "server.stats" as const,
	description: "Get historical server statistics (CPU, memory, disk, network) for the last 24 hours",
	inputSchema: z.object({}),
	outputSchema: z.array(
		z.object({
			timestamp: z.number().describe("Unix timestamp in milliseconds"),
			cpu: z.number().describe("CPU usage percentage (0-100)"),
			memory: z.object({
				used: z.number().describe("Used memory in bytes"),
				total: z.number().describe("Total memory in bytes"),
				percent: z.number().describe("Memory usage percentage (0-100)"),
			}),
			disk: z.object({
				used: z.number().describe("Used disk space in bytes"),
				total: z.number().describe("Total disk space in bytes"),
				percent: z.number().describe("Disk usage percentage (0-100)"),
			}),
			network: z.object({
				rxRate: z.number().describe("Network receive rate in bytes/second"),
				txRate: z.number().describe("Network transmit rate in bytes/second"),
			}),
		}),
	),
}

export const streamServerStatsMetadata = {
	name: "server.streamStats" as const,
	description: "Stream real-time server statistics (CPU, memory, disk, network)",
	inputSchema: z.object({}),
	outputSchema: z.object({
		timestamp: z.number().describe("Unix timestamp in milliseconds"),
		cpu: z.number().describe("CPU usage percentage (0-100)"),
		memory: z.object({
			used: z.number().describe("Used memory in bytes"),
			total: z.number().describe("Total memory in bytes"),
			percent: z.number().describe("Memory usage percentage (0-100)"),
		}),
		disk: z.object({
			used: z.number().describe("Used disk space in bytes"),
			total: z.number().describe("Total disk space in bytes"),
			percent: z.number().describe("Disk usage percentage (0-100)"),
		}),
		network: z.object({
			rxRate: z.number().describe("Network receive rate in bytes/second"),
			txRate: z.number().describe("Network transmit rate in bytes/second"),
		}),
	}),
	cancellable: true as const,
}
