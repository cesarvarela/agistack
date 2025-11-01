import { Pty } from "@replit/ruspty"

console.log("Testing ruspty with simple command...")

const ptyProcess = new Pty({
	command: "echo",
	args: ["Hello from PTY!"],
	envs: process.env as Record<string, string>,
	size: { rows: 30, cols: 80 },
	onExit: () => {
		console.log("PTY process exited")
	},
})

console.log("PTY created, setting up reader...")

const reader = ptyProcess.read

let dataReceived = false

reader.on("data", (chunk: Buffer) => {
	console.log("Received data:", chunk.toString())
	dataReceived = true
})

reader.on("end", () => {
	console.log("Stream ended")
	setTimeout(() => {
		if (!dataReceived) {
			console.log("❌ No data received!")
		} else {
			console.log("✅ Data received successfully!")
		}
		process.exit(dataReceived ? 0 : 1)
	}, 100)
})

// Give it some time
setTimeout(() => {
	if (!dataReceived) {
		console.log("❌ Timeout - no data received after 2 seconds")
		process.exit(1)
	}
}, 2000)
