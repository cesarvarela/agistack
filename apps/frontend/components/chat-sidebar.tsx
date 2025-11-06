"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { ChatInput } from "./chat-input"
import { MessageList } from "./message-list"

// import { api } from "@/lib/api-client"

export function ChatSidebar() {
	const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
	const [liveMessages, setLiveMessages] = useState<any[]>([])
	const [conversations, _setConversations] = useState<Array<{ id: string; title: string }>>([])

	// // Load conversations list if backend supports it
	// useEffect(() => {
	//   let canceled = false
	//   async function load() {
	//     try {
	//       // This path may not exist yet; ignore errors gracefully
	//       const res = await api.conversations.$get().catch(() => null as any)
	//       if (res && res.ok) {
	//         const data = await res.json()
	//         const list = (data?.conversations || []).map((c: any) => ({ id: c.id, title: c.title || "Untitled" }))
	//         if (!canceled) setConversations(list)
	//       }
	//     } catch {}
	//   }
	//   load()
	//   return () => {
	//     canceled = true
	//   }
	// }, [])

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
					<Button size="sm" variant="outline" onClick={() => setActiveConversationId(null)}>
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
					<ChatInput conversationId={activeConversationId} />
				) : (
					<ChatInput conversationId={null} onMessagesUpdate={setLiveMessages} />
				)}
			</div>
		</div>
	)
}
