import { z } from "zod"

const schema = z.object({
	NEXT_PUBLIC_CP_PORT: z.string().min(1),
})

// Skip validation during Docker build
const env =
	process.env.DOCKER_BUILD === "true"
		? ({} as z.infer<typeof schema>)
		: schema.parse({ NEXT_PUBLIC_CP_PORT: process.env.NEXT_PUBLIC_CP_PORT })

export default env
