"use client"

import { useCallback, useEffect, useRef, useState } from "react"

// import { api } from "@/lib/api-client"

interface MessageWithToolCalls {
	id?: string
	role: string
	content: any
	toolInvocations?: Array<{
		toolCallId: string
		toolName: string
		args: unknown
		result?: unknown
		state: "call" | "result" | "error"
	}>
}

interface MessageListProps {
	conversationId: string | null
	messages?: Message[]
}

export function MessageList({ conversationId, messages: externalMessages }: MessageListProps) {
	const [messages, setMessages] = useState<MessageWithToolCalls[]>([])
	const [loading, setLoading] = useState(false)
	const messagesEndRef = useRef<HTMLDivElement>(null)

	// Use external messages if provided (for new conversations)
	useEffect(() => {
		if (externalMessages) {
			setMessages(externalMessages)
		}
	}, [externalMessages])

	const loadMessages = useCallback(async () => {
		if (!conversationId) return

		try {
			setLoading(true)
			const response = await api.conversations[":id"].$get({
				param: { id: conversationId },
			})
			const data = await response.json()

			if (response.ok && "conversation" in data) {
				// Convert stored messages to UI format; DB stores string content
				const convertedMessages =
					data.conversation.messages?.map((msg: any) => ({
						id: msg.id,
						role: msg.role,
						content: msg.content,
						toolInvocations: msg.toolCalls ? JSON.parse(msg.toolCalls) : undefined,
					})) || []

				setMessages(convertedMessages)
			}
		} catch (error) {
			console.error("Failed to load messages:", error)
		} finally {
			setLoading(false)
		}
	}, [conversationId])

	// Load conversation messages if conversationId is provided
	useEffect(() => {
		if (conversationId) {
			loadMessages()
		} else {
			setMessages([])
		}
	}, [conversationId, loadMessages])

	// Auto-scroll to bottom when messages change
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
	}, [])

	if (loading) {
		return (
			<div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
				Loading messages...
			</div>
		)
	}

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

	function renderContent(content: any): string {
		if (content == null) return ""
		if (typeof content === "string") return content
		// Array of UI parts
		if (Array.isArray(content)) {
			try {
				return content
					.map((p: any) => {
						if (!p || typeof p !== "object") return ""
						if (p.type === "text") return String(p.text ?? "")
						// Some providers may use { text: "..." }
						if ("text" in p) return String((p as any).text ?? "")
						return ""
					})
					.join("")
			} catch {
				return ""
			}
		}
		// Single part object
		if (typeof content === "object") {
			try {
				if ("type" in content && (content as any).type === "text") {
					return String((content as any).text ?? "")
				}
				if ("text" in content) {
					return String((content as any).text ?? "")
				}
				if ("content" in content) {
					return renderContent((content as any).content)
				}
			} catch {}
			try {
				return JSON.stringify(content)
			} catch {
				return ""
			}
		}
		return ""
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
						<div className="text-sm whitespace-pre-wrap break-words">
							{renderContent((message as any).content ?? (message as any).parts)}
						</div>

						{/* Display tool calls if present */}
						{message.toolInvocations && message.toolInvocations.length > 0 && (
							<div className="mt-2 space-y-1">
								{message.toolInvocations.map((tool, index) => (
									<details
										key={tool.toolCallId || index}
										className="text-xs bg-black/10 dark:bg-white/10 rounded p-2"
									>
										<summary className="cursor-pointer font-medium">
											🔧 {tool.toolName}
											{tool.state === "call" && " (calling...)"}
											{tool.state === "error" && " (error)"}
										</summary>
										<div className="mt-2 space-y-1">
											<div>
												<strong>Args:</strong>
												<pre className="text-xs overflow-x-auto">
													{JSON.stringify(tool.args, null, 2)}
												</pre>
											</div>
											{tool.result && (
												<div>
													<strong>Result:</strong>
													<pre className="text-xs overflow-x-auto">
														{JSON.stringify(tool.result, null, 2)}
													</pre>
												</div>
											)}
										</div>
									</details>
								))}
							</div>
						)}
					</div>
				</div>
			))}
			<div ref={messagesEndRef} />
		</div>
	)
}
