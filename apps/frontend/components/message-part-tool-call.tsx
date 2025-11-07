"use client"

import { CheckCircle2, ChevronDown, ChevronRight, Loader2, Wrench, XCircle } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface ToolCallPartProps {
	toolName: string
	state: "call" | "result" | "partial-call"
	args?: Record<string, unknown>
	result?: unknown
	error?: string
}

export function ToolCallPart({ toolName, state, args, result, error }: ToolCallPartProps) {
	const [isOpen, setIsOpen] = useState(false)

	const getStatusBadge = () => {
		if (error || state === "result") {
			if (error) {
				return (
					<Badge variant="destructive" className="ml-2">
						<XCircle className="h-3 w-3 mr-1" />
						Error
					</Badge>
				)
			}
			return (
				<Badge variant="default" className="ml-2 bg-green-600">
					<CheckCircle2 className="h-3 w-3 mr-1" />
					Success
				</Badge>
			)
		}

		return (
			<Badge variant="secondary" className="ml-2">
				<Loader2 className="h-3 w-3 mr-1 animate-spin" />
				Calling...
			</Badge>
		)
	}

	const hasDetails =
		(args && Object.keys(args).length > 0) || error || (result !== undefined && !error)

	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen} className="my-2">
			<div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
				<CollapsibleTrigger className="flex items-center gap-2 w-full hover:opacity-70 transition-opacity">
					{hasDetails &&
						(isOpen ? (
							<ChevronDown className="h-4 w-4 text-gray-500" />
						) : (
							<ChevronRight className="h-4 w-4 text-gray-500" />
						))}
					<Wrench className="h-4 w-4 text-gray-500" />
					<span className="font-mono text-sm font-medium">{toolName}</span>
					{getStatusBadge()}
				</CollapsibleTrigger>

				<CollapsibleContent>
					{args && Object.keys(args).length > 0 && (
						<div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
							<span className="font-medium">Parameters:</span>
							<pre className="mt-1 p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto">
								{JSON.stringify(args, null, 2)}
							</pre>
						</div>
					)}

					{error && (
						<div className="mt-2 text-xs text-red-600 dark:text-red-400">
							<span className="font-medium">Error:</span>
							<p className="mt-1">{error}</p>
						</div>
					)}

					{result !== undefined && !error && state === "result" && (
						<div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
							<span className="font-medium">Result:</span>
							<pre className="mt-1 p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto max-h-40">
								{typeof result === "string"
									? result
									: typeof result === "object"
										? JSON.stringify(result, null, 2)
										: String(result)}
							</pre>
						</div>
					)}
				</CollapsibleContent>
			</div>
		</Collapsible>
	)
}
