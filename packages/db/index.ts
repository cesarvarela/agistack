/**
 * Database Client (moved from control-plane-api)
 */
import Database from "better-sqlite3"
import { type BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3"
import * as schema from "./schema"

export type DatabaseSchema = typeof schema
export type DatabaseClient = BetterSQLite3Database<DatabaseSchema>

export function getDrizzle(databasePath: string) {
	const sqlite = new Database(databasePath)
	const db: DatabaseClient = drizzle(sqlite, { schema })

	return db
}

export * from "./schema"
