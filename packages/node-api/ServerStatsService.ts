import { exec } from "node:child_process"
import os from "node:os"
import { promisify } from "node:util"

const execAsync = promisify(exec)

export interface ServerStatsPoint {
	timestamp: number
	cpu: number
	memory: {
		used: number
		total: number
		percent: number
	}
	disk: {
		used: number
		total: number
		percent: number
	}
	network: {
		rxRate: number
		txRate: number
	}
}

export class ServerStatsService {
	private stats: ServerStatsPoint[] = []
	private interval: NodeJS.Timeout | null = null
	private readonly maxPoints = 1440 // 24 hours at 1-min resolution
	private lastNetworkStats: { rx: number; tx: number; timestamp: number } | null = null
	private lastCpuStats: { idle: number; total: number } | null = null

	start() {
		// Collect immediately on start
		this.collectStats()

		// Then collect every 60 seconds
		this.interval = setInterval(() => {
			this.collectStats()
		}, 60000)
	}

	stop() {
		if (this.interval) {
			clearInterval(this.interval)
			this.interval = null
		}
	}

	getAll(): ServerStatsPoint[] {
		return this.stats
	}

	async getCurrent(): Promise<ServerStatsPoint> {
		const [cpu, memory, disk, network] = await Promise.all([
			this.getCpuUsage(),
			this.getMemoryUsage(),
			this.getDiskUsage(),
			this.getNetworkUsage(),
		])

		return {
			timestamp: Date.now(),
			cpu,
			memory,
			disk,
			network,
		}
	}

	private async collectStats() {
		try {
			const [cpu, memory, disk, network] = await Promise.all([
				this.getCpuUsage(),
				this.getMemoryUsage(),
				this.getDiskUsage(),
				this.getNetworkUsage(),
			])

			const point: ServerStatsPoint = {
				timestamp: Date.now(),
				cpu,
				memory,
				disk,
				network,
			}

			this.stats.push(point)

			// Keep only last maxPoints
			if (this.stats.length > this.maxPoints) {
				this.stats.shift()
			}
		} catch (error) {
			console.error("Failed to collect server stats:", error)
		}
	}

	private async getCpuUsage(): Promise<number> {
		try {
			const cpus = os.cpus()
			let idle = 0
			let total = 0

			for (const cpu of cpus) {
				for (const type in cpu.times) {
					total += cpu.times[type as keyof typeof cpu.times]
				}
				idle += cpu.times.idle
			}

			if (this.lastCpuStats) {
				const idleDelta = idle - this.lastCpuStats.idle
				const totalDelta = total - this.lastCpuStats.total
				const usage = 100 - (100 * idleDelta) / totalDelta
				this.lastCpuStats = { idle, total }
				return Math.max(0, Math.min(100, usage))
			}

			// First run, store baseline
			this.lastCpuStats = { idle, total }
			return 0
		} catch (error) {
			console.error("Failed to get CPU usage:", error)
			return 0
		}
	}

	private async getMemoryUsage(): Promise<ServerStatsPoint["memory"]> {
		try {
			const total = os.totalmem()
			const free = os.freemem()
			const used = total - free
			const percent = (used / total) * 100

			return {
				used,
				total,
				percent: Math.min(100, percent),
			}
		} catch (error) {
			console.error("Failed to get memory usage:", error)
			return { used: 0, total: 0, percent: 0 }
		}
	}

	private async getDiskUsage(): Promise<ServerStatsPoint["disk"]> {
		try {
			// Try Linux/macOS df command for root filesystem
			const { stdout } = await execAsync("df -k /")
			const lines = stdout.trim().split("\n")
			if (lines.length < 2) {
				throw new Error("Invalid df output")
			}

			// Parse df output (skip header)
			const parts = lines[1]?.split(/\s+/)
			if (!parts || parts.length < 5) {
				throw new Error("Invalid df output format")
			}
			const total = Number.parseInt(parts[1] ?? "0", 10) * 1024 // Convert KB to bytes
			const used = Number.parseInt(parts[2] ?? "0", 10) * 1024
			const percent = Number.parseFloat(parts[4] ?? "0")

			return {
				used,
				total,
				percent: Math.min(100, percent),
			}
		} catch (error) {
			console.error("Failed to get disk usage:", error)
			return { used: 0, total: 0, percent: 0 }
		}
	}

	private async getNetworkUsage(): Promise<ServerStatsPoint["network"]> {
		try {
			let rx = 0
			let tx = 0
			const now = Date.now()

			if (process.platform === "linux") {
				// Read from /proc/net/dev
				const { stdout } = await execAsync("cat /proc/net/dev")
				const lines = stdout.split("\n")

				for (const line of lines) {
					// Skip header and loopback
					if (line.includes(":") && !line.includes("lo:")) {
						const parts = line.split(/\s+/).filter((p) => p)
						rx += Number.parseInt(parts[1] ?? "0", 10) || 0 // RX bytes
						tx += Number.parseInt(parts[9] ?? "0", 10) || 0 // TX bytes
					}
				}
			} else {
				// macOS/other: use netstat
				const { stdout } = await execAsync("netstat -ib")
				const lines = stdout.split("\n")

				for (const line of lines) {
					const parts = line.split(/\s+/)
					// Skip header and loopback
					if (parts[0] && parts[0] !== "Name" && parts[0] !== "lo0") {
						rx += Number.parseInt(parts[6] ?? "0", 10) || 0
						tx += Number.parseInt(parts[9] ?? "0", 10) || 0
					}
				}
			}

			if (this.lastNetworkStats) {
				const timeDelta = (now - this.lastNetworkStats.timestamp) / 1000 // seconds
				const rxDelta = rx - this.lastNetworkStats.rx
				const txDelta = tx - this.lastNetworkStats.tx

				const rxRate = Math.max(0, rxDelta / timeDelta)
				const txRate = Math.max(0, txDelta / timeDelta)

				this.lastNetworkStats = { rx, tx, timestamp: now }

				return { rxRate, txRate }
			}

			// First run, store baseline
			this.lastNetworkStats = { rx, tx, timestamp: now }
			return { rxRate: 0, txRate: 0 }
		} catch (error) {
			console.error("Failed to get network usage:", error)
			return { rxRate: 0, txRate: 0 }
		}
	}
}
