import dotenv from "dotenv"
import { z } from "zod"

dotenv.config({ path: "../../.env.local" })

const serviceSchema = z.object({
	DATABASE_PATH: z.string().min(1),
	NODE_SECRET: z.string().min(1, "NODE_SECRET is required"),
	NODE_PORT: z.coerce.number().default(9090),
})

export default serviceSchema.parse(process.env)
