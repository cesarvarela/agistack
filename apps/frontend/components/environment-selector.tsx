"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useEnvironment } from "@/context/environment-context"
import { trpc } from "@/lib/trpc"

interface ServerItem {
	id: string
	name: string
	status?: "online" | "offline" | "error"
}

export function EnvironmentSelector() {
	const { selected } = useEnvironment()
	const [mounted, setMounted] = useState(false)
	useEffect(() => setMounted(true), [])
	const router = useRouter()
	const pathname = usePathname()

	const { data, isLoading } = trpc.actions.listNodes.useQuery({})
	const servers: ServerItem[] = data?.nodes || []
	const loading = isLoading

	const onPick = (id: string) => {
		// Navigate to the same page but with new environment
		// Extract current path segments after environment
		const segments = pathname?.split("/").filter(Boolean) || []
		const currentPage = segments.length > 1 ? segments.slice(1).join("/") : "containers"

		router.push(`/${id}/${currentPage}`)
	}

	if (!mounted) {
		return (
			<div className="flex items-center gap-2">
				<span className="text-sm text-gray-500">Environment:</span>
				<div className="h-6 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
			</div>
		)
	}

	return (
		<div className="flex items-center gap-2">
			<span className="text-sm text-gray-500">Environment:</span>
			<div className="flex gap-1">
				{servers.map((s) => (
					<button
						key={s.id}
						type="button"
						onClick={() => onPick(s.id)}
						className={`px-2 py-1 rounded text-sm inline-flex items-center gap-2 ${
							selected === s.id
								? "bg-blue-600 text-white"
								: "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
						}`}
						title={s.name}
					>
						<span
							className={`inline-block w-2 h-2 rounded-full ${
								s.status === "online"
									? "bg-green-500"
									: s.status === "error"
										? "bg-red-500"
										: "bg-gray-400"
							}`}
						/>
						<span>{s.name}</span>
					</button>
				))}
			</div>
			{loading && <span className="text-xs text-gray-400">Loading...</span>}
		</div>
	)
}
