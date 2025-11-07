import dotenv from "dotenv"
import { z } from "zod"

dotenv.config({ path: "../../.env.local" })

const schema = z.object({
	NEXT_PUBLIC_CP_PORT: z.string().min(1),
})

// Skip validation during Docker build
const env =
	process.env.DOCKER_BUILD === "true"
		? ({} as z.infer<typeof schema>)
		: schema.parse(process.env)

export default env
