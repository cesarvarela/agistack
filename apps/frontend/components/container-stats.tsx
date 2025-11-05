"use client"

/**
 * Container Stats Component
 * Real-time stats viewer using tRPC WebSocket subscriptions
 */

import type { OperationEvent } from "@agistack/node-services/operations"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStatsHistory } from "@/hooks/use-stats-history"
import { trpc } from "@/lib/trpc"
import { ContainerStatsChart } from "./container-stats-chart"

interface ContainerStatsProps {
	containerId: string
	serverId: string
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

export function ContainerStats({ containerId, serverId }: ContainerStatsProps) {
	const [stats, setStats] = useState<Stats | null>(null)
	const [isConnected, setIsConnected] = useState(false)

	// Subscribe to stats via tRPC
	trpc.proxy.container.streamStats.useSubscription(
		{
			nodeId: serverId,
			dockerId: containerId,
		},
		{
			onData: (data) => {
				const event = data as OperationEvent<Stats>
				if (event.type === "started") {
					setIsConnected(true)
				} else if (event.type === "data") {
					// Data is already parsed by backend - use directly
					setStats(event.data)
				} else if (event.type === "error") {
					console.error("Stats stream error:", event.error)
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

	// Build historical data for charts
	const history = useStatsHistory(stats)

	const formatBytes = (bytes: number): string => {
		if (bytes === 0) return "0 B"
		const k = 1024
		const sizes = ["B", "KB", "MB", "GB", "TB"]
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`
	}

	const formatBytesPerSecond = (bytesPerSec: number): string => {
		return `${formatBytes(bytesPerSec)}/s`
	}

	// Extract timestamps and data for charts
	const timestamps = history.map((point) => point.timestamp)
	const cpuData = history.map((point) => point.cpu)
	const memoryData = history.map((point) => point.memoryPercent)
	const networkRxData = history.map((point) => point.networkRxRate)
	const networkTxData = history.map((point) => point.networkTxRate)
	const blockReadData = history.map((point) => point.blockReadRate)
	const blockWriteData = history.map((point) => point.blockWriteRate)

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Real-Time Stats (5 min)</CardTitle>
						<div
							className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
							title={isConnected ? "Connected" : "Disconnected"}
						/>
					</div>
				</CardHeader>
				<CardContent>
					{!stats || history.length === 0 ? (
						<p className="text-sm text-gray-500">Waiting for stats data...</p>
					) : (
						<div className="space-y-6">
							{/* CPU Usage Chart */}
							<ContainerStatsChart
								title="CPU Usage"
								series={[
									{
										name: "CPU",
										data: cpuData,
										color: "#3b82f6",
									},
								]}
								timestamps={timestamps}
								unit="%"
							/>

							{/* Memory Usage Chart */}
							<ContainerStatsChart
								title="Memory Usage"
								series={[
									{
										name: "Memory",
										data: memoryData,
										color: "#10b981",
									},
								]}
								timestamps={timestamps}
								unit="%"
							/>

							{/* Network I/O Rate Chart */}
							<ContainerStatsChart
								title="Network I/O Rate"
								series={[
									{
										name: "RX",
										data: networkRxData,
										color: "#8b5cf6",
									},
									{
										name: "TX",
										data: networkTxData,
										color: "#ec4899",
									},
								]}
								timestamps={timestamps}
								unit="bytes/s"
							/>

							{/* Block I/O Rate Chart */}
							<ContainerStatsChart
								title="Block I/O Rate"
								series={[
									{
										name: "Read",
										data: blockReadData,
										color: "#f59e0b",
									},
									{
										name: "Write",
										data: blockWriteData,
										color: "#ef4444",
									},
								]}
								timestamps={timestamps}
								unit="bytes/s"
							/>

							{/* Current Values Summary */}
							<div className="pt-4 border-t border-gray-700">
								<p className="text-xs font-medium text-gray-400 mb-3">Current Values</p>
								<div className="grid grid-cols-2 gap-3 text-xs">
									<div className="bg-gray-800/50 p-2 rounded">
										<span className="text-gray-500">CPU:</span>{" "}
										<span className="font-mono text-blue-400">{stats.cpu.toFixed(2)}%</span>
									</div>
									<div className="bg-gray-800/50 p-2 rounded">
										<span className="text-gray-500">Memory:</span>{" "}
										<span className="font-mono text-green-400">
											{formatBytes(stats.memory.usage)} / {formatBytes(stats.memory.limit)}
										</span>
									</div>
									<div className="bg-gray-800/50 p-2 rounded">
										<span className="text-gray-500">Net RX:</span>{" "}
										<span className="font-mono text-purple-400">
											{formatBytesPerSecond(history[history.length - 1]?.networkRxRate ?? 0)}
										</span>
									</div>
									<div className="bg-gray-800/50 p-2 rounded">
										<span className="text-gray-500">Net TX:</span>{" "}
										<span className="font-mono text-pink-400">
											{formatBytesPerSecond(history[history.length - 1]?.networkTxRate ?? 0)}
										</span>
									</div>
									<div className="bg-gray-800/50 p-2 rounded">
										<span className="text-gray-500">Disk Read:</span>{" "}
										<span className="font-mono text-amber-400">
											{formatBytesPerSecond(history[history.length - 1]?.blockReadRate ?? 0)}
										</span>
									</div>
									<div className="bg-gray-800/50 p-2 rounded">
										<span className="text-gray-500">Disk Write:</span>{" "}
										<span className="font-mono text-red-400">
											{formatBytesPerSecond(history[history.length - 1]?.blockWriteRate ?? 0)}
										</span>
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
