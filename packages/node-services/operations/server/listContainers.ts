import { listContainersMetadata } from "@agistack/tool-metadata/operations"
import { defineHttpOperation } from "../types"
import { createPtyExecute } from "../utils/ptyOperation"

/**
 * Raw Docker container output from `docker ps --format json`
 * Only used internally for parsing, not exposed in API
 */
interface DockerContainerRaw {
	ID: string
	Names: string
	Image: string
	State: string
	Status: string
	Ports?: string
	CreatedAt?: string
	Labels?: string
}

export const listContainersOperation = defineHttpOperation(
	listContainersMetadata,
	createPtyExecute(
		(_input) => ({
			command: "docker",
			args: ["ps", "-a", "--format", "{{json .}}"],
		}),
		(input, { stdout }) => {
			const dockerContainers: DockerContainerRaw[] = stdout
				.trim()
				.split("\n")
				.filter(Boolean)
				.map((line) => {
					try {
						return JSON.parse(line) as DockerContainerRaw
					} catch {
						return {} as DockerContainerRaw
					}
				})

			// Transform to pure Docker data format
			const containers = dockerContainers.map((dc) => {
				// Parse Labels string into object
				const labelsObj: Record<string, string> = {}
				if (dc.Labels) {
					dc.Labels.split(",").forEach((label: string) => {
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
					dc.Ports.split(",").forEach((portStr: string) => {
						const trimmed = portStr.trim()
						if (!trimmed) return

						// Match patterns like "0.0.0.0:8080->80/tcp" or "80/tcp"
						const match = trimmed.match(/(?:.*:(\d+)->)?(\d+)\/(tcp|udp)/)
						if (match) {
							portsArray.push({
								PublicPort: match[1] ? Number.parseInt(match[1], 10) : undefined,
								PrivatePort: Number.parseInt(match[2]!, 10),
								Type: match[3]!,
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
)
