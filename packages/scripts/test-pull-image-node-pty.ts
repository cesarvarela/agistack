import type { AppRouter } from "@agistack/node-api"
import { createTRPCClient, createWSClient, httpBatchLink, splitLink, wsLink } from "@trpc/client"
import ws from "ws"

async function testPullImagePTY() {
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

	// Image to pull (use a small image for testing)
	const imageName = process.argv[2] || "alpine:latest"

	console.log(`🐳 Testing image pull with PTY for: ${imageName}`)
	console.log("=" .repeat(60))

	let outputCount = 0
	let subscription: { unsubscribe: () => void } | null = null

	subscription = client.image.pullImageNodePty.subscribe(
		{
			image: imageName,
		},
		{
			onStarted: () => {
				console.log("✅ Subscription started!")
			},
			onData: (message) => {
				if (message.type === "started") {
					console.log("✅ Stream started! Pulling image...")
					console.log("=" .repeat(60))
				}

				if (message.type === "data") {
					outputCount++
					// Display the raw output with ANSI colors preserved
					process.stdout.write(message.data.output)
				}

				if (message.type === "complete") {
					console.log("\n" + "=".repeat(60))
					console.log(`✅ Image pull completed! Received ${outputCount} output chunks.`)
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
		console.log("\n\n🛑 Cancelling image pull...")
		subscription?.unsubscribe()
		wsClient.close()
		setTimeout(() => {
			console.log(`\n✅ Cancelled. Received ${outputCount} output chunks before cancellation.`)
			process.exit(0)
		}, 500)
	})
}

testPullImagePTY()
