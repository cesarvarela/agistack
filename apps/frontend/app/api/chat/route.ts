/**
 * AI Chat API Route
 * Integrates AI SDK with AgisStack control plane
 * Flow: User → AI → Control Plane Tools → Node → Docker
 */

import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { systemPrompt } from "./system-prompt"
import { getAiTools } from "@/lib/ai-tools"
import { streamText, convertToModelMessages, stepCountIs } from "ai"

// Initialize OpenRouter provider
const openrouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY || "",
})

export async function POST(req: Request) {
	try {
		const { messages } = await req.json()

		// Get AI tools (queries and mutations)
		const { queries, mutations } = getAiTools()

		// Merge all tools for now (YOLO mode toggle can be added later)
		const tools = { ...queries, ...mutations }

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
