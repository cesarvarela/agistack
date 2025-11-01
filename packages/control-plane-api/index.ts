import { Elysia } from "elysia"
import type { DatabaseClient } from "@agistack/db"
import { ListServerContainersAction } from "@agistack/control-plane-services/actions"
import { NodeRegistry } from "@agistack/control-plane-services/node-registry"

export async function getRouter(db: DatabaseClient) {
	// Create NodeRegistry for delegating to nodes
	const nodeRegistry = new NodeRegistry(db)

	const app = new Elysia()
		.post(
			"/actions/list-server-containers",
			async ({ body }) => {
				const action = new ListServerContainersAction(db, nodeRegistry)
				return action.execute(body)
			},
			{
				body: ListServerContainersAction.metadata.inputSchema,
				response: ListServerContainersAction.metadata.outputSchema,
			},
		)

	return app
}

export type ControlPlaneApi = Awaited<ReturnType<typeof getRouter>>

export * from "./ControlPlane"
