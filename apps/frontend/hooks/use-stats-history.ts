import { useEffect, useRef, useState } from "react"

export interface StatsData {
	cpu: number
	memory: {
		usage: number
		limit: number
		percent: number
	}
	network: {
		rx: number
		tx: number
	}
	blockIO: {
		read: number
		write: number
	}
}

export interface StatsPoint {
	timestamp: number
	cpu: number
	memoryPercent: number
	networkRxRate: number
	networkTxRate: number
	blockReadRate: number
	blockWriteRate: number
}

const MAX_POINTS = 300 // 5 minutes at ~1 second intervals

export function useStatsHistory(stats: StatsData | null) {
	const [history, setHistory] = useState<StatsPoint[]>([])
	const lastStatsRef = useRef<{ stats: StatsData; timestamp: number } | null>(null)

	useEffect(() => {
		if (!stats) return

		const now = Date.now()
		const lastStats = lastStatsRef.current

		let networkRxRate = 0
		let networkTxRate = 0
		let blockReadRate = 0
		let blockWriteRate = 0

		// Calculate rates if we have previous data
		if (lastStats) {
			const timeDelta = (now - lastStats.timestamp) / 1000 // seconds

			if (timeDelta > 0) {
				// Network rates (bytes/second)
				networkRxRate = (stats.network.rx - lastStats.stats.network.rx) / timeDelta
				networkTxRate = (stats.network.tx - lastStats.stats.network.tx) / timeDelta

				// Block I/O rates (bytes/second)
				blockReadRate = (stats.blockIO.read - lastStats.stats.blockIO.read) / timeDelta
				blockWriteRate = (stats.blockIO.write - lastStats.stats.blockIO.write) / timeDelta
			}
		}

		// Store current stats for next calculation
		lastStatsRef.current = { stats, timestamp: now }

		// Add new point to history
		const newPoint: StatsPoint = {
			timestamp: now,
			cpu: stats.cpu,
			memoryPercent: stats.memory.percent,
			networkRxRate: Math.max(0, networkRxRate), // Prevent negative values
			networkTxRate: Math.max(0, networkTxRate),
			blockReadRate: Math.max(0, blockReadRate),
			blockWriteRate: Math.max(0, blockWriteRate),
		}

		setHistory((prev) => {
			const updated = [...prev, newPoint]
			// Keep only the last MAX_POINTS
			return updated.slice(-MAX_POINTS)
		})
	}, [stats])

	// Clear history when stats becomes null (disconnected)
	useEffect(() => {
		if (!stats) {
			setHistory([])
			lastStatsRef.current = null
		}
	}, [stats])

	return history
}
