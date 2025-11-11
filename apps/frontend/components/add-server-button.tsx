"use client"

import { NODE_PORT } from "@agistack/node-api/constants"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, Copy } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useRuntimeConfig } from "@/context/environment-context"
import { trpc } from "@/lib/trpc"

const addNodeSchema = z.object({
	name: z.string().min(1, "Name is required"),
	url: z
		.string()
		.min(1, "URL is required")
		.refine(
			(url) => {
				try {
					const parsed = new URL(url)
					return parsed.port !== ""
				} catch {
					// If URL parsing fails, try regex to check for port
					return /:\d+/.test(url)
				}
			},
			{ message: `URL must include a port (e.g., http://server:${NODE_PORT})` },
		),
})

type AddNodeFormData = z.infer<typeof addNodeSchema>

export function AddServerButton() {
	const [open, setOpen] = useState(false)
	const [copied, setCopied] = useState(false)

	const runtimeConfig = useRuntimeConfig()
	const utils = trpc.useContext()
	const addNodeMutation = trpc.actions.addNode.useMutation({
		onSuccess: () => {
			utils.actions.listNodes.invalidate()
		},
	})

	const {
		register,
		handleSubmit,
		formState: { errors, isValid },
		reset,
	} = useForm<AddNodeFormData>({
		resolver: zodResolver(addNodeSchema),
		mode: "onChange",
		defaultValues: {
			name: "Test Node",
			url: "",
		},
	})

	const dockerCommand = `docker run -d \\
  --name agistack-node \\
  -p ${NODE_PORT}:${NODE_PORT} \\
  -v /var/run/docker.sock:/var/run/docker.sock \\
  -e AGENT_SECRET=${runtimeConfig.agentSecret} \\
  ghcr.io/agistack/agistack-node:latest`

	const copyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(dockerCommand)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		} catch (err) {
			console.error("Failed to copy:", err)
		}
	}

	const onSubmit = async (data: AddNodeFormData) => {
		try {
			await addNodeMutation.mutateAsync(data)
			setOpen(false)
			reset()
		} catch (_err) {
			// Error handled by mutation
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline">Add Environment</Button>
			</DialogTrigger>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Add Environment</DialogTitle>
				</DialogHeader>

				{/* Installation Instructions */}
				<div className="space-y-3 rounded-lg border bg-muted/50 p-4">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-semibold">Step 1: Install Node on Target Server</h3>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={copyToClipboard}
							className="h-8 gap-2"
						>
							{copied ? (
								<>
									<Check className="h-4 w-4" />
									Copied!
								</>
							) : (
								<>
									<Copy className="h-4 w-4" />
									Copy
								</>
							)}
						</Button>
					</div>
					<pre className="overflow-x-auto rounded bg-background p-3 text-xs">
						<code>{dockerCommand}</code>
					</pre>
					<p className="text-xs text-muted-foreground">
						Run this command on the server you want to manage. The node will listen on port{" "}
						{NODE_PORT}.
					</p>
				</div>

				{/* Configuration Form */}
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<h3 className="text-sm font-semibold">Step 2: Register the Environment</h3>
					<div>
						<label htmlFor="node-name" className="block text-sm mb-1">
							Name
						</label>
						<Input id="node-name" {...register("name")} placeholder="Production" />
						{errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
					</div>
					<div>
						<label htmlFor="node-url" className="block text-sm mb-1">
							Node URL
						</label>
						<Input
							id="node-url"
							{...register("url")}
							placeholder={`http://node.example.com:${NODE_PORT}`}
						/>
						<p className="text-xs text-gray-500 mt-1">
							Must include port {NODE_PORT} to match the Docker command above
						</p>
						{errors.url && <p className="text-sm text-red-600 mt-1">{errors.url.message}</p>}
					</div>
					{addNodeMutation.error && (
						<p className="text-sm text-red-600">{addNodeMutation.error.message}</p>
					)}
					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
							disabled={addNodeMutation.isPending}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={addNodeMutation.isPending || !isValid}>
							{addNodeMutation.isPending ? "Adding..." : "Add Environment"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}
