"use client"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { trpc } from "@/lib/trpc"
import { Box, Container, Server } from "lucide-react"
import Link from "next/link"

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
				<p className="text-muted-foreground mt-2">
					Environment: <span className="font-mono font-semibold">{environment}</span>
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				{/* Server Overview Card */}
				<Card className="p-6">
					<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
						<Server className="h-5 w-5" />
						Server Overview
					</h3>

					<div className="space-y-3">
						<div>
							<div className="text-sm font-medium text-gray-600 dark:text-gray-400">Node ID</div>
							{nodeLoading ? (
								<Skeleton className="h-4 w-full mt-1" />
							) : (
								<div className="text-sm font-mono">{nodeInfo?.node.id || environment}</div>
							)}
						</div>

						<div>
							<div className="text-sm font-medium text-gray-600 dark:text-gray-400">Node Name</div>
							{nodeLoading ? (
								<Skeleton className="h-4 w-full mt-1" />
							) : (
								<div className="text-sm">{nodeInfo?.node.name || "N/A"}</div>
							)}
						</div>

						<div>
							<div className="text-sm font-medium text-gray-600 dark:text-gray-400">URL</div>
							{nodeLoading ? (
								<Skeleton className="h-4 w-full mt-1" />
							) : (
								<div className="text-sm font-mono text-blue-600 dark:text-blue-400">
									{nodeInfo?.node.url || "N/A"}
								</div>
							)}
						</div>

						<div>
							<div className="text-sm font-medium text-gray-600 dark:text-gray-400">
								Total Containers
							</div>
							{containersLoading ? (
								<Skeleton className="h-6 w-12 mt-1" />
							) : (
								<div className="text-2xl font-bold">{containerStats?.total || 0}</div>
							)}
						</div>
					</div>
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
