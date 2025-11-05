"use client"

/**
 * Container Detail Client Component
 * Handles interactive features like tabs and action buttons
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { useUrlState } from "@/hooks/use-url-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ContainerStats } from "@/components/container-stats"
import { trpc } from "@/lib/trpc"

// Dynamic imports for xterm-dependent components to avoid SSR issues
const ContainerLogs = dynamic(
	() => import("@/components/container-logs").then((mod) => ({ default: mod.ContainerLogs })),
	{ ssr: false },
)

const ContainerTerminal = dynamic(
	() =>
		import("@/components/container-terminal").then((mod) => ({ default: mod.ContainerTerminal })),
	{ ssr: false },
)

interface ContainerDetailClientProps {
	container: any
	serverId: string
}

export function ContainerDetailClient({ container, serverId }: ContainerDetailClientProps) {
	const router = useRouter()
	const [isLoading, setIsLoading] = useState<string | null>(null)
	const [activeTab, setActiveTab] = useUrlState("tab", "overview")

	const startMutation = trpc.proxy.container.start.useMutation()
	const stopMutation = trpc.proxy.container.stop.useMutation()
	const restartMutation = trpc.proxy.container.restart.useMutation()

	const handleAction = async (action: "start" | "stop" | "restart") => {
		setIsLoading(action)
		try {
			const input = {
				nodeId: serverId,
				dockerId: container.dockerId,
			}

			if (action === "start") {
				await startMutation.mutateAsync(input)
			} else if (action === "stop") {
				await stopMutation.mutateAsync(input)
			} else if (action === "restart") {
				await restartMutation.mutateAsync(input)
			}

			// Refresh the page to get updated status
			router.refresh()
		} catch (error) {
			alert(`Failed to ${action} container`)
			console.error(error)
		} finally {
			setIsLoading(null)
		}
	}

	const isRunning = container.state === "running"

	return (
		<div className="p-8 space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">{container.name}</h1>
					<p className="text-gray-500 dark:text-gray-400">{container.dockerId}</p>
				</div>
				<Badge
					variant={isRunning ? "default" : "secondary"}
					className={
						isRunning ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : ""
					}
				>
					{container.status}
				</Badge>
			</div>

			{/* Action Buttons */}
			<div className="flex gap-2">
				<Button
					onClick={() => handleAction("start")}
					disabled={isRunning || isLoading !== null}
					variant="default"
				>
					{isLoading === "start" ? "Starting..." : "Start"}
				</Button>
				<Button
					onClick={() => handleAction("stop")}
					disabled={!isRunning || isLoading !== null}
					variant="destructive"
				>
					{isLoading === "stop" ? "Stopping..." : "Stop"}
				</Button>
				<Button
					onClick={() => handleAction("restart")}
					disabled={!isRunning || isLoading !== null}
					variant="outline"
				>
					{isLoading === "restart" ? "Restarting..." : "Restart"}
				</Button>
			</div>

			{/* Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="logs">Logs</TabsTrigger>
					<TabsTrigger value="stats">Stats</TabsTrigger>
					<TabsTrigger value="terminal" disabled={!isRunning}>
						Terminal
					</TabsTrigger>
					<TabsTrigger value="config">Config</TabsTrigger>
				</TabsList>

				{/* Overview Tab */}
				<TabsContent value="overview" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Container Information</CardTitle>
							<CardDescription>Docker state and metadata</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<p className="text-sm font-medium text-gray-500">Image</p>
									<p className="text-sm">{container.image}</p>
								</div>
								<div>
									<p className="text-sm font-medium text-gray-500">State</p>
									<p className="text-sm">{container.state}</p>
								</div>
								<div>
									<p className="text-sm font-medium text-gray-500">Server</p>
									<p className="text-sm">{container.serverId}</p>
								</div>
								<div>
									<p className="text-sm font-medium text-gray-500">Managed</p>
									<p className="text-sm">{container.managedByPlatform ? "Yes" : "No"}</p>
								</div>
							</div>

							{container.ports && container.ports.length > 0 && (
								<div>
									<p className="text-sm font-medium text-gray-500 mb-2">Ports</p>
									<div className="space-y-1">
										{container.ports.map((port: any, idx: number) => (
											<p key={idx} className="text-sm font-mono">
												{port.PublicPort ? `${port.PublicPort}:` : ""}
												{port.PrivatePort}/{port.Type}
											</p>
										))}
									</div>
								</div>
							)}

							{container.tags && container.tags.length > 0 && (
								<div>
									<p className="text-sm font-medium text-gray-500 mb-2">Tags</p>
									<div className="flex flex-wrap gap-2">
										{container.tags.map((tag: string) => (
											<Badge key={tag} variant="outline">
												{tag}
											</Badge>
										))}
									</div>
								</div>
							)}

							{container.notes && (
								<div>
									<p className="text-sm font-medium text-gray-500 mb-2">Notes</p>
									<p className="text-sm whitespace-pre-wrap">{container.notes}</p>
								</div>
							)}

							{container.deployedBy && (
								<div>
									<p className="text-sm font-medium text-gray-500">Deployed By</p>
									<p className="text-sm">{container.deployedBy}</p>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Logs Tab */}
				<TabsContent value="logs">
					<ContainerLogs
						containerId={container.internalId || container.dockerId}
						serverId={serverId}
					/>
				</TabsContent>

				{/* Stats Tab */}
				<TabsContent value="stats">
					<ContainerStats
						containerId={container.internalId || container.dockerId}
						serverId={serverId}
					/>
				</TabsContent>

				{/* Terminal Tab */}
				<TabsContent value="terminal">
					<ContainerTerminal
						containerId={container.internalId || container.dockerId}
						serverId={serverId}
					/>
				</TabsContent>

				{/* Config Tab */}
				<TabsContent value="config">
					<Card>
						<CardHeader>
							<CardTitle>Configuration</CardTitle>
							<CardDescription>Deployment configuration</CardDescription>
						</CardHeader>
						<CardContent>
							{container.deploymentConfig ? (
								<pre className="text-sm bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto">
									{JSON.stringify(container.deploymentConfig, null, 2)}
								</pre>
							) : (
								<p className="text-sm text-gray-500">No deployment configuration available</p>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	)
}
