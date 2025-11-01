import type { AppRouter } from "@agistack/node-api"
import { createTRPCClient, createWSClient, httpBatchLink, splitLink, wsLink } from "@trpc/client"
import ws from "ws"

async function testContainerLogsNodePty() {
	// Get container ID from command line or use default
	const containerId = process.argv[2]

	if (!containerId) {
		console.error("❌ Error: Container ID required")
		console.log("Usage: tsx packages/scripts/test-container-logs-node-pty.ts <container-id>")
		console.log("Example: tsx packages/scripts/test-container-logs-node-pty.ts my-container")
		process.exit(1)
	}

	// Create WebSocket client for subscriptions
	const wsClient = createWSClient({
		url: "ws://localhost:4001",
		WebSocket: ws,
		onOpen: () => {
			console.log("🔌 WebSocket connection opened!")
		},
		onClose: (cause) => {
			console.log("🔌 WebSocket connection closed:", cause)
		},
		onError: (error) => {
			console.error("🔌 WebSocket error:", error)
		},
	})

	// Create tRPC client with HTTP and WebSocket support
	const client = createTRPCClient<AppRouter>({
		links: [
			splitLink({
				condition: (op) => op.type === "subscription",
				true: wsLink({
					client: wsClient,
				}),
				false: httpBatchLink({
					url: "http://localhost:4001",
				}),
			}),
		],
	})

	console.log(`📋 Testing container logs streaming with PTY for: ${containerId}`)
	console.log("=".repeat(60))

	let outputCount = 0
	let subscription: { unsubscribe: () => void } | null = null

	subscription = client.container.streamLogsNodePty.subscribe(
		{
			dockerId: containerId,
			tail: 50,
			follow: true,
		},
		{
			onStarted: () => {
				console.log("✅ Subscription started!")
			},
			onData: (message) => {
				if (message.type === "started") {
					console.log("✅ Stream started! Streaming logs...")
					console.log("=".repeat(60))
				}

				if (message.type === "data") {
					outputCount++
					// Display the raw output with ANSI colors preserved
					process.stdout.write(message.data.output)
				}

				if (message.type === "complete") {
					console.log("\n" + "=".repeat(60))
					console.log(`✅ Log stream completed! Received ${outputCount} output chunks.`)
					subscription?.unsubscribe()
					wsClient.close()
					process.exit(0)
				}

				if (message.type === "error") {
					console.log("\n" + "=".repeat(60))
					console.error("❌ Error:", message.error)
					subscription?.unsubscribe()
					wsClient.close()
					process.exit(1)
				}
			},
			onError: (error) => {
				console.error("\n❌ Subscription error:", error)
				wsClient.close()
				process.exit(1)
			},
			onComplete: () => {
				console.log(`\n✅ Subscription completed. Received ${outputCount} output chunks.`)
				wsClient.close()
				process.exit(0)
			},
		},
	)

	// Handle Ctrl+C gracefully
	process.on("SIGINT", () => {
		console.log("\n\n🛑 Cancelling log stream...")
		subscription?.unsubscribe()
		wsClient.close()
		setTimeout(() => {
			console.log(`\n✅ Cancelled. Received ${outputCount} output chunks before cancellation.`)
			process.exit(0)
		}, 500)
	})
}

testContainerLogsNodePty()
