"use client"

/**
 * Container Logs Component
 * Real-time log viewer using tRPC WebSocket subscriptions
 */

import type { OperationEvent } from "@agistack/node-services/operations"
import { FitAddon } from "@xterm/addon-fit"
import { Terminal } from "@xterm/xterm"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { trpc } from "@/lib/trpc"
import "@xterm/xterm/css/xterm.css"

interface ContainerLogsProps {
	containerId: string
	serverId: string
}

export function ContainerLogs({ containerId, serverId }: ContainerLogsProps) {
	const [autoScroll, setAutoScroll] = useState(true)
	const [isConnected, setIsConnected] = useState(false)
	const terminalRef = useRef<HTMLDivElement>(null)
	const xtermRef = useRef<Terminal | null>(null)
	const fitAddonRef = useRef<FitAddon | null>(null)

	// Initialize terminal
	useEffect(() => {
		if (!terminalRef.current || xtermRef.current) return

		// Create terminal instance
		const terminal = new Terminal({
			cursorBlink: false,
			disableStdin: true, // Read-only for logs
			fontSize: 14,
			fontFamily: 'Menlo, Monaco, "Courier New", monospace',
			theme: {
				background: "#000000",
				foreground: "#4ade80", // green-400
			},
			rows: 30,
		})

		// Create and load fit addon
		const fitAddon = new FitAddon()
		terminal.loadAddon(fitAddon)

		// Open terminal in DOM
		terminal.open(terminalRef.current)

		// Fit after terminal is rendered to avoid renderer errors
		setTimeout(() => {
			fitAddon.fit()
		}, 0)

		// Store refs
		xtermRef.current = terminal
		fitAddonRef.current = fitAddon

		// Handle window resize
		const handleResize = () => {
			fitAddon.fit()
		}
		window.addEventListener("resize", handleResize)

		// Cleanup
		return () => {
			window.removeEventListener("resize", handleResize)
			terminal.dispose()
			xtermRef.current = null
			fitAddonRef.current = null
		}
	}, [])

	// Subscribe to logs via tRPC
	trpc.proxy.container.streamLogs.useSubscription(
		{
			nodeId: serverId,
			dockerId: containerId,
			tail: 100,
			follow: true,
		},
		{
			onData: (data) => {
				const event = data as OperationEvent<{ output: string }>
				if (event.type === "started") {
					setIsConnected(true)
				} else if (event.type === "data") {
					// Write log to terminal
					if (xtermRef.current) {
						xtermRef.current.write(event.data.output)
						// Auto-scroll to bottom if enabled
						if (autoScroll) {
							xtermRef.current.scrollToBottom()
						}
					}
				} else if (event.type === "error") {
					console.error("Log stream error:", event.error)
					setIsConnected(false)
				} else if (event.type === "complete") {
					setIsConnected(false)
				}
			},
			onError: (err) => {
				console.error("Subscription error:", err)
				setIsConnected(false)
			},
		},
	)

	const handleClear = () => {
		if (xtermRef.current) {
			xtermRef.current.clear()
		}
	}

	const handleCopy = () => {
		if (xtermRef.current) {
			const selection = xtermRef.current.getSelection()
			if (selection) {
				// Copy selected text
				navigator.clipboard.writeText(selection)
			} else {
				// Copy all buffer content
				const buffer = xtermRef.current.buffer.active
				const lines: string[] = []
				for (let i = 0; i < buffer.length; i++) {
					const line = buffer.getLine(i)
					if (line) {
						lines.push(line.translateToString(true))
					}
				}
				navigator.clipboard.writeText(lines.join("\n"))
			}
		}
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<CardTitle>Container Logs</CardTitle>
						<div
							className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
							title={isConnected ? "Connected" : "Disconnected"}
						/>
					</div>
					<div className="flex gap-2">
						<Button variant="outline" size="sm" onClick={() => setAutoScroll(!autoScroll)}>
							{autoScroll ? "Pause Scroll" : "Resume Scroll"}
						</Button>
						<Button variant="outline" size="sm" onClick={handleCopy}>
							Copy
						</Button>
						<Button variant="outline" size="sm" onClick={handleClear}>
							Clear
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div ref={terminalRef} className="rounded h-[600px] overflow-hidden" />
			</CardContent>
		</Card>
	)
}
