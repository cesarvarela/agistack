"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { trpc } from "@/lib/trpc"

export function AddServerButton() {
	const [open, setOpen] = useState(false)
	const [name, setName] = useState("Test Node")
	const [url, setUrl] = useState("http://localhost:4001")
	const [error, setError] = useState<string | null>(null)

	const utils = trpc.useContext()
	const addNodeMutation = trpc.actions.addNode.useMutation({
		onSuccess: () => {
			utils.actions.listNodes.invalidate()
		},
	})

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)
		try {
			await addNodeMutation.mutateAsync({ name, url })
			setOpen(false)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to add node")
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline">Add Node</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add Node</DialogTitle>
				</DialogHeader>
				<form onSubmit={onSubmit} className="space-y-4">
					<div>
						<label htmlFor="node-name" className="block text-sm mb-1">
							Name
						</label>
						<Input
							id="node-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
							placeholder="Production Node"
						/>
					</div>
					<div>
						<label htmlFor="node-url" className="block text-sm mb-1">
							Node URL
						</label>
						<Input
							id="node-url"
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							required
							placeholder="http://node.example.com:4001"
						/>
						<p className="text-xs text-gray-500 mt-1">Base URL for the node's tRPC API</p>
					</div>
					{error && <p className="text-sm text-red-600">{error}</p>}
					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
							disabled={addNodeMutation.isPending}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={addNodeMutation.isPending}>
							{addNodeMutation.isPending ? "Adding..." : "Add Node"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}
