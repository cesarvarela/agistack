"use client"

import type { UIMessage } from "@ai-sdk/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChatInput } from "./chat-input"
import { MessageList } from "./message-list"

export function ChatSidebar() {
	const [liveMessages, setLiveMessages] = useState<UIMessage[]>([])
	const [chatKey, setChatKey] = useState(0)

	return (
		<div className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground border-l">
			{/* Header */}
			<div className="flex flex-col gap-2 p-2 border-b">
				<div className="flex items-center gap-2 w-full">
					<Button
						size="sm"
						variant="outline"
						onClick={() => {
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
				<MessageList conversationId={null} messages={liveMessages} />
			</div>

			{/* Chat input */}
			<div className="flex flex-col gap-2 p-2 border-t">
				<ChatInput key={chatKey} conversationId={null} onMessagesUpdate={setLiveMessages} />
			</div>
		</div>
	)
}
