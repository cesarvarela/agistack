/**
 * AI Chat API Route
 * Integrates AI SDK with AgisStack control plane
 * Flow: User → AI → Control Plane Tools → Node → Docker
 */

import type { ControlPlaneRouter } from "@agistack/control-plane-api"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { createTRPCClient, httpBatchLink } from "@trpc/client"
import { convertToModelMessages, stepCountIs, streamText } from "ai"
import superjson from "superjson"
import { getAiTools, type ToolExecutor } from "@/lib/ai-tools"
import { systemPrompt } from "./system-prompt"

// Initialize OpenRouter provider
const openrouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY || "",
})

export async function POST(req: Request) {
	try {
		const { messages } = await req.json()

		const controlPlaneUrl = process.env.NEXT_PUBLIC_CP_URL || "http://localhost:4002"

		// Create server-side tRPC client for tool execution
		const client = createTRPCClient<ControlPlaneRouter>({
			links: [
				httpBatchLink({
					url: controlPlaneUrl,
					transformer: superjson,
				}),
			],
		})

		// Create executor that uses the tRPC client
		const executor: ToolExecutor = {
			// Queries
			listNodes: async () => client.actions.listNodes.query({}),
			getNodeInfo: async ({ nodeId }) => client.actions.getNodeInfo.query({ nodeId }),
			listContainers: async (args) => client.proxy.container.list.query(args),
			inspectContainer: async (args) => client.proxy.container.inspect.query(args),
			getContainerLogs: async (args) => client.proxy.container.logs.query(args),

			// Mutations
			addNode: async ({ name, url }) => client.actions.addNode.mutate({ name, url }),
			deleteNode: async ({ id }) => client.actions.deleteNode.mutate({ id }),
			startContainer: async (args) => client.proxy.container.start.mutate(args),
			stopContainer: async (args) => client.proxy.container.stop.mutate(args),
			restartContainer: async (args) => client.proxy.container.restart.mutate(args),
		}

		// Get AI tools with the executor
		const tools = getAiTools(executor)

		const result = streamText({
			model: openrouter("anthropic/claude-3.5-sonnet"),
			system: systemPrompt,
			messages: convertToModelMessages(messages),
			// Allow at most 3 steps so tools can execute and the model can respond
			stopWhen: stepCountIs(3),
			tools,
		})

		// Return UI message stream response for React useChat
		return result.toUIMessageStreamResponse()
	} catch (error) {
		console.error("Chat API error:", error)
		return new Response(
			JSON.stringify({
				error: "Failed to process chat request",
				message: error instanceof Error ? error.message : "Unknown error",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		)
	}
}
