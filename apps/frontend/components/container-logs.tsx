"use client"

/**
 * Container Logs Component
 * Real-time log viewer using WebSocket
 */

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWebSocket } from "@/lib/use-websocket"

interface ContainerLogsProps {
	containerId: string
}

export function ContainerLogs({ containerId }: ContainerLogsProps) {
	const [logs, setLogs] = useState<string[]>([])
	const [autoScroll, setAutoScroll] = useState(true)
	const logsEndRef = useRef<HTMLDivElement>(null)
	const { send, on, isConnected } = useWebSocket()
	const [opId, setOpId] = useState<string | null>(null)

	// Subscribe to logs on mount
	useEffect(() => {
		if (!isConnected) return

		// Start operation for logs follow
		send({ type: "start_operation", op: "container.logs", input: { containerId, tail: 100 } })

		const offStarted = on("operation_started", (m) => {
			if (m?.opId) setOpId(m.opId)
		})
		const offEvent = on("operation_event", (m) => {
			if (m?.opId !== opId) return
			if (m?.event?.type === "log" && typeof m.event.line === "string") {
				setLogs((prev) => [...prev, m.event.line])
			}
		})

		return () => {
			offStarted()
			offEvent()
			if (opId) {
				send({ type: "unsubscribe_op", opId })
			}
		}
	}, [containerId, isConnected, send, on, opId])

	// Auto-scroll to bottom when new logs arrive
	useEffect(() => {
		if (autoScroll && logsEndRef.current) {
			logsEndRef.current.scrollIntoView({ behavior: "smooth" })
		}
	}, [logs, autoScroll])

	const handleClear = () => {
		setLogs([])
	}

	const handleCopy = () => {
		navigator.clipboard.writeText(logs.join("\n"))
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
				<div className="bg-black text-green-400 font-mono text-sm p-4 rounded h-[600px] overflow-auto">
					{logs.length === 0 ? (
						<p className="text-gray-500">No logs yet...</p>
					) : (
						<>
							{logs.map((log, idx) => (
								<div key={idx} className="whitespace-pre-wrap break-all">
									{log}
								</div>
							))}
							<div ref={logsEndRef} />
						</>
					)}
				</div>
			</CardContent>
		</Card>
	)
}
