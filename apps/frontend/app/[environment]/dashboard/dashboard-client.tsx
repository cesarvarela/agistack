"use client"

import { Activity, Box, Container, Server } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ServerStatsChart } from "@/components/server-stats-chart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { trpc } from "@/lib/trpc"

interface DashboardClientProps {
	environment: string
}

interface ServerStatsPoint {
	timestamp: number
	cpu: number
	memory: { used: number; total: number; percent: number }
	disk: { used: number; total: number; percent: number }
	network: { rxRate: number; txRate: number }
}

const formatBytes = (bytes: number) => {
	if (bytes === 0) return "0 B"
	const k = 1024
	const sizes = ["B", "KB", "MB", "GB", "TB"]
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	return `${(bytes / k ** i).toFixed(1)} ${sizes[i]}`
}

const TIME_WINDOWS = {
	"1m": { value: 60000, label: "1m", maxPoints: 60 },
	"5m": { value: 300000, label: "5m", maxPoints: 300 },
	"30m": { value: 1800000, label: "30m", maxPoints: 1800 },
	all: { value: "all" as const, label: "All", maxPoints: 1440 }, // 24 hours
}

type TimeWindowKey = keyof typeof TIME_WINDOWS

export function DashboardClient({ environment }: DashboardClientProps) {
	const [timeWindow, setTimeWindow] = useState<TimeWindowKey>("1m")

	const { data: nodeInfo, isLoading: nodeLoading } = trpc.actions.getNodeInfo.useQuery({
		nodeId: environment,
	})

	const { data: containers, isLoading: containersLoading } = trpc.proxy.container.list.useQuery({
		nodeId: environment,
		status: "all",
	})

	// Load historical data first
	const { data: historicalStats, isLoading: isHistoricalLoading } =
		trpc.proxy.server.stats.useQuery({
			nodeId: environment,
		})

	// Use streaming for real-time updates
	const [serverStatsHistory, setServerStatsHistory] = useState<ServerStatsPoint[]>([])
	const [isInitialized, setIsInitialized] = useState(false)

	// Filter data based on selected time window
	const getFilteredData = (data: ServerStatsPoint[]) => {
		const now = Date.now()
		const windowValue = TIME_WINDOWS[timeWindow].value

		if (windowValue === "all") {
			// Show all data for "all" window
			return data
		}

		// Filter by time window
		const cutoffTime = now - windowValue
		return data.filter((point) => point.timestamp >= cutoffTime)
	}

	// Initialize with historical data when it loads (only once)
	useEffect(() => {
		if (!isInitialized && historicalStats && historicalStats.length > 0) {
			setServerStatsHistory(historicalStats)
			setIsInitialized(true)
		}
	}, [historicalStats, isInitialized])

	// Stream real-time updates on top of historical data
	trpc.proxy.server.streamStats.useSubscription(
		{ nodeId: environment },
		{
			onData: (event) => {
				// Extract the actual data from the event wrapper
				const stat = (event as { data?: ServerStatsPoint })?.data || event

				// Validate the stat has the expected structure
				if (!stat || typeof stat !== "object") return
				const s = stat as Partial<ServerStatsPoint>
				if (!s.memory || !s.disk || !s.network || typeof s.timestamp !== "number") return

				setServerStatsHistory((prev) => {
					const updated = [...prev, stat as ServerStatsPoint]
					// Keep a reasonable history (24 hours max at 1 point per second = 86400 points)
					// This allows switching between time windows without losing data
					const maxHistoryPoints = 86400
					return updated.slice(-maxHistoryPoints)
				})
			},
			onError: (err) => {
				console.error("Server stats stream error:", err)
			},
		},
	)

	const containerStats = containers
		? {
				total: containers.containers.length,
				running: containers.containers.filter((c) => c.state === "running").length,
				stopped: containers.containers.filter((c) => ["exited", "stopped"].includes(c.state))
					.length,
				paused: containers.containers.filter((c) => c.state === "paused").length,
				restarting: containers.containers.filter((c) => c.state === "restarting").length,
			}
		: null

	return (
		<div className="container mx-auto p-6">
			<div className="mb-6">
				<h1 className="text-3xl font-bold">Dashboard</h1>
			</div>

			<div className="flex flex-col gap-4 max-w-4xl">
				{/* Server Overview Card */}
				<Card className="p-4">
					<h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
						<Server className="h-5 w-5" />
						Server Overview
					</h3>

					{nodeLoading ? (
						<Skeleton className="h-6 w-full" />
					) : (
						<div className="flex items-center gap-6 text-sm">
							<div className="flex items-center gap-2">
								<span className="font-medium text-gray-600 dark:text-gray-400">ID:</span>
								<span className="font-mono">{nodeInfo?.node.id || environment}</span>
							</div>
							<div className="flex items-center gap-2">
								<span className="font-medium text-gray-600 dark:text-gray-400">Name:</span>
								<span>{nodeInfo?.node.name || "N/A"}</span>
							</div>
							<div className="flex items-center gap-2">
								<span className="font-medium text-gray-600 dark:text-gray-400">URL:</span>
								<span className="font-mono text-blue-600 dark:text-blue-400">
									{nodeInfo?.node.url || "N/A"}
								</span>
							</div>
						</div>
					)}
				</Card>

				{/* Server Stats Card */}
				<Card className="p-6">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-semibold flex items-center gap-2">
							<Activity className="h-5 w-5" />
							Server Metrics
						</h3>
						<div className="flex gap-1">
							{(Object.keys(TIME_WINDOWS) as TimeWindowKey[]).map((key) => (
								<Button
									key={key}
									variant={timeWindow === key ? "default" : "outline"}
									size="sm"
									onClick={() => setTimeWindow(key)}
									className="h-7 px-2 text-xs"
								>
									{TIME_WINDOWS[key].label}
								</Button>
							))}
						</div>
					</div>

					{isHistoricalLoading ? (
						<div className="space-y-3">
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
						</div>
					) : serverStatsHistory.length > 0 ? (
						<div className="space-y-6">
							<ServerStatsChart
								title="CPU Usage"
								data={getFilteredData(serverStatsHistory).map((s) => ({
									timestamp: s.timestamp,
									cpu: s.cpu ?? 0,
								}))}
								dataKeys={[{ key: "cpu", label: "CPU", color: "hsl(24, 95%, 53%)" }]}
								unit="%"
								height={200}
								formatValue={(value) => `${value.toFixed(1)}%`}
								windowSize={TIME_WINDOWS[timeWindow].value}
							/>

							<ServerStatsChart
								title="Memory Usage"
								data={getFilteredData(serverStatsHistory).map((s) => ({
									timestamp: s.timestamp,
									memory: s.memory?.percent ?? 0,
								}))}
								dataKeys={[{ key: "memory", label: "Memory", color: "hsl(217, 91%, 60%)" }]}
								unit="%"
								height={200}
								formatValue={(value) => `${value.toFixed(1)}%`}
								windowSize={TIME_WINDOWS[timeWindow].value}
							/>

							<ServerStatsChart
								title="Disk Usage"
								data={getFilteredData(serverStatsHistory).map((s) => ({
									timestamp: s.timestamp,
									disk: s.disk?.percent ?? 0,
								}))}
								dataKeys={[{ key: "disk", label: "Disk", color: "hsl(271, 91%, 65%)" }]}
								unit="%"
								height={200}
								formatValue={(value) => `${value.toFixed(1)}%`}
								windowSize={TIME_WINDOWS[timeWindow].value}
							/>

							<ServerStatsChart
								title="Network Activity"
								data={getFilteredData(serverStatsHistory).map((s) => ({
									timestamp: s.timestamp,
									rx: s.network?.rxRate ?? 0,
									tx: s.network?.txRate ?? 0,
								}))}
								dataKeys={[
									{ key: "rx", label: "Download (RX)", color: "hsl(142, 76%, 36%)" },
									{ key: "tx", label: "Upload (TX)", color: "hsl(217, 91%, 60%)" },
								]}
								unit="bytes/s"
								height={200}
								formatValue={formatBytes}
								windowSize={TIME_WINDOWS[timeWindow].value}
							/>
						</div>
					) : (
						<div className="text-sm text-muted-foreground">
							No stats available yet. Stats are collected every minute.
						</div>
					)}
				</Card>

				{/* Container Statistics Card */}
				<Card className="p-6">
					<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
						<Container className="h-5 w-5" />
						Container Statistics
					</h3>

					{containersLoading ? (
						<div className="space-y-3">
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
						</div>
					) : (
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Box className="h-4 w-4 text-gray-600 dark:text-gray-400" />
									<span className="text-sm font-medium">Total</span>
								</div>
								<Badge variant="outline" className="text-lg font-semibold">
									{containerStats?.total || 0}
								</Badge>
							</div>

							<div className="flex items-center justify-between">
								<span className="text-sm">Running</span>
								<Badge className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600">
									{containerStats?.running || 0}
								</Badge>
							</div>

							<div className="flex items-center justify-between">
								<span className="text-sm">Stopped</span>
								<Badge className="bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600">
									{containerStats?.stopped || 0}
								</Badge>
							</div>

							{(containerStats?.paused || 0) > 0 && (
								<div className="flex items-center justify-between">
									<span className="text-sm">Paused</span>
									<Badge className="bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600">
										{containerStats?.paused}
									</Badge>
								</div>
							)}

							{(containerStats?.restarting || 0) > 0 && (
								<div className="flex items-center justify-between">
									<span className="text-sm">Restarting</span>
									<Badge className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
										{containerStats?.restarting}
									</Badge>
								</div>
							)}

							<Link
								href={`/${environment}/containers`}
								className="block text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mt-4"
							>
								View all containers →
							</Link>
						</div>
					)}
				</Card>
			</div>
		</div>
	)
}
