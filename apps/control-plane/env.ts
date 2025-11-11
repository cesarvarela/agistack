import dotenv from "dotenv"
import { z } from "zod"

dotenv.config({ path: "../../.env.local" })

const serviceSchema = z.object({
	DATABASE_PATH: z.string().min(1),
	AGENT_SECRET: z.string().min(1, "AGENT_SECRET is required"),
})

export default serviceSchema.parse(process.env)
