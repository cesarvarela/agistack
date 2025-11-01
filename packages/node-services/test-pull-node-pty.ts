import * as pty from "node-pty"

console.log("Testing docker pull with node-pty...")
console.log("Image: alpine:latest")
console.log("=" .repeat(80))

// Spawn docker pull in a PTY
const ptyProcess = pty.spawn("docker", ["pull", "alpine:latest"], {
	name: "xterm-color",
	cols: 80,
	rows: 30,
	cwd: process.cwd(),
	env: process.env as Record<string, string>,
})

let dataCount = 0

// Listen for data from PTY
ptyProcess.onData((data) => {
	dataCount++
	console.log(`[DATA ${dataCount}]:`, data)
})

// Listen for exit
ptyProcess.onExit(({ exitCode, signal }) => {
	console.log("=" .repeat(80))
	console.log(`Process exited with code: ${exitCode}, signal: ${signal}`)
	console.log(`Total data chunks received: ${dataCount}`)

	if (dataCount === 0) {
		console.log("\n❌ No output received from docker pull")
		console.log("This confirms Docker detects PTY and suppresses output")
	} else {
		console.log("\n✅ Received terminal output!")
	}

	process.exit(exitCode || 0)
})

// Timeout after 15 seconds
setTimeout(() => {
	console.log("\n⏱️  Timeout reached")
	console.log(`Data chunks received: ${dataCount}`)
	ptyProcess.kill()
	process.exit(1)
}, 15000)
