"use client"

import type { UIMessage } from "@ai-sdk/react"
import { useEffect, useRef } from "react"
import { MessagePartText } from "./message-part-text"
import { ReasoningPart } from "./message-part-reasoning"
import { ToolCallPart } from "./message-part-tool-call"

interface MessageListProps {
	conversationId: string | null
	messages?: UIMessage[]
}

export function MessageList({ messages = [] }: MessageListProps) {
	const messagesEndRef = useRef<HTMLDivElement>(null)

	// Auto-scroll to bottom when messages change
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
	}, [messages])

	if (messages.length === 0) {
		return (
			<div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 p-4">
				<div className="text-center">
					<p className="text-lg mb-2">No messages yet</p>
					<p className="text-sm">Start a conversation by typing a message below</p>
				</div>
			</div>
		)
	}

	return (
		<div className="flex-1 overflow-y-auto p-4 space-y-4">
			{messages.map((message) => (
				<div
					key={message.id}
					className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
				>
					<div
						className={`max-w-[80%] rounded-lg p-3 ${
							message.role === "user"
								? "bg-blue-600 text-white"
								: "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
						}`}
					>
						{/* Render message parts */}
						{message.parts?.map((part, index) => {
							// Text part
							if (part.type === "text") {
								return (
									<MessagePartText
										key={`${message.id}-text-${index}`}
										text={part.text}
									/>
								)
							}

							// Reasoning part (thinking)
							if (part.type === "reasoning") {
								return (
									<ReasoningPart
										key={`${message.id}-reasoning-${index}`}
										content={part.text}
										streaming={false}
									/>
								)
							}

							// Tool part (combined call and result)
							if (part.type.startsWith("tool-")) {
								// Type narrowing for tool parts
								const toolPart = part as {
									type: string
									toolCallId: string
									toolName?: string
									input?: unknown
									output?: unknown
									errorText?: string
									state?: string
								}

								const toolName = toolPart.toolName || toolPart.type.replace("tool-", "")
								const hasError = Boolean(toolPart.errorText)
								const hasOutput = toolPart.output !== undefined

								return (
									<ToolCallPart
										key={toolPart.toolCallId}
										toolName={toolName}
										state={hasOutput || hasError ? "result" : "call"}
										args={toolPart.input as Record<string, unknown>}
										result={toolPart.output}
										error={toolPart.errorText}
									/>
								)
							}

							// Unknown part type - skip
							return null
						})}
					</div>
				</div>
			))}
			<div ref={messagesEndRef} />
		</div>
	)
}
