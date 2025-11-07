import dotenv from "dotenv"
import { z } from "zod"

dotenv.config({ path: "../../.env.local" })

const serviceSchema = z.object({
	DATABASE_PATH: z.string().min(1),
	AGENT_PORT: z.coerce.number().int().min(1).max(65535),
	CONTROL_PLANE_PORT: z.coerce.number().int().min(1).max(65535),
})

export default serviceSchema.parse(process.env)
