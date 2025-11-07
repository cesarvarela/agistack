"use client"

import { ChevronDown, ChevronRight } from "lucide-react"
import { useState } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface ReasoningPartProps {
	content: string
	streaming?: boolean
}

export function ReasoningPart({ content, streaming = false }: ReasoningPartProps) {
	const [isOpen, setIsOpen] = useState(streaming)

	// Auto-expand while streaming, collapse when done
	if (streaming && !isOpen) {
		setIsOpen(true)
	}

	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen} className="my-2">
			<CollapsibleTrigger className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
				{isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
				<span className="font-medium">
					{streaming ? "Reasoning..." : "Reasoned for a few seconds"}
				</span>
			</CollapsibleTrigger>
			<CollapsibleContent className="mt-2 pl-6 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap border-l-2 border-gray-200 dark:border-gray-700">
				{content}
			</CollapsibleContent>
		</Collapsible>
	)
}
