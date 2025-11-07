/**
 * AI Chat API Route
 * Integrates AI SDK with AgisStack control plane
 * Flow: User → AI → Control Plane Tools (client-side) → Node → Docker
 */

import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { convertToModelMessages, stepCountIs, streamText } from "ai"
import { getAiTools } from "@/lib/ai-tools"
import env from "../../../env-server"
import { systemPrompt } from "./system-prompt"

interface ChatContext {
	environment: string | null
	pathname: string
}

function buildSystemPrompt(context?: ChatContext): string {
	if (!context) return systemPrompt

	const contextInfo: string[] = []

	if (context.environment) {
		contextInfo.push(`- Current environment: ${context.environment}`)
	}

	if (context.pathname) {
		contextInfo.push(`- Current page: ${context.pathname}`)
	}

	if (contextInfo.length === 0) return systemPrompt

	return `${systemPrompt}

## Current Session Context

${contextInfo.join("\n")}

Use this context to provide more relevant responses. Default to the current environment for operations unless the user specifies otherwise.`
}

// Initialize OpenRouter provider
const openrouter = createOpenRouter({
	apiKey: env.OPENROUTER_API_KEY,
})

export async function POST(req: Request) {
	try {
		const { messages, context } = await req.json()

		// Get AI tools - all execution happens client-side
		const tools = getAiTools()

		// Build contextual system prompt with environment and page info
		const contextualPrompt = buildSystemPrompt(context)

		const result = streamText({
			model: openrouter(env.OPENROUTER_MODEL),
			system: contextualPrompt,
			messages: convertToModelMessages(messages),
			// Allow up to 15 steps for multi-step workflows (query → action → verify)
			stopWhen: stepCountIs(15),
			tools,
			// Pass abort signal to enable cancellation
			abortSignal: req.signal,
		})

		// Return UI message stream response for React useChat
		// Enable reasoning to separate thinking from final response
		return result.toUIMessageStreamResponse({
			sendReasoning: true,
		})
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
