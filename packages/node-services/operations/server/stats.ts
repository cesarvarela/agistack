import { serverStatsMetadata } from "@agistack/tool-metadata/operations"
import { defineOperation } from "../types"

interface ServerStatsService {
	getAll(): Array<{
		timestamp: number
		cpu: number
		memory: { used: number; total: number; percent: number }
		disk: { used: number; total: number; percent: number }
		network: { rxRate: number; txRate: number }
	}>
}

export const statsOperation = defineOperation<
	typeof serverStatsMetadata.inputSchema,
	typeof serverStatsMetadata.outputSchema,
	{ statsService: ServerStatsService }
>(serverStatsMetadata, async (input, deps) => {
	if (!deps?.statsService) {
		throw new Error("statsService dependency is required")
	}

	return deps.statsService.getAll()
})
