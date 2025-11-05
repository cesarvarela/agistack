import stripAnsi from "strip-ansi"
import { z } from "zod"
import type { StreamOperation } from "../types"
import { createPtyStream } from "../utils/ptyOperation"

const inputSchema = z.object({
	dockerId: z.string().describe("Docker container ID or name"),
})

const outputSchema = z.object({
	cpu: z.number().describe("CPU usage percentage"),
	memory: z.object({
		usage: z.number().describe("Memory usage in bytes"),
		limit: z.number().describe("Memory limit in bytes"),
		percent: z.number().describe("Memory usage percentage"),
	}),
	network: z.object({
		rx: z.number().describe("Network bytes received"),
		tx: z.number().describe("Network bytes transmitted"),
	}),
	blockIO: z.object({
		read: z.number().describe("Block I/O bytes read"),
		write: z.number().describe("Block I/O bytes written"),
	}),
})

type InputSchema = z.infer<typeof inputSchema>
type OutputSchema = z.infer<typeof outputSchema>

// Convert human-readable bytes (e.g., "100MiB", "2GiB") to numeric bytes
function parseBytes(str: string): number {
	const match = str.match(/^([\d.]+)\s*([A-Za-z]+)?$/)
	if (!match) return 0

	const value = parseFloat(match[1])
	const unit = (match[2] || "B").toUpperCase()

	const multipliers: Record<string, number> = {
		B: 1,
		KB: 1000,
		MB: 1000 ** 2,
		GB: 1000 ** 3,
		TB: 1000 ** 4,
		KIB: 1024,
		MIB: 1024 ** 2,
		GIB: 1024 ** 3,
		TIB: 1024 ** 4,
	}

	return value * (multipliers[unit] || 1)
}

// Parse Docker stats JSON format to our typed schema
function parseDockerStats(data: any): OutputSchema {
	// Parse CPU percentage (e.g., "0.50%" -> 0.5)
	const cpu = data.CPUPerc ? parseFloat(data.CPUPerc.replace("%", "")) : 0

	// Parse memory usage (e.g., "100MiB / 2GiB" -> {usage, limit, percent})
	const memParts = data.MemUsage?.split(" / ") || ["0B", "0B"]
	const memUsage = parseBytes(memParts[0] || "0B")
	const memLimit = parseBytes(memParts[1] || "0B")
	const memPercent = data.MemPerc ? parseFloat(data.MemPerc.replace("%", "")) : 0

	// Parse network I/O (e.g., "1.2kB / 500B" -> {rx, tx})
	const netParts = data.NetIO?.split(" / ") || ["0B", "0B"]
	const netRx = parseBytes(netParts[0] || "0B")
	const netTx = parseBytes(netParts[1] || "0B")

	// Parse block I/O (e.g., "1.2MB / 500kB" -> {read, write})
	const blockParts = data.BlockIO?.split(" / ") || ["0B", "0B"]
	const blockRead = parseBytes(blockParts[0] || "0B")
	const blockWrite = parseBytes(blockParts[1] || "0B")

	return {
		cpu,
		memory: {
			usage: memUsage,
			limit: memLimit,
			percent: memPercent,
		},
		network: {
			rx: netRx,
			tx: netTx,
		},
		blockIO: {
			read: blockRead,
			write: blockWrite,
		},
	}
}

export const streamStatsOperation: StreamOperation<InputSchema, OutputSchema> = {
	metadata: {
		name: "container.streamStats" as const,
		description: "Stream real-time statistics from a Docker container",
		inputSchema,
		outputSchema,
		cancellable: true,
	},

	stream: async function* (input: InputSchema, signal?: AbortSignal): AsyncGenerator<OutputSchema> {
		// Create the base PTY stream
		const ptyStream = createPtyStream((inp: InputSchema) => ({
			command: "docker",
			args: ["stats", "--no-stream=false", "--format", "json", inp.dockerId],
		}))

		// Buffer to accumulate chunks until we have complete lines
		let buffer = ""

		// Wrap the PTY stream to strip ANSI codes and parse JSON
		for await (const chunk of ptyStream(input, signal)) {
			// Strip ANSI escape codes and add to buffer
			buffer += stripAnsi(chunk.output)

			// Split on newlines to get complete lines
			const lines = buffer.split("\n")

			// Keep the last incomplete line in buffer for next iteration
			buffer = lines.pop() || ""

			// Process complete lines
			for (const line of lines) {
				const trimmed = line.trim()
				if (!trimmed) continue

				try {
					const data = JSON.parse(trimmed)

					// Parse the Docker stats JSON format into our typed schema
					const stats = parseDockerStats(data)
					yield stats
				} catch (err) {
					// Skip invalid JSON (e.g., malformed data)
					console.error("Failed to parse Docker stats JSON:", err, "Line:", trimmed)
				}
			}
		}

		// Process any remaining buffered data at the end
		if (buffer.trim()) {
			try {
				const data = JSON.parse(buffer.trim())
				const stats = parseDockerStats(data)
				yield stats
			} catch (err) {
				console.error("Failed to parse final Docker stats JSON:", err)
			}
		}
	},
}
