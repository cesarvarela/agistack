"use client"

import Link from "next/link"
import { useState } from "react"
import { trpc } from "@/lib/trpc"
import { AddServerButton } from "@/components/add-server-button"

export default function Home() {
	const { data, isLoading } = trpc.actions.listNodes.useQuery({})
	const nodes = data?.nodes || []
	const [deletingId, setDeletingId] = useState<string | null>(null)

	const utils = trpc.useContext()
	const deleteNodeMutation = trpc.actions.deleteNode.useMutation({
		onSuccess: () => {
			utils.actions.listNodes.invalidate()
		},
	})

	const handleDelete = async (e: React.MouseEvent, nodeId: string) => {
		e.preventDefault()
		e.stopPropagation()

		if (!confirm("Are you sure you want to delete this environment?")) {
			return
		}

		setDeletingId(nodeId)
		try {
			await deleteNodeMutation.mutateAsync({ id: nodeId })
		} catch (error) {
			alert("Failed to delete environment")
			console.error(error)
		} finally {
			setDeletingId(null)
		}
	}

	if (isLoading) {
		return (
			<div className="container mx-auto p-8">
				<h1 className="text-3xl font-bold mb-8">Select Environment</h1>
				<div className="space-y-2">
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className="p-4 border rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
						>
							<div className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-2" />
							<div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3" />
						</div>
					))}
				</div>
			</div>
		)
	}

	return (
		<div className="container mx-auto p-8">
			<div className="flex items-center justify-between mb-8">
				<h1 className="text-3xl font-bold">Environments</h1>
				<AddServerButton />
			</div>

			{nodes.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-gray-500 mb-4">No environments configured</p>
					<p className="text-sm text-gray-400">Add a server to get started</p>
				</div>
			) : (
				<div className="space-y-2">
					{nodes.map((node) => (
						<div
							key={node.id}
							className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
						>
							<Link href={`/${node.id}/containers`} className="flex-1 flex items-center gap-4">
								<div className="flex-1">
									<h2 className="text-lg font-semibold">{node.name}</h2>
									<p className="text-sm text-gray-500 dark:text-gray-400">{node.url}</p>
								</div>
							</Link>
							<button
								type="button"
								onClick={(e) => handleDelete(e, node.id)}
								disabled={deletingId === node.id}
								className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
							>
								{deletingId === node.id ? "Deleting..." : "Delete"}
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
