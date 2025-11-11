import dotenv from "dotenv"
import { z } from "zod"

dotenv.config({ path: "../../.env.local" })

const schema = z.object({
	OPENROUTER_API_KEY: z.string().min(1),
	OPENROUTER_MODEL: z.string().min(1),
	AGENT_SECRET: z.string().min(1),
})

// Skip validation during Docker build
const env =
	process.env.DOCKER_BUILD === "true" ? ({} as z.infer<typeof schema>) : schema.parse(process.env)

export default env
