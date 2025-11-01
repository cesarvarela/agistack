import { Pty } from "@replit/ruspty"

console.log("Testing ruspty...")

try {
	const ptyProcess = new Pty({
		command: "echo",
		args: ["Hello from PTY!"],
		envs: process.env as Record<string, string>,
		size: { rows: 30, cols: 80 },
		onExit: () => {
			console.log("PTY exited")
		},
	})

	console.log("PTY created successfully")
	console.log("PTY type:", typeof ptyProcess)
	console.log("Read stream type:", typeof ptyProcess.read)

	const reader = ptyProcess.read

	reader.on("data", (chunk: Buffer) => {
		console.log("Data received:", chunk.toString())
	})

	reader.on("end", () => {
		console.log("Stream ended")
		process.exit(0)
	})

	setTimeout(() => {
		console.log("Timeout reached")
		process.exit(1)
	}, 2000)
} catch (error) {
	console.error("Error:", error)
	process.exit(1)
}
