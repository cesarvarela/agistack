"use client"

import { useEffect, useState } from "react"
import { AddServerButton } from "@/components/add-server-button"
import { EnvironmentSelector } from "@/components/environment-selector"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { EnvironmentProvider } from "@/context/environment-context"
import { ChatSidebar } from "./chat-sidebar"

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
	const [isChatOpen, setIsChatOpen] = useState(false)

	// Keyboard shortcut: Cmd/Ctrl + Shift + C
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "c" || e.key === "C")) {
				e.preventDefault()
				setIsChatOpen((prev) => !prev)
			}
		}

		window.addEventListener("keydown", handleKeyDown)
		return () => window.removeEventListener("keydown", handleKeyDown)
	}, [])

	return (
		<EnvironmentProvider>
			{/* App Header with Environment selector */}
			<header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
					<EnvironmentSelector />
					<div className="flex gap-2">
						<AddServerButton />
						<SidebarTrigger onClick={() => setIsChatOpen((prev) => !prev)} className="-ml-1" />
					</div>
				</div>
			</header>

			<div className="flex">
				<main className="flex-1 min-w-0">{children}</main>
				<ChatSidebar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} variant="inline" />
			</div>

			{/* Floating chat button */}
			{false && (
				<button
					type="button"
					onClick={() => setIsChatOpen(true)}
					className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center z-40 transition-all hover:scale-110"
					aria-label="Open AI Chat"
					title="Open AI Chat (Cmd/Ctrl+Shift+C)"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={2}
						stroke="currentColor"
						className="w-6 h-6"
					>
						<title>Chat</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
						/>
					</svg>
				</button>
			)}
		</EnvironmentProvider>
	)
}
