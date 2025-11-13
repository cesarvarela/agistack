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
	getCurrent(): Promise<{
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

	// Yield current stats immediately
	yield await statsServiceInstance.getCurrent()

	// Then yield fresh stats every second
	while (!signal?.aborted) {
		await new Promise<void>((resolve) => {
			const timeout = setTimeout(resolve, 1000)
			signal?.addEventListener("abort", () => {
				clearTimeout(timeout)
				resolve()
			})
		})

		if (signal?.aborted) break

		yield await statsServiceInstance.getCurrent()
	}
})
