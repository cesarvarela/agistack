export interface DockerContainer {
	ID: string
	Names: string
	Image: string
	State: string
	Status: string
	Ports?: string
	CreatedAt?: string
	Labels?: string
	[key: string]: unknown
}
