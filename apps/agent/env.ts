import dotenv from "dotenv"
import { z } from "zod"

dotenv.config({ path: "../../.env.local" })

const schema = z.object({
	AGENT_SECRET: z.string().min(1, "AGENT_SECRET is required"),
	NODE_PORT: z.coerce.number().default(9090),
})

export default schema.parse(process.env)
