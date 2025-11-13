import { streamServerStatsMetadata } from "@agistack/tool-metadata/operations"
import { defineStreamOperation } from "../types"

interface ServerStatsService {
	getAll(): Array<{
		timestamp: number
		cpu: number
		memory: { used: number; total: number; percent: number }
		disk: { used: number; total: number; percent: number }
		network: { rxRate: number; txRate: number }
	}>
}

// Store service reference globally within this module
let statsServiceInstance: ServerStatsService | null = null

export function setStatsService(service: ServerStatsService) {
	statsServiceInstance = service
}

export const streamStatsOperation = defineStreamOperation<
	typeof streamServerStatsMetadata.inputSchema,
	typeof streamServerStatsMetadata.outputSchema
>(streamServerStatsMetadata, async function* (_input, signal?: AbortSignal) {
	if (!statsServiceInstance) {
		throw new Error("statsService not initialized - call setStatsService first")
	}

	// Yield current latest stat immediately
	const currentStats = statsServiceInstance.getAll()
	const latestStat = currentStats[currentStats.length - 1]
	if (latestStat) {
		yield latestStat
	}

	// Then yield new stats every 60 seconds
	while (!signal?.aborted) {
		await new Promise<void>((resolve) => {
			const timeout = setTimeout(resolve, 60000)
			signal?.addEventListener("abort", () => {
				clearTimeout(timeout)
				resolve()
			})
		})

		if (signal?.aborted) break

		const stats = statsServiceInstance.getAll()
		const newLatestStat = stats[stats.length - 1]
		if (newLatestStat) {
			yield newLatestStat
		}
	}
})
