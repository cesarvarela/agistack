import { z } from "zod"
import type { DockerContainer } from "../types"
import type { HttpOperation } from "../types"
import { createPtyExecute } from "../utils/ptyOperation"

const inputSchema = z.object({
	status: z
		.enum(["running", "stopped", "all"])
		.optional()
		.describe('Filter by container status. Defaults to "all".'),
})

const outputSchema = z.object({
	containers: z.array(
		z.object({
			dockerId: z.string().describe("Docker container ID"),
			name: z.string().describe("Container name from Docker"),
			image: z.string().describe("Image name from Docker"),
			status: z.string().describe("Container status from Docker"),
			state: z.string().describe("Container state from Docker"),
			ports: z
				.array(
					z.object({
						PrivatePort: z.number(),
						PublicPort: z.number().optional(),
						Type: z.string(),
					}),
				)
				.describe("Port mappings from Docker"),
			created: z.number().describe("Container creation timestamp from Docker"),
			labels: z.record(z.string(), z.coerce.string()).describe("Docker labels"),
		}),
	),
})

type InputSchema = z.infer<typeof inputSchema>
type OutputSchema = z.infer<typeof outputSchema>

export const listContainersOperation: HttpOperation<InputSchema, OutputSchema> = {
	metadata: {
		name: "container.list" as const,
		description:
			"List all containers with their current state from Docker. Returns pure Docker data without metadata. Control plane enriches with metadata.",
		inputSchema,
		outputSchema,
	},

	execute: createPtyExecute(
		(input: InputSchema) => ({
			command: "docker",
			args: ["ps", "-a", "--format", "{{json .}}"],
		}),
		(input: InputSchema, stdout: string) => {
			const dockerContainers: DockerContainer[] = stdout
				.trim()
				.split("\n")
				.filter(Boolean)
				.map((line) => {
					try {
						return JSON.parse(line) as DockerContainer
					} catch {
						return {} as DockerContainer
					}
				})

			// Transform to pure Docker data format
			const containers = dockerContainers.map((dc) => {
				// Parse Labels string into object
				const labelsObj: Record<string, string> = {}
				if (dc.Labels) {
					dc.Labels.split(",").forEach((label) => {
						const [key, ...valueParts] = label.split("=")
						if (key) {
							labelsObj[key] = valueParts.join("=") || ""
						}
					})
				}

				// Parse Ports string into array
				const portsArray: Array<{ PrivatePort: number; PublicPort?: number; Type: string }> = []
				if (dc.Ports) {
					// Example: "0.0.0.0:8080->80/tcp, 443/tcp"
					dc.Ports.split(",").forEach((portStr) => {
						const trimmed = portStr.trim()
						if (!trimmed) return

						// Match patterns like "0.0.0.0:8080->80/tcp" or "80/tcp"
						const match = trimmed.match(/(?:.*:(\d+)->)?(\d+)\/(tcp|udp)/)
						if (match) {
							portsArray.push({
								PublicPort: match[1] ? Number.parseInt(match[1], 10) : undefined,
								PrivatePort: Number.parseInt(match[2], 10),
								Type: match[3],
							})
						}
					})
				}

				return {
					dockerId: dc.ID,
					name: dc.Names.replace(/^\//, "") || "unknown",
					image: dc.Image,
					status: dc.Status,
					state: dc.State,
					ports: portsArray,
					created: 0, // CreatedAt is a string, we'd need to parse it
					labels: labelsObj,
				}
			})

			// Apply status filter if requested
			let filteredContainers = containers
			if (input.status && input.status !== "all") {
				filteredContainers = containers.filter((c) => {
					if (input.status === "running") {
						return c.state === "running"
					}
					if (input.status === "stopped") {
						return c.state === "exited" || c.state === "stopped"
					}
					return true
				})
			}

			return {
				containers: filteredContainers,
			}
		},
	),
}
