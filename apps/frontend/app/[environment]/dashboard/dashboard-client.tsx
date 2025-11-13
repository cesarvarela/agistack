"use client"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { trpc } from "@/lib/trpc"
import { Activity, Box, Container, Server } from "lucide-react"
import Link from "next/link"
import { ContainerStatsChart } from "@/components/container-stats-chart"

interface DashboardClientProps {
	environment: string
}

export function DashboardClient({ environment }: DashboardClientProps) {
	const { data: nodeInfo, isLoading: nodeLoading } = trpc.actions.getNodeInfo.useQuery({
		nodeId: environment,
	})

	const { data: containers, isLoading: containersLoading } = trpc.proxy.container.list.useQuery({
		nodeId: environment,
		status: "all",
	})

	const { data: serverStats, isLoading: statsLoading } = trpc.proxy.server.stats.useQuery(
		{
			nodeId: environment,
		},
		{
			refetchInterval: 60000, // Refresh every 60 seconds
		},
	)

	const containerStats = containers
		? {
				total: containers.containers.length,
				running: containers.containers.filter((c) => c.state === "running").length,
				stopped: containers.containers.filter((c) => ["exited", "stopped"].includes(c.state)).length,
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
					<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
						<Activity className="h-5 w-5" />
						Server Metrics
					</h3>

					{statsLoading ? (
						<div className="space-y-3">
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
						</div>
					) : serverStats && serverStats.length > 0 ? (
						<div className="space-y-6">
							<ContainerStatsChart
								title="CPU Usage"
								series={[
									{
										name: "CPU",
										data: serverStats.map((s) => s.cpu),
										color: "rgba(249, 115, 22, 1)", // orange-500
									},
								]}
								timestamps={serverStats.map((s) => s.timestamp)}
								unit="%"
								height={200}
							/>

							<ContainerStatsChart
								title="Memory Usage"
								series={[
									{
										name: "Memory",
										data: serverStats.map((s) => s.memory.percent),
										color: "rgba(59, 130, 246, 1)", // blue-500
									},
								]}
								timestamps={serverStats.map((s) => s.timestamp)}
								unit="%"
								height={200}
							/>

							<ContainerStatsChart
								title="Disk Usage"
								series={[
									{
										name: "Disk",
										data: serverStats.map((s) => s.disk.percent),
										color: "rgba(168, 85, 247, 1)", // purple-500
									},
								]}
								timestamps={serverStats.map((s) => s.timestamp)}
								unit="%"
								height={200}
							/>

							<ContainerStatsChart
								title="Network Activity"
								series={[
									{
										name: "Download (RX)",
										data: serverStats.map((s) => s.network.rxRate),
										color: "rgba(34, 197, 94, 1)", // green-500
									},
									{
										name: "Upload (TX)",
										data: serverStats.map((s) => s.network.txRate),
										color: "rgba(59, 130, 246, 1)", // blue-500
									},
								]}
								timestamps={serverStats.map((s) => s.timestamp)}
								unit="bytes/s"
								height={200}
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
