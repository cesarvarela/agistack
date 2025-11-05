import type { AppRouter } from "@agistack/node-api"
import { createTRPCClient, createWSClient, httpBatchLink, splitLink, wsLink } from "@trpc/client"
import ws from "ws"

async function testImagePull() {
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

	// Test with a small public image
	const imageToPull = "alpine:latest"

	console.log(`Testing pull of image: ${imageToPull}`)
	console.log("=".repeat(60))

	let progressCount = 0
	const layerProgress = new Map<string, { current: number; total: number }>()
	let subscription: { unsubscribe: () => void } | null = null

	subscription = client.image.pullImage.subscribe(
		{
			image: imageToPull,
		},
		{
			onStarted: () => {
				console.log("✅ Subscription started!")
			},
			onData: (message) => {
				console.log(`[${message.type}]`, message)

				if (message.type === "started") {
					console.log("✅ Stream started! Pulling image...")
				}

				if (message.type === "data") {
					progressCount++
					const { status, id, progress, progressDetail } = message.data as {
						status: string
						id?: string
						progress?: string
						progressDetail?: { current: number; total: number }
					}

					// Track layer progress
					if (id && progressDetail?.current && progressDetail?.total) {
						layerProgress.set(id, {
							current: progressDetail.current,
							total: progressDetail.total,
						})
					}

					// Format progress display
					let progressStr = `${status}`
					if (id) {
						progressStr += ` [${id}]`
					}
					if (progress) {
						progressStr += ` ${progress}`
					}

					console.log(`📦 PROGRESS: ${progressStr}`)
				}

				if (message.type === "complete") {
					console.log(`\n✅ Image pull completed!`)
					console.log(`Total progress events: ${progressCount}`)
					console.log(`Layers tracked: ${layerProgress.size}`)
					subscription?.unsubscribe()
					wsClient.close()
					process.exit(0)
				}

				if (message.type === "error") {
					console.error("❌ Error:", message.error)
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
				console.log(`\n✅ Subscription completed. Received ${progressCount} progress events.`)
				wsClient.close()
				process.exit(0)
			},
		},
	)

	// Test cancellation after 5 seconds
	setTimeout(() => {
		console.log("\n🛑 Unsubscribing from stream...")
		subscription?.unsubscribe()
		wsClient.close()
		setTimeout(() => {
			console.log(`\n✅ Test completed. Received ${progressCount} progress events.`)
			process.exit(0)
		}, 500)
	}, 5000)
}

testImagePull()
