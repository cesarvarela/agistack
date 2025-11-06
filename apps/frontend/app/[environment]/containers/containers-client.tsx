"use client"

import Link from "next/link"
import type { ContainerListItem, ContainerPort } from "@agistack/tool-metadata"
import { trpc } from "@/lib/trpc"

interface ContainersClientProps {
	environment: string
}

export function ContainersClient({ environment }: ContainersClientProps) {
	const { data, isLoading, error } = trpc.proxy.container.list.useQuery({
		nodeId: environment,
		status: "all",
	})

	const containers = data?.containers || []
	const loading = isLoading

	if (loading) {
		return (
			<div className="space-y-3">
				<div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
				<div className="h-48 w-full bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
			</div>
		)
	}

	if (error) {
		return (
			<div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
				<p className="text-red-600">{error.message}</p>
			</div>
		)
	}

	return (
		<div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
			<div className="overflow-x-auto">
				<table className="w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
					<colgroup>
						<col className="w-[25%]" />
						<col className="w-[25%]" />
						<col className="w-[20%]" />
						<col className="w-[15%]" />
						<col className="w-[15%]" />
					</colgroup>
					<thead className="bg-gray-50 dark:bg-gray-900">
						<tr>
							<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
								Name
							</th>
							<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
								Image
							</th>
							<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
								Status
							</th>
							<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
								Ports
							</th>
							<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
								Actions
							</th>
						</tr>
					</thead>
					<tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
						{containers.map((container: ContainerListItem, index: number) => (
							<tr
								key={`${container.dockerId}-${index}`}
								className="hover:bg-gray-50 dark:hover:bg-gray-700"
							>
								<td className="px-4 py-3">
									<div
										className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate"
										title={container.name || container.dockerId}
									>
										{container.name || container.dockerId.slice(0, 12)}
									</div>
								</td>
								<td className="px-4 py-3">
									<div
										className="text-sm text-gray-900 dark:text-gray-100 truncate"
										title={container.image || "N/A"}
									>
										{container.image || "N/A"}
									</div>
								</td>
								<td className="px-4 py-3">
									<span
										className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
											String(container.state).toLowerCase().includes("running")
												? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
												: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
										}`}
									>
										{container.state || "Unknown"}
									</span>
								</td>
								<td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
									<div
										className="truncate"
										title={
											Array.isArray(container.ports) && container.ports.length > 0
												? container.ports
														.map(
															(p: ContainerPort) =>
																`${p.PublicPort || ""}${p.PublicPort ? ":" : ""}${p.PrivatePort}`,
														)
														.join(", ")
												: "-"
										}
									>
										{Array.isArray(container.ports) && container.ports.length > 0
											? container.ports
													.slice(0, 2)
													.map(
														(p: ContainerPort) =>
															`${p.PublicPort || ""}${p.PublicPort ? ":" : ""}${p.PrivatePort}`,
													)
													.join(", ")
											: "-"}
										{container.ports?.length > 2 && ` +${container.ports.length - 2}`}
									</div>
								</td>
								<td className="px-4 py-3 text-sm font-medium">
									<Link
										href={`/${environment}/containers/${container.dockerId}`}
										className="text-blue-600 hover:text-blue-900"
									>
										View
									</Link>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}
