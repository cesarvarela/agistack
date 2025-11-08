import { z } from "zod"

const schema = z.object({
	NEXT_PUBLIC_CP_PORT: z.string().min(1),
})

const env = schema.parse({ NEXT_PUBLIC_CP_PORT: process.env.NEXT_PUBLIC_CP_PORT })

export default env
