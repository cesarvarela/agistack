import { z } from "zod"

/**
 * Docker container inspect output from `docker inspect`
 */
export const dockerInspectSchema = z.object({
	Name: z.string().optional(),
	Config: z
		.object({
			Image: z.string().optional(),
		})
		.optional(),
	State: z
		.object({
			Status: z.string().optional(),
		})
		.optional(),
	NetworkSettings: z
		.object({
			Ports: z
				.record(
					z.string(),
					z
						.array(
							z.object({
								HostIp: z.string().optional(),
								HostPort: z.string().optional(),
							}),
						)
						.nullable(),
				)
				.optional(),
		})
		.optional(),
})

export type DockerInspectInfo = z.infer<typeof dockerInspectSchema>

/**
 * Parsed port mapping for containers
 */
export const containerPortSchema = z.object({
	PrivatePort: z.number(),
	PublicPort: z.number().optional(),
	Type: z.string(),
})

export type ContainerPort = z.infer<typeof containerPortSchema>

/**
 * Parsed container item from container list operation
 * This is the processed output that gets returned by the API
 */
export const containerListItemSchema = z.object({
	dockerId: z.string().describe("Docker container ID"),
	name: z.string().describe("Container name from Docker"),
	image: z.string().describe("Image name from Docker"),
	status: z.string().describe("Container status from Docker"),
	state: z.string().describe("Container state from Docker"),
	ports: z.array(containerPortSchema).describe("Port mappings from Docker"),
	created: z.number().describe("Container creation timestamp from Docker"),
	labels: z.record(z.string(), z.coerce.string()).describe("Docker labels"),
})

export type ContainerListItem = z.infer<typeof containerListItemSchema>
