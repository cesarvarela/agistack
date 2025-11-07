import { z } from "zod"

const schema = z.object({
	DATABASE_PATH: z.string().min(1),
})

export default schema.parse(process.env)
