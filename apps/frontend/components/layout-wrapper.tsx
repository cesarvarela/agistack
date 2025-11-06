"use client"

import { useState, useEffect } from "react"
import { Allotment } from "allotment"
import "allotment/dist/style.css"
import { PanelRight } from "lucide-react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { EnvironmentProvider } from "@/context/environment-context"
import { AppSidebar } from "@/components/app-sidebar"
import { ChatSidebar } from "./chat-sidebar"

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
	const [isChatOpen, setIsChatOpen] = useState(true)

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
			<SidebarProvider>
				<AppSidebar />
				<SidebarInset>
					{/* App Header */}
					<header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
						<div className="flex items-center justify-between gap-2 px-4 py-3">
							<SidebarTrigger className="-ml-1" />
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={() => setIsChatOpen((prev) => !prev)}
								className="h-7 w-7"
							>
								<PanelRight className="h-4 w-4" />
								<span className="sr-only">Toggle Chat</span>
							</Button>
						</div>
					</header>

					<Allotment>
						<Allotment.Pane>
							<main className="h-full overflow-auto">{children}</main>
						</Allotment.Pane>
						{isChatOpen && (
							<Allotment.Pane preferredSize={400} minSize={300} maxSize={600}>
								<ChatSidebar />
							</Allotment.Pane>
						)}
					</Allotment>
				</SidebarInset>
			</SidebarProvider>
		</EnvironmentProvider>
	)
}
