import { unlink } from "node:fs/promises"
import { resolve } from "node:path"
import { getDrizzle } from "@agistack/db"
import { runMigrations } from "@agistack/db/migrate"

export interface TestDatabase {
	db: ReturnType<typeof getDrizzle>
	path: string
	cleanup: () => Promise<void>
}

/**
 * Setup a test database with migrations
 * @param name - Unique name for this test database
 * @returns Database instance, path, and cleanup function
 */
export async function setupTestDatabase(name: string): Promise<TestDatabase> {
	const timestamp = Date.now()
	const filename = `test-${name}-${timestamp}.sqlite`
	const path = `./data/${filename}`
	const absolutePath = resolve(path)

	// Run migrations
	await runMigrations(absolutePath)

	// Get database instance
	const db = getDrizzle(path)

	// Cleanup function
	const cleanup = async () => {
		try {
			await destroyTestDatabase(path)
		} catch (error) {
			console.error(`Failed to cleanup test database ${path}:`, error)
		}
	}

	return { db, path, cleanup }
}

/**
 * Destroy a test database
 * @param path - Path to the database file
 */
export async function destroyTestDatabase(path: string): Promise<void> {
	try {
		const absolutePath = resolve(path)
		await unlink(absolutePath)
	} catch (error) {
		// Ignore if file doesn't exist
		if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
			throw error
		}
	}
}
