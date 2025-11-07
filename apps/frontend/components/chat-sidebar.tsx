"use client"

import type { UIMessage } from "@ai-sdk/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { ChatInput } from "./chat-input"
import { MessageList } from "./message-list"

// import { api } from "@/lib/api-client"

export function ChatSidebar() {
	const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
	const [liveMessages, setLiveMessages] = useState<UIMessage[]>([])
	const [conversations, _setConversations] = useState<Array<{ id: string; title: string }>>([])
	const [chatKey, setChatKey] = useState(0)

	return (
		<div className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground border-l">
			{/* Header */}
			<div className="flex flex-col gap-2 p-2 border-b">
				<div className="flex items-center gap-2 w-full">
					<Select
						value={activeConversationId ?? "__new__"}
						onChange={(e) => {
							const v = e.target.value
							setActiveConversationId(v === "__new__" ? null : v)
						}}
						className="flex-1"
					>
						<option value="__new__">New conversation</option>
						{conversations.map((c) => (
							<option key={c.id} value={c.id}>
								{c.title}
							</option>
						))}
					</Select>
					<Button
						size="sm"
						variant="outline"
						onClick={() => {
							setActiveConversationId(null)
							setLiveMessages([])
							setChatKey((prev) => prev + 1)
						}}
					>
						New
					</Button>
				</div>
			</div>

			{/* Chat messages */}
			<div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
				{activeConversationId ? (
					<MessageList conversationId={activeConversationId} />
				) : (
					<MessageList conversationId={null} messages={liveMessages} />
				)}
			</div>

			{/* Chat input */}
			<div className="flex flex-col gap-2 p-2 border-t">
				{activeConversationId ? (
					<ChatInput key={chatKey} conversationId={activeConversationId} />
				) : (
					<ChatInput key={chatKey} conversationId={null} onMessagesUpdate={setLiveMessages} />
				)}
			</div>
		</div>
	)
}
