import dotenv from "dotenv"
import { z } from "zod"

dotenv.config({ path: "../../.env.local" })

const schema = z.object({
	AGENT_PORT: z.coerce.number().int().min(1).max(65535),
})

export default schema.parse(process.env)
