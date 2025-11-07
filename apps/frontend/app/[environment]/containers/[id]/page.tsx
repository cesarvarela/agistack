"use client"

/**
 * Container Detail Page
 * Shows container information with tabs for Overview, Logs, Stats, and Config
 */

import { notFound } from "next/navigation"
import { use } from "react"
import { trpc } from "@/lib/trpc"
import { ContainerDetailClient } from "./container-detail-client"

interface ContainerDetailPageProps {
	params: Promise<{ environment: string; id: string }>
}

export default function ContainerDetailPage({ params }: ContainerDetailPageProps) {
	const p = use(params)
	const serverId = p.environment

	const { data, isLoading, error } = trpc.proxy.container.inspect.useQuery({
		nodeId: serverId,
		dockerId: p.id,
	})

	if (isLoading) {
		return (
			<div className="p-8 space-y-6">
				<div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
				<div className="h-48 w-full bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
			</div>
		)
	}

	if (error || !data?.inspect) {
		notFound()
	}

	const inspect = data.inspect

	const container = {
		dockerId: data.dockerId,
		name: inspect.Name?.replace(/^\//, "") || data.dockerId,
		image: inspect.Config?.Image || "Unknown",
		state: inspect.State?.Status || "unknown",
		status: inspect.State?.Status || "unknown",
		ports: inspect.NetworkSettings?.Ports
			? Object.entries(inspect.NetworkSettings.Ports).flatMap(([privatePort, bindings]) => {
					if (!bindings) return []
					const [port, protocol] = privatePort.split("/")
					return bindings.map((binding) => ({
						PrivatePort: port,
						PublicPort: binding?.HostPort,
						Type: protocol,
					}))
				})
			: [],
		serverId,
	}

	return <ContainerDetailClient container={container} serverId={serverId} />
}
