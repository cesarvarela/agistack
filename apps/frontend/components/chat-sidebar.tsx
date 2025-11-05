"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { MessageList } from "./message-list"
import { ChatInput } from "./chat-input"
// import { api } from "@/lib/api-client"

interface ChatSidebarProps {
	isOpen: boolean
	onClose: () => void
	variant?: "overlay" | "inline"
}

export function ChatSidebar({ isOpen, onClose, variant = "overlay" }: ChatSidebarProps) {
	const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
	const [panelWidth, setPanelWidth] = useState(400)
	const [liveMessages, setLiveMessages] = useState<any[]>([])
	const [conversations, _setConversations] = useState<Array<{ id: string; title: string }>>([])

	// Load panel width from localStorage
	useEffect(() => {
		const savedWidth = localStorage.getItem("chatSidebarWidth")
		if (savedWidth) {
			setPanelWidth(Number.parseInt(savedWidth, 10))
		}
	}, [])

	// Save panel width to localStorage
	const handleWidthChange = (width: number) => {
		setPanelWidth(width)
		localStorage.setItem("chatSidebarWidth", width.toString())
	}

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

	if (!isOpen) return null

	const containerBase =
		"bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex"
	const containerClass =
		variant === "overlay"
			? `fixed right-0 top-0 h-full shadow-lg z-50 ${containerBase}`
			: `h-[calc(100dvh-3.5rem)] sticky top-[3.5rem] ${containerBase}` // inline under ~56px header

	return (
		<div
			className={containerClass}
			style={{ width: `${panelWidth}px`, minWidth: "300px", maxWidth: "600px" }}
		>
			{/* Resize handle */}
			<div
				role="separator"
				aria-orientation="vertical"
				aria-label="Resize sidebar"
				aria-valuenow={panelWidth}
				aria-valuemin={300}
				aria-valuemax={600}
				tabIndex={0}
				className="w-1 bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 cursor-col-resize"
				onMouseDown={(e) => {
					e.preventDefault()
					const startX = e.clientX
					const startWidth = panelWidth

					const handleMouseMove = (e: MouseEvent) => {
						const delta = startX - e.clientX
						const newWidth = Math.min(Math.max(startWidth + delta, 300), 600)
						handleWidthChange(newWidth)
					}

					const handleMouseUp = () => {
						document.removeEventListener("mousemove", handleMouseMove)
						document.removeEventListener("mouseup", handleMouseUp)
					}

					document.addEventListener("mousemove", handleMouseMove)
					document.addEventListener("mouseup", handleMouseUp)
				}}
			/>

			{/* Sidebar content */}
			<div className="flex-1 flex flex-col overflow-hidden">
				{/* Header: compact, with conversation select */}
				<div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
					<Select
						value={activeConversationId ?? "__new__"}
						onChange={(e) => {
							const v = e.target.value
							setActiveConversationId(v === "__new__" ? null : v)
						}}
					>
						<option value="__new__">New conversation</option>
						{conversations.map((c) => (
							<option key={c.id} value={c.id}>
								{c.title}
							</option>
						))}
					</Select>
					<div className="ml-auto">
						<Button size="sm" variant="outline" onClick={() => setActiveConversationId(null)}>
							New
						</Button>
					</div>
				</div>

				{/* Chat area */}
				<div className="flex-1 flex flex-col">
					{activeConversationId ? (
						<>
							<MessageList conversationId={activeConversationId} />
							<ChatInput conversationId={activeConversationId} />
						</>
					) : (
						<>
							<MessageList conversationId={null} messages={liveMessages} />
							<ChatInput conversationId={null} onMessagesUpdate={setLiveMessages} />
						</>
					)}
				</div>
			</div>
		</div>
	)
}
