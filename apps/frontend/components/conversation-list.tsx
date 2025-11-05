"use client"

import { useState } from "react"

// import { api } from "@/lib/api-client"

interface Conversation {
	id: string
	title: string
	createdAt: number
	updatedAt: number
}

interface ConversationListProps {
	activeConversationId: string | null
	onSelectConversation: (id: string) => void
}

export function ConversationList({
	activeConversationId,
	onSelectConversation,
}: ConversationListProps) {
	const [conversations, _setConversations] = useState<Conversation[]>([])
	const [loading, _setLoading] = useState(true)

	// useEffect(() => {
	// 	loadConversations()
	// }, [])

	// const loadConversations = async () => {
	// 	try {
	// 		setLoading(true)
	// 		const response = await api.api.conversations.$get()
	// 		const data = await response.json()

	// 		if (response.ok && "conversations" in data) {
	// 			setConversations(data.conversations)
	// 		}
	// 	} catch (error) {
	// 		console.error("Failed to load conversations:", error)
	// 	} finally {
	// 		setLoading(false)
	// 	}
	// }

	if (loading) {
		return <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Loading...</div>
	}

	if (conversations.length === 0) {
		return <div className="p-4 text-sm text-gray-500 dark:text-gray-400">No conversations yet</div>
	}

	return (
		<div className="flex flex-col">
			{conversations.map((conversation) => {
				const date = new Date(conversation.updatedAt)
				const isActive = conversation.id === activeConversationId

				return (
					<button
						key={conversation.id}
						type="button"
						onClick={() => onSelectConversation(conversation.id)}
						className={`p-3 text-left border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
							isActive ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500" : ""
						}`}
					>
						<div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
							{conversation.title || "Untitled"}
						</div>
						<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
							{date.toLocaleDateString()}
						</div>
					</button>
				)
			})}
		</div>
	)
}
