import { z } from "zod"

// Client-side environment variables
// All runtime config is now fetched via /api/config endpoint
const schema = z.object({})

const env = schema.parse({})

export default env
