/**
 * AI Chat API Route
 * Integrates AI SDK with AgisStack control plane
 * Flow: User → AI → Control Plane Tools (client-side) → Node → Docker
 */

import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { convertToModelMessages, stepCountIs, streamText } from "ai"
import { getAiTools } from "@/lib/ai-tools"
import { systemPrompt } from "./system-prompt"

// Initialize OpenRouter provider
const openrouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY || "",
})

export async function POST(req: Request) {
	try {
		const { messages } = await req.json()

		// Get AI tools - all execution happens client-side
		const tools = getAiTools()

		const result = streamText({
			model: openrouter("minimax/minimax-m2:free"),
			system: systemPrompt,
			messages: convertToModelMessages(messages),
			// Allow up to 15 steps for multi-step workflows (query → action → verify)
			stopWhen: stepCountIs(15),
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
