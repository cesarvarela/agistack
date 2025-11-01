import { Pty } from "@replit/ruspty"

console.log("Inspecting ruspty API...")

const ptyProcess = new Pty({
	command: "echo",
	args: ["test"],
	envs: process.env as Record<string, string>,
	size: { rows: 30, cols: 80 },
	onExit: () => {},
})

console.log("PTY object keys:", Object.keys(ptyProcess))
console.log("PTY object:", ptyProcess)
console.log("\nRead stream keys:", Object.keys(ptyProcess.read))

// Check if there's a different way to read
if (typeof ptyProcess.read.read === "function") {
	console.log("Has read.read() method")
}

setTimeout(() => process.exit(0), 1000)
