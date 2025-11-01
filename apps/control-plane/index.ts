import { ControlPlane } from "@agistack/control-plane-api"
import { getDrizzle } from "@agistack/db";
import { runMigrations } from "@agistack/db/migrate"
import { resolve } from "node:path"

;(async () => {

	const databasePath = process.env.DATABASE_PATH || "./data/db.sqlite"
	const absoluteDatabasePath = resolve(databasePath)

	await runMigrations(absoluteDatabasePath);

	const db = getDrizzle(databasePath);


	const controlPlane = new ControlPlane(db);

	await controlPlane.start()

	console.log("Control plane started")
})()
