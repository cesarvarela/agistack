/**
 * AI Chat API Route
 * Integrates AI SDK with AgisStack control plane
 * Flow: User → AI → Control Plane Tools → Agent → Docker
 */

import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { streamText, convertToModelMessages, stepCountIs } from "ai"
import { systemPrompt, getRemoteAiTools } from "@agistack/control-plane-api"

// Initialize OpenRouter provider
const openrouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY || "",
})

export async function POST(req: Request) {
	try {
        const baseUrl = process.env.NEXT_PUBLIC_CP_HTTP_URL || "http://localhost:3002/api"
        const { messages } = await req.json()

        const result = streamText({
            model: openrouter("anthropic/claude-3.5-sonnet"),
            system: systemPrompt,
            messages: convertToModelMessages(messages),
            // Allow at most 3 steps so tools can execute and the model can respond
            stopWhen: stepCountIs(3),
            tools: getRemoteAiTools(baseUrl),
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
