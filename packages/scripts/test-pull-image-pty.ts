import type { AppRouter } from "@agistack/node-api"
import { createTRPCClient, createWSClient, httpBatchLink, splitLink, wsLink } from "@trpc/client"
import ws from "ws"

async function testImagePullPTY() {
	// Test with an image that will show progress (use one you don't have cached)
	const imageToPull = "alpine:latest"

	console.log(`Testing image pull with PTY for: ${imageToPull}`)
	console.log("=".repeat(60))

	// Create WebSocket client for subscriptions
	const wsClient = createWSClient({
		url: "ws://localhost:4001",
		WebSocket: ws,
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

	console.log("Starting tRPC subscription for image pull...")

	let outputCount = 0
	let subscription: { unsubscribe: () => void } | null = null

	subscription = client.image.pullImagePTY.subscribe(
		{
			image: imageToPull,
		},
		{
			onStarted: () => {
				console.log("✅ Subscription started!")
			},
			onData: (message) => {
				if (message.type === "started") {
					console.log("✅ Stream started! Pulling image with PTY...")
					console.log("=".repeat(80))
				}

				if (message.type === "data") {
					outputCount++
					// Print the raw terminal output (includes ANSI codes)
					// In a real terminal or with xterm.js, this would render as colored progress bars
					process.stdout.write((message.data as { output: string }).output)
				}

				if (message.type === "complete") {
					console.log("\n" + "=".repeat(80))
					console.log(`\n✅ Image pull completed!`)
					console.log(`Total output chunks: ${outputCount}`)
					subscription?.unsubscribe()
					wsClient.close()
					process.exit(0)
				}

				if (message.type === "error") {
					console.error("\n❌ Error:", message.error)
					subscription?.unsubscribe()
					wsClient.close()
					process.exit(1)
				}
			},
			onError: (error) => {
				console.error("❌ Subscription error:", error)
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

	// Test cancellation after 10 seconds (or let it complete)
	// Uncomment to test cancellation:
	// setTimeout(() => {
	// 	console.log("\n🛑 Unsubscribing from stream...")
	// 	subscription?.unsubscribe()
	// 	wsClient.close()
	// 	setTimeout(() => process.exit(0), 500)
	// }, 10000)
}

testImagePullPTY()
