import { Pty } from "@replit/ruspty"

console.log("Testing docker pull with ruspty...")

const ptyProcess = new Pty({
	command: "docker",
	args: ["pull", "alpine:latest"],
	envs: process.env as Record<string, string>,
	size: { rows: 30, cols: 80 },
	onExit: (code) => {
		console.log("PTY exited with code:", code)
	},
})

console.log("PTY created for docker pull")

const reader = ptyProcess.read
let dataCount = 0

reader.on("data", (chunk: Buffer) => {
	dataCount++
	console.log(`[${dataCount}] Data (${chunk.length} bytes):`, chunk.toString().substring(0, 100))
})

reader.on("end", () => {
	console.log("Stream ended. Total data chunks:", dataCount)
	process.exit(dataCount > 0 ? 0 : 1)
})

setTimeout(() => {
	console.log("Timeout - received", dataCount, "chunks")
	process.exit(1)
}, 15000)
