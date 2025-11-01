import type { ControlPlaneRouter } from "@agistack/control-plane-api"
import { createTRPCClient, createWSClient, httpBatchLink, splitLink, wsLink } from "@trpc/client"
import ws from "ws"

async function testControlPlane() {
	// Create WebSocket client for subscriptions
	const wsClient = createWSClient({
		url: "ws://localhost:4002",
		WebSocket: ws,
	})

	// Create tRPC client with HTTP and WebSocket support
	const client = createTRPCClient<ControlPlaneRouter>({
		links: [
			splitLink({
				condition: (op) => op.type === "subscription",
				true: wsLink({
					client: wsClient,
				}),
				false: httpBatchLink({
					url: "http://localhost:4002",
				}),
			}),
		],
	})

	console.log("Testing Control Plane tRPC API...\n")

	// 1. Add a node to the registry
	console.log("1. Adding node to registry...")
	const nodeId = "http://localhost:4001"

	try {
		const addNodeResult = await client.actions.addNode.mutate({
			name: "test-node",
			url: "http://localhost:4001",
		})

		console.log("✅ Node added:", addNodeResult.node)
	} catch (error) {
		console.log("Node might already exist, continuing...")
		console.log("Error:", error instanceof Error ? error.message : error)
	}

	// 2. List containers via proxy
	console.log("\n2. Listing containers via Control Plane proxy...")
	try {
		const listResult = await client.proxy.container.list.query({
			nodeId,
			status: "all",
		})

		const containers = listResult.containers

		if (!containers || containers.length === 0) {
			console.log("No containers found. Please start a container first.")
			process.exit(1)
		}

		console.log(`✅ Found ${containers.length} containers`)

		const testContainer = containers[0]
		console.log(
			`Testing with container: ${testContainer.name} (${testContainer.dockerId}) [${testContainer.state}]`,
		)

		// 3. Test WebSocket proxy for streaming logs
		console.log("\n3. Testing Control Plane WebSocket proxy for log streaming...")
		testLogStreamProxy(client, nodeId, testContainer.dockerId)
	} catch (error) {
		console.error("❌ Error listing containers:", error)
		process.exit(1)
	}
}

function testLogStreamProxy(
	client: ReturnType<typeof createTRPCClient<ControlPlaneRouter>>,
	nodeId: string,
	dockerId: string,
) {
	console.log("Starting tRPC subscription to Control Plane proxy...")

	let logCount = 0
	let subscription: { unsubscribe: () => void } | null = null

	subscription = client.proxy.container.streamLogs.subscribe(
		{
			nodeId,
			dockerId,
			tail: 10,
			follow: true,
		},
		{
			onStarted: () => {
				console.log("✅ Subscription started!")
			},
			onData: (message) => {
				console.log(`[${message.type}]`, message)

				if (message.type === "started") {
					console.log("✅ Stream started via Control Plane proxy!")
				}

				if (message.type === "data") {
					logCount++
					console.log("📝 LOG:", message.data.trim())
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

testControlPlane()
