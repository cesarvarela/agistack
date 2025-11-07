import { defineConfig } from "drizzle-kit"
import env from "./env"

export default defineConfig({
	schema: "./schema.ts",
	out: "./migrations",
	dialect: "sqlite",
	dbCredentials: {
		url: env.DATABASE_PATH,
	},
	verbose: true,
	strict: true,
})
