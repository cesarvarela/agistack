import type { DatabaseClient } from "@agistack/db"
import { getRouter } from "."

export class ControlPlane {
	constructor(private db: DatabaseClient) {}

	async start() {
		const app = await getRouter(this.db)

		;(await app).listen(4002)

		console.log(`ControlPlane started at http://${app.server?.hostname}:${app.server?.port}`)
	}
}
