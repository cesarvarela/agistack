"use client"

import { useChat } from "@ai-sdk/react"
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai"
import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useEnvironment } from "@/context/environment-context"
import { trpc } from "@/lib/trpc"

interface ChatInputProps {
	conversationId: string | null
	onMessagesUpdate?: (messages: unknown[]) => void
}

export function ChatInput({ conversationId: _conversationId, onMessagesUpdate }: ChatInputProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const abortControllerRef = useRef<AbortController | null>(null)
	const [text, setText] = useState("")
	const [sending, setSending] = useState(false)
	const environment = useEnvironment()
	const pathname = usePathname()
	const trpcUtils = trpc.useContext()

	const { messages, sendMessage, addToolResult } = useChat({
		sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
		onToolCall: async ({ toolCall }) => {
			// Skip dynamic tool calls for proper type narrowing
			if (toolCall.dynamic) return

			try {
				let output: unknown
				// biome-ignore lint/suspicious/noExplicitAny: toolCall.input type is unknown, needs runtime casting
				const input = toolCall.input as Record<string, any>

				switch (toolCall.toolName) {
					// Query tools
					case "listNodes":
						output = await trpcUtils.client.actions.listNodes.query({})
						break

					case "getNodeInfo":
						output = await trpcUtils.client.actions.getNodeInfo.query({
							nodeId: input.nodeId,
						})
						break

					case "listContainers":
						output = await trpcUtils.client.proxy.container.list.query({
							nodeId: input.nodeId,
							status: input.status,
						})
						break

					case "inspectContainer":
						output = await trpcUtils.client.proxy.container.inspect.query({
							nodeId: input.nodeId,
							dockerId: input.dockerId,
						})
						break

					case "getContainerLogs":
						output = await trpcUtils.client.proxy.container.logs.query({
							nodeId: input.nodeId,
							containerId: input.containerId,
							lines: input.lines,
							since: input.since,
						})
						break

					// Mutation tools
					case "addNode":
						output = await trpcUtils.client.actions.addNode.mutate({
							name: input.name,
							url: input.url,
						})
						// Invalidate nodes list
						await trpcUtils.actions.listNodes.invalidate()
						break

					case "deleteNode":
						output = await trpcUtils.client.actions.deleteNode.mutate({
							id: input.id,
						})
						// Invalidate nodes list
						await trpcUtils.actions.listNodes.invalidate()
						break

					case "startContainer":
						output = await trpcUtils.client.proxy.container.start.mutate({
							nodeId: input.nodeId,
							dockerId: input.dockerId,
						})
						// Invalidate container queries
						await trpcUtils.proxy.container.list.invalidate()
						await trpcUtils.proxy.container.inspect.invalidate()
						break

					case "stopContainer":
						output = await trpcUtils.client.proxy.container.stop.mutate({
							nodeId: input.nodeId,
							dockerId: input.dockerId,
							timeout: input.timeout,
						})
						// Invalidate container queries
						await trpcUtils.proxy.container.list.invalidate()
						await trpcUtils.proxy.container.inspect.invalidate()
						break

					case "restartContainer":
						output = await trpcUtils.client.proxy.container.restart.mutate({
							nodeId: input.nodeId,
							dockerId: input.dockerId,
							timeout: input.timeout,
						})
						// Invalidate container queries
						await trpcUtils.proxy.container.list.invalidate()
						await trpcUtils.proxy.container.inspect.invalidate()
						break

					default:
						// Unknown tool - skip
						return
				}

				// Send result back to AI (no await to avoid deadlocks)
				addToolResult({
					tool: toolCall.toolName,
					toolCallId: toolCall.toolCallId,
					output: output,
				})
			} catch (error) {
				// Send error back to AI
				addToolResult({
					tool: toolCall.toolName,
					toolCallId: toolCall.toolCallId,
					state: "output-error",
					errorText: error instanceof Error ? error.message : "Unknown error",
				})
			}
		},
	})

	// Bubble messages up to parent for live display when no conversation selected
	useEffect(() => {
		if (onMessagesUpdate) {
			onMessagesUpdate(messages)
		}
	}, [messages, onMessagesUpdate])

	// Adjust textarea height
	const adjustTextareaHeight = useCallback(() => {
		const textarea = textareaRef.current
		if (textarea) {
			textarea.style.height = "auto"
			textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
		}
	}, [])

	useEffect(() => {
		adjustTextareaHeight()
	}, [adjustTextareaHeight])

	const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault()
			// Submit message
			if (text.trim()) {
				void handleSend()
			}
		}
	}

	const handleSend = async () => {
		const value = text.trim()
		if (!value) return
		setText("")

		// Create new AbortController for this request
		abortControllerRef.current = new AbortController()

		try {
			setSending(true)
			await sendMessage(
				{
					role: "user" as const,
					parts: [
						{
							type: "text",
							text: value,
						},
					],
				} as any,
				{
					body: {
						signal: abortControllerRef.current.signal,
						context: {
							environment: environment.selected,
							pathname: pathname,
						},
					},
				}
			)
		} finally {
			setSending(false)
			abortControllerRef.current = null
		}
	}

	const handleStop = () => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort()
			abortControllerRef.current = null
			setSending(false)
		}
	}

	return (
		<div className="border-t border-gray-200 dark:border-gray-700 p-4">
			<form
				onSubmit={(e) => {
					e.preventDefault()
					void handleSend()
				}}
				className="flex gap-2"
			>
				<Textarea
					ref={textareaRef}
					value={text}
					onChange={(e) => {
						setText(e.target.value)
						adjustTextareaHeight()
					}}
					onKeyDown={onKeyDown}
					placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
					disabled={sending}
					className="flex-1 resize-none min-h-[40px] max-h-[200px]"
					rows={1}
				/>
				{sending ? (
					<Button
						type="button"
						onClick={handleStop}
						variant="destructive"
						className="self-end"
					>
						Stop
					</Button>
				) : (
					<Button type="submit" disabled={!text.trim()} className="self-end">
						Send
					</Button>
				)}
			</form>
			{sending && (
				<div className="text-xs text-gray-500 dark:text-gray-400 mt-2">AI is typing...</div>
			)}
		</div>
	)
}
