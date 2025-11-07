import type { DatabaseClient } from "@agistack/db"
import { settings } from "@agistack/db"
import { eq } from "drizzle-orm"

const DEFAULT_ALLOWED_COMMANDS = [
	"docker",
	"ls",
	"cat",
	"grep",
	"ps",
	"df",
	"du",
	"pwd",
	"whoami",
	"uname",
]

export class SettingsService {
	constructor(private db: DatabaseClient) {}

	/**
	 * Initialize settings with defaults if they don't exist.
	 * Should be called once at application startup.
	 */
	initSettings(): void {
		const result = this.db.select().from(settings).where(eq(settings.id, 1)).get()

		if (!result) {
			// Insert defaults on first run
			this.db
				.insert(settings)
				.values({
					id: 1,
					allowedCommands: DEFAULT_ALLOWED_COMMANDS,
					updatedAt: new Date(),
				})
				.run()
		}
	}

	getAllowedCommands(): string[] {
		const result = this.db.select().from(settings).where(eq(settings.id, 1)).get()

		if (!result) {
			throw new Error("Settings not initialized. Call initSettings() first.")
		}

		return result.allowedCommands
	}

	setAllowedCommands(commands: string[]): void {
		this.db
			.update(settings)
			.set({
				allowedCommands: commands,
				updatedAt: new Date(),
			})
			.where(eq(settings.id, 1))
			.run()
	}
}
