import Database from "better-sqlite3"
import { mkdir } from "node:fs/promises"
import { dirname, isAbsolute, join } from "node:path"
import { fileURLToPath } from "node:url"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { migrate } from "drizzle-orm/better-sqlite3/migrator"

const __dirname = dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_FOLDER = join(__dirname, "migrations")

export async function runMigrations(databasePath: string) {
	if (!isAbsolute(databasePath)) {
		throw new Error(`Database path must be absolute. Got: ${databasePath}`)
	}

	console.log("Running database migrations...")
	console.log(`Database: ${databasePath}`)
	console.log(`Migrations: ${MIGRATIONS_FOLDER}`)

	// Ensure the database directory exists
	const dbDir = dirname(databasePath)
	await mkdir(dbDir, { recursive: true })

	const sqlite = new Database(databasePath)
	const db = drizzle(sqlite)

	await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER })

	console.log("✓ Migrations completed successfully")
	sqlite.close()
}
