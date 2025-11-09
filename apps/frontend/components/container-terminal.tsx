"use client"

/**
 * Container Terminal Component
 * Interactive terminal using tRPC WebSocket subscriptions
 */

import { AttachAddon } from "@xterm/addon-attach"
import { FitAddon } from "@xterm/addon-fit"
import { Terminal } from "@xterm/xterm"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { useRuntimeConfig } from "@/context/environment-context"
import "@xterm/xterm/css/xterm.css"

interface ContainerTerminalProps {
	containerId: string
	serverId: string
}

export function ContainerTerminal({ containerId, serverId }: ContainerTerminalProps) {
	const [shell, setShell] = useState<"bash" | "sh" | "ash" | "zsh">("sh")
	const [isConnected, setIsConnected] = useState(false)
	const config = useRuntimeConfig()
	const terminalRef = useRef<HTMLDivElement>(null)
	const xtermRef = useRef<Terminal | null>(null)
	const fitAddonRef = useRef<FitAddon | null>(null)
	const wsRef = useRef<WebSocket | null>(null)

	// Initialize terminal
	useEffect(() => {
		if (!terminalRef.current || xtermRef.current) return

		// Create terminal instance
		const terminal = new Terminal({
			cursorBlink: true,
			fontSize: 14,
			fontFamily: 'Menlo, Monaco, "Courier New", monospace',
			theme: {
				background: "#000000",
				foreground: "#ffffff",
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

	// Start terminal session
	const handleConnect = () => {
		if (!xtermRef.current) return

		const terminal = xtermRef.current
		terminal.clear()

		// Get Control Plane port and construct WebSocket URL
		const cpPort = config.controlPlanePort
		const cpUrl = `http://localhost:${cpPort}`
		const wsUrl = cpUrl.replace("http://", "ws://").replace("https://", "wss://")

		// Create WebSocket connection with query parameters
		const ws = new WebSocket(
			`${wsUrl}/terminal?nodeId=${serverId}&containerId=${containerId}&shell=/bin/${shell}`,
		)

		wsRef.current = ws

		// Handle connection open
		ws.onopen = () => {
			console.log("[Terminal] WebSocket connected")
			setIsConnected(true)

			// Create AttachAddon and load it AFTER connection is open
			const attachAddon = new AttachAddon(ws)
			terminal.loadAddon(attachAddon)
		}

		// Handle connection close
		ws.onclose = (event) => {
			console.log("[Terminal] WebSocket closed", event.code, event.reason)
			setIsConnected(false)
			terminal.writeln("\r\n\x1b[33mTerminal session ended\x1b[0m")
		}

		// Handle connection error
		ws.onerror = (error) => {
			console.error("[Terminal] WebSocket error:", error)
			setIsConnected(false)
			terminal.writeln("\r\n\x1b[31mError: Connection failed\x1b[0m")
		}

		// Note: No need for ws.onmessage handler - AttachAddon handles all data automatically
	}

	// Stop terminal session
	const handleDisconnect = () => {
		if (wsRef.current) {
			wsRef.current.close()
			wsRef.current = null
		}
		setIsConnected(false)
	}

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (wsRef.current) {
				wsRef.current.close()
			}
		}
	}, [])

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<CardTitle>Terminal</CardTitle>
						<div
							className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
							title={isConnected ? "Connected" : "Disconnected"}
						/>
					</div>
					<div className="flex gap-2 items-center">
						<Select
							value={shell}
							onChange={(e) => setShell(e.target.value as typeof shell)}
							disabled={isConnected}
							className="w-32"
						>
							<option value="sh">sh</option>
							<option value="bash">bash</option>
							<option value="ash">ash</option>
							<option value="zsh">zsh</option>
						</Select>
						{!isConnected ? (
							<Button onClick={handleConnect}>Connect</Button>
						) : (
							<Button variant="destructive" onClick={handleDisconnect}>
								Disconnect
							</Button>
						)}
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div
					ref={terminalRef}
					className="rounded h-[600px] overflow-hidden [&_.xterm-screen]:p-3"
				/>
			</CardContent>
		</Card>
	)
}
