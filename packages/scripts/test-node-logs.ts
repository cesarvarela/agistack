import type { AppRouter } from "@agistack/node-api"
import { createTRPCClient, createWSClient, httpBatchLink, splitLink, wsLink } from "@trpc/client"
import ws from "ws"

async function testLogStreaming() {
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

	// List containers using tRPC query
	const response = await client.container.list.query({})

	const containers = response.containers

	if (!containers || containers.length === 0) {
		console.log("No containers found. Please start a container first.")
		process.exit(1)
	}

	const runningContainer = containers.find((c) => c.state === "running")
	const testContainer = runningContainer || containers[0]

	console.log(
		`Testing with container: ${testContainer.name} (${testContainer.dockerId}) [${testContainer.state}]`,
	)

	// Now stream logs from that container
	startLogStream(client, testContainer.dockerId)
}

function startLogStream(client: ReturnType<typeof createTRPCClient<AppRouter>>, dockerId: string) {
	console.log("Starting tRPC log stream subscription...")

	let logCount = 0
	let subscription: { unsubscribe: () => void } | null = null

	subscription = client.container.streamLogs.subscribe(
		{
			dockerId,
			tail: 100,
			follow: true,
		},
		{
			onStarted: () => {
				console.log("✅ Subscription started!")
			},
			onData: (message) => {
				console.log(`[${message.type}]`, message)

				if (message.type === "started") {
					console.log("✅ Stream started! Watching for logs...")
				}

				if (message.type === "data") {
					logCount++
					console.log("📝 LOG:", message.data)
				}

				if (message.type === "complete") {
					console.log(`\n✅ Stream completed. Received ${logCount} log events.`)
					subscription?.unsubscribe()
					process.exit(0)
				}

				if (message.type === "error") {
					console.error("❌ Error:", message.error)
					subscription?.unsubscribe()
					process.exit(1)
				}
			},
			onError: (error) => {
				console.error("❌ Subscription error:", error)
				process.exit(1)
			},
			onComplete: () => {
				console.log(`\n✅ Subscription completed. Received ${logCount} log events.`)
				process.exit(0)
			},
		},
	)

	// Test cancellation after 3 seconds
	setTimeout(() => {
		console.log("\n🛑 Unsubscribing from stream...")
		subscription?.unsubscribe()
		setTimeout(() => {
			console.log(`\n✅ Test completed. Received ${logCount} log events.`)
			process.exit(0)
		}, 500)
	}, 3000)
}

testLogStreaming()
