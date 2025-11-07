"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, X } from "lucide-react"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { trpc } from "@/lib/trpc"

const settingsSchema = z.object({
	allowedCommands: z.array(z.string()).min(1, "At least one command is required"),
})

type SettingsFormData = z.infer<typeof settingsSchema>

export default function SettingsPage() {
	const [newCommand, setNewCommand] = useState("")
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState(false)

	const utils = trpc.useUtils()
	const { data: settings, isLoading } = trpc.actions.getSettings.useQuery({})
	const updateSettingsMutation = trpc.actions.updateSettings.useMutation({
		onSuccess: () => {
			utils.actions.getSettings.invalidate()
			setSuccess(true)
			setError(null)
			setTimeout(() => setSuccess(false), 3000)
		},
		onError: (error) => {
			setError(error.message)
			setSuccess(false)
		},
	})

	const {
		control,
		handleSubmit,
		reset,
		setValue,
		watch,
		formState: { errors, isDirty },
	} = useForm<SettingsFormData>({
		resolver: zodResolver(settingsSchema),
		defaultValues: {
			allowedCommands: [],
		},
	})

	const allowedCommands = watch("allowedCommands")

	// Load settings into form when data arrives
	useEffect(() => {
		if (settings) {
			reset({
				allowedCommands: settings.allowedCommands,
			})
		}
	}, [settings, reset])

	const onSubmit = (data: SettingsFormData) => {
		updateSettingsMutation.mutate(data)
	}

	const addCommand = () => {
		const trimmedCommand = newCommand.trim()
		if (!trimmedCommand) return

		if (allowedCommands.includes(trimmedCommand)) {
			setError("Command already exists")
			return
		}

		if (/[;&|<>$`\\]/.test(trimmedCommand)) {
			setError("Command contains invalid characters")
			return
		}

		setValue("allowedCommands", [...allowedCommands, trimmedCommand], {
			shouldDirty: true,
		})
		setNewCommand("")
		setError(null)
	}

	const removeCommand = (index: number) => {
		const newCommands = allowedCommands.filter((_, i) => i !== index)
		setValue("allowedCommands", newCommands, { shouldDirty: true })
		setError(null)
	}

	const cancelChanges = () => {
		if (settings) {
			reset({
				allowedCommands: settings.allowedCommands,
			})
			setError(null)
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault()
			addCommand()
		}
	}

	if (isLoading) {
		return (
			<div className="container mx-auto p-6">
				<div className="flex items-center justify-center min-h-[400px]">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			</div>
		)
	}

	return (
		<div className="container mx-auto p-6">
			<div className="mb-6">
				<h1 className="text-3xl font-bold">Settings</h1>
				<p className="text-muted-foreground mt-2">Manage your global application settings.</p>
			</div>

			<form onSubmit={handleSubmit(onSubmit)}>
				<div className="rounded-lg border bg-card p-6">
					<div className="mb-6">
						<h3 className="font-semibold mb-2">Allowed Commands</h3>
						<p className="text-sm text-muted-foreground mb-4">
							Configure which commands can be executed on nodes. Only whitelisted commands will be
							allowed.
						</p>

						<Controller
							name="allowedCommands"
							control={control}
							render={() => (
								<div className="space-y-4">
									<div className="flex gap-2">
										<Input
											type="text"
											placeholder="Enter command name (e.g., docker, ls, grep)"
											value={newCommand}
											onChange={(e) => setNewCommand(e.target.value)}
											onKeyDown={handleKeyDown}
											className="flex-1"
										/>
										<Button type="button" onClick={addCommand} variant="secondary">
											Add
										</Button>
									</div>

									{(error || errors.allowedCommands) && (
										<p className="text-sm text-destructive">
											{error || errors.allowedCommands?.message}
										</p>
									)}

									<div className="flex flex-wrap gap-2 min-h-[50px] p-3 border rounded-md bg-muted/50">
										{allowedCommands.length === 0 ? (
											<p className="text-sm text-muted-foreground">No commands added yet</p>
										) : (
											allowedCommands.map((command, index) => (
												<Badge key={command} variant="secondary" className="pl-3 pr-1 py-1 gap-1">
													<span>{command}</span>
													<Button
														type="button"
														variant="ghost"
														size="icon"
														className="h-4 w-4 hover:bg-transparent"
														onClick={() => removeCommand(index)}
													>
														<X className="h-3 w-3" />
													</Button>
												</Badge>
											))
										)}
									</div>
								</div>
							)}
						/>
					</div>

					<div className="flex gap-2 pt-4 border-t">
						<Button type="submit" disabled={!isDirty || updateSettingsMutation.isPending}>
							{updateSettingsMutation.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Saving...
								</>
							) : (
								"Save Changes"
							)}
						</Button>
						<Button type="button" variant="outline" onClick={cancelChanges} disabled={!isDirty}>
							Cancel
						</Button>
						{success && <p className="text-sm text-green-600 self-center ml-2">Settings saved!</p>}
					</div>
				</div>
			</form>
		</div>
	)
}
