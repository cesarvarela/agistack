"use client"

/**
 * Container Stats Component
 * Real-time stats viewer using WebSocket
 */

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWebSocket } from "@/lib/use-websocket"

interface ContainerStatsProps {
	containerId: string
}

interface Stats {
  cpu: number
  memory: {
    usage: number
    limit: number
    percent: number
  }
  network: {
    rx: number
    tx: number
  }
  blockIO: {
    read: number
    write: number
  }
}

export function ContainerStats({ containerId }: ContainerStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [opId, setOpId] = useState<string | null>(null)
  const { send, on, isConnected } = useWebSocket()

  useEffect(() => {
    if (!isConnected) return

    // Start WS operation for stats
    send({ type: "start_operation", op: "container.stats", input: { containerId } })

    const offStarted = on("operation_started", (m) => {
      if (m?.op === "container.stats" && m?.opId) setOpId(m.opId)
    })
    const offEvent = on("operation_event", (m) => {
      if (!opId || m?.opId !== opId) return
      if (m?.event?.type === "stats" && m.event.data) {
        const d = m.event.data as any
        const s: Stats = {
          cpu: Number(d?.stats?.cpu?.usage || 0),
          memory: {
            usage: Number(d?.stats?.memory?.usage || 0),
            limit: Number(d?.stats?.memory?.limit || 0),
            percent: Number(d?.stats?.memory?.percentage || 0),
          },
          network: {
            rx: Number(d?.stats?.network?.rxBytes || 0),
            tx: Number(d?.stats?.network?.txBytes || 0),
          },
          blockIO: {
            read: Number(d?.stats?.blockIO?.readBytes || 0),
            write: Number(d?.stats?.blockIO?.writeBytes || 0),
          },
        }
        setStats(s)
      }
    })

    return () => {
      offStarted()
      offEvent()
      if (opId) send({ type: "unsubscribe_op", opId })
    }
  }, [containerId, isConnected, send, on, opId])

	const formatBytes = (bytes: number): string => {
		if (bytes === 0) return "0 B"
		const k = 1024
		const sizes = ["B", "KB", "MB", "GB", "TB"]
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
	}

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Real-Time Stats</CardTitle>
						<div
							className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
							title={isConnected ? "Connected" : "Disconnected"}
						/>
					</div>
				</CardHeader>
				<CardContent>
					{!stats ? (
						<p className="text-sm text-gray-500">Waiting for stats data...</p>
					) : (
						<div className="space-y-6">
							{/* CPU Usage */}
							<div>
								<div className="flex items-center justify-between mb-2">
									<p className="text-sm font-medium">CPU Usage</p>
									<p className="text-sm text-gray-500">{stats.cpu.toFixed(2)}%</p>
								</div>
								<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
									<div
										className="bg-blue-600 h-2 rounded-full transition-all duration-300"
										style={{ width: `${Math.min(stats.cpu, 100)}%` }}
									/>
								</div>
							</div>

							{/* Memory Usage */}
							<div>
								<div className="flex items-center justify-between mb-2">
									<p className="text-sm font-medium">Memory Usage</p>
									<p className="text-sm text-gray-500">
										{formatBytes(stats.memory.usage)} / {formatBytes(stats.memory.limit)} (
										{stats.memory.percent.toFixed(2)}%)
									</p>
								</div>
								<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
									<div
										className="bg-green-600 h-2 rounded-full transition-all duration-300"
										style={{ width: `${Math.min(stats.memory.percent, 100)}%` }}
									/>
								</div>
							</div>

							{/* Network I/O */}
							<div>
								<p className="text-sm font-medium mb-2">Network I/O</p>
								<div className="grid grid-cols-2 gap-4">
									<div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
										<p className="text-xs text-gray-500 mb-1">RX (Received)</p>
										<p className="text-sm font-mono">{formatBytes(stats.network.rx)}</p>
									</div>
									<div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
										<p className="text-xs text-gray-500 mb-1">TX (Transmitted)</p>
										<p className="text-sm font-mono">{formatBytes(stats.network.tx)}</p>
									</div>
								</div>
							</div>

							{/* Block I/O */}
							<div>
								<p className="text-sm font-medium mb-2">Block I/O</p>
								<div className="grid grid-cols-2 gap-4">
									<div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
										<p className="text-xs text-gray-500 mb-1">Read</p>
										<p className="text-sm font-mono">{formatBytes(stats.blockIO.read)}</p>
									</div>
									<div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
										<p className="text-xs text-gray-500 mb-1">Write</p>
										<p className="text-sm font-mono">{formatBytes(stats.blockIO.write)}</p>
									</div>
								</div>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
