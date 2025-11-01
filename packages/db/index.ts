/**
 * Database Client (moved from control-plane-api)
 */
import { Database } from "bun:sqlite"
import { type BunSQLiteDatabase, drizzle } from "drizzle-orm/bun-sqlite"
import * as schema from "./schema"

export type DatabaseSchema = typeof schema
export type DatabaseClient = BunSQLiteDatabase<DatabaseSchema>

export function getDrizzle(databasePath: string) {

	const sqlite = new Database(databasePath)
	const db: DatabaseClient = drizzle(sqlite, { schema })

	return db
}

export * from "./schema"
export { eq, and, or, sql } from "drizzle-orm"
