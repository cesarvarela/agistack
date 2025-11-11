import { resolve } from "node:path"
import { ControlPlane, type ControlPlaneRouter } from "@agistack/control-plane-api"
import { CONTROL_PLANE_PORT } from "@agistack/control-plane-api/constants"
import { getDrizzle } from "@agistack/db"
import { runMigrations } from "@agistack/db/migrate"
import { NODE_PORT } from "@agistack/node-api/constants"
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client"
import superjson from "superjson"
import env from "./env"

;(async () => {
	const databasePath = env.DATABASE_PATH
	const absoluteDatabasePath = resolve(databasePath)

	await runMigrations(absoluteDatabasePath)

	const db = getDrizzle(databasePath)

	const controlPlane = new ControlPlane(db, CONTROL_PLANE_PORT, env.AGENT_SECRET)

	await controlPlane.start()

	console.log("Control plane started")

	const agentUrl = `http://localhost:${NODE_PORT}`

	const client = createTRPCProxyClient<ControlPlaneRouter>({
		links: [
			httpBatchLink({
				url: `http://localhost:${CONTROL_PLANE_PORT}`,
				transformer: superjson,
			}),
		],
	})

	const { nodes } = await client.actions.listNodes.query({})
	const alreadyExists = nodes.some((n) => n.url === agentUrl)

	if (!alreadyExists) {
		const result = await client.actions.addNode.mutate({
			name: "Local",
			url: agentUrl,
		})
		console.log(`✓ Auto-registered local agent at ${result.node.url}`)
	} else {
		console.log("Local agent already registered")
	}
})()
