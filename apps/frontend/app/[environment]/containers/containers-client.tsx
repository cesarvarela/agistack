"use client"

import type { ContainerListItem, ContainerPort } from "@agistack/tool-metadata"
import Link from "next/link"
import { trpc } from "@/lib/trpc"
import {
	useReactTable,
	getCoreRowModel,
	flexRender,
	type ColumnDef,
	type RowSelectionState,
} from "@tanstack/react-table"
import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Play, Square, RotateCcw, X } from "lucide-react"

interface ContainersClientProps {
	environment: string
}

export function ContainersClient({ environment }: ContainersClientProps) {
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

	const { data, isLoading, error } = trpc.proxy.container.list.useQuery({
		nodeId: environment,
		status: "all",
	})

	const utils = trpc.useUtils()

	const startMutation = trpc.proxy.container.start.useMutation({
		onSuccess: () => {
			utils.proxy.container.list.invalidate()
		},
	})

	const stopMutation = trpc.proxy.container.stop.useMutation({
		onSuccess: () => {
			utils.proxy.container.list.invalidate()
		},
	})

	const restartMutation = trpc.proxy.container.restart.useMutation({
		onSuccess: () => {
			utils.proxy.container.list.invalidate()
		},
	})

	const containers = data?.containers || []

	const columns: ColumnDef<ContainerListItem>[] = [
		{
			id: "select",
			header: ({ table }) => (
				<Checkbox
					checked={
						table.getIsAllPageRowsSelected() ||
						(table.getIsSomePageRowsSelected() && "indeterminate")
					}
					onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
					aria-label="Select all"
				/>
			),
			cell: ({ row }) => (
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					aria-label="Select row"
				/>
			),
			enableSorting: false,
			enableHiding: false,
		},
		{
			accessorKey: "name",
			header: "Name",
			cell: ({ row }) => {
				const container = row.original
				return (
					<div
						className="text-sm font-medium text-foreground truncate"
						title={container.name || container.dockerId}
					>
						{container.name || container.dockerId.slice(0, 12)}
					</div>
				)
			},
		},
		{
			accessorKey: "image",
			header: "Image",
			cell: ({ row }) => {
				const container = row.original
				return (
					<div
						className="text-sm text-foreground truncate"
						title={container.image || "N/A"}
					>
						{container.image || "N/A"}
					</div>
				)
			},
		},
		{
			accessorKey: "state",
			header: "Status",
			cell: ({ row }) => {
				const container = row.original
				return (
					<span
						className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
							String(container.state).toLowerCase().includes("running")
								? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
								: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
						}`}
					>
						{container.state || "Unknown"}
					</span>
				)
			},
		},
		{
			accessorKey: "ports",
			header: "Ports",
			cell: ({ row }) => {
				const container = row.original
				const portsText =
					Array.isArray(container.ports) && container.ports.length > 0
						? container.ports
								.map(
									(p: ContainerPort) =>
										`${p.PublicPort || ""}${p.PublicPort ? ":" : ""}${p.PrivatePort}`,
								)
								.join(", ")
						: "-"
				const displayPorts =
					Array.isArray(container.ports) && container.ports.length > 0
						? container.ports
								.slice(0, 2)
								.map(
									(p: ContainerPort) =>
										`${p.PublicPort || ""}${p.PublicPort ? ":" : ""}${p.PrivatePort}`,
								)
								.join(", ")
						: "-"
				return (
					<div className="text-sm text-muted-foreground truncate" title={portsText}>
						{displayPorts}
						{container.ports?.length > 2 && ` +${container.ports.length - 2}`}
					</div>
				)
			},
		},
		{
			id: "actions",
			header: "Actions",
			cell: ({ row }) => {
				const container = row.original
				return (
					<Link
						href={`/${environment}/containers/${container.dockerId}`}
						className="text-sm font-medium text-primary hover:text-primary/80"
					>
						View
					</Link>
				)
			},
		},
	]

	const table = useReactTable({
		data: containers,
		columns,
		getCoreRowModel: getCoreRowModel(),
		onRowSelectionChange: setRowSelection,
		state: {
			rowSelection,
		},
		getRowId: (row) => row.dockerId,
	})

	const selectedRows = table.getSelectedRowModel().rows
	const selectedContainers = selectedRows.map((row) => row.original)
	const isBulkActionPending =
		startMutation.isPending || stopMutation.isPending || restartMutation.isPending

	const handleBulkStart = async () => {
		const promises = selectedContainers.map((container) =>
			startMutation.mutateAsync({
				nodeId: environment,
				dockerId: container.dockerId,
			}),
		)
		await Promise.allSettled(promises)
		setRowSelection({})
	}

	const handleBulkStop = async () => {
		const promises = selectedContainers.map((container) =>
			stopMutation.mutateAsync({
				nodeId: environment,
				dockerId: container.dockerId,
			}),
		)
		await Promise.allSettled(promises)
		setRowSelection({})
	}

	const handleBulkRestart = async () => {
		const promises = selectedContainers.map((container) =>
			restartMutation.mutateAsync({
				nodeId: environment,
				dockerId: container.dockerId,
			}),
		)
		await Promise.allSettled(promises)
		setRowSelection({})
	}

	if (isLoading) {
		return (
			<div className="space-y-3">
				<div className="h-8 w-40 bg-muted rounded animate-pulse" />
				<div className="h-48 w-full bg-muted rounded animate-pulse" />
			</div>
		)
	}

	if (error) {
		return (
			<div className="text-center py-12 bg-card rounded-lg">
				<p className="text-red-600">{error.message}</p>
			</div>
		)
	}

	return (
		<div className="space-y-4">
			{selectedContainers.length > 0 && (
				<div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
					<span className="text-sm font-medium">
						{selectedContainers.length} container
						{selectedContainers.length !== 1 ? "s" : ""} selected
					</span>
					<div className="flex items-center gap-2">
						<Button
							size="sm"
							variant="outline"
							onClick={handleBulkStart}
							disabled={isBulkActionPending}
						>
							<Play className="h-4 w-4 mr-1" />
							Start
						</Button>
						<Button
							size="sm"
							variant="outline"
							onClick={handleBulkStop}
							disabled={isBulkActionPending}
						>
							<Square className="h-4 w-4 mr-1" />
							Stop
						</Button>
						<Button
							size="sm"
							variant="outline"
							onClick={handleBulkRestart}
							disabled={isBulkActionPending}
						>
							<RotateCcw className="h-4 w-4 mr-1" />
							Restart
						</Button>
					</div>
					<Button
						size="sm"
						variant="ghost"
						onClick={() => setRowSelection({})}
						className="ml-auto"
					>
						<X className="h-4 w-4 mr-1" />
						Clear
					</Button>
				</div>
			)}

			<div className="bg-card rounded-lg shadow overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full table-fixed divide-y divide-border">
						<colgroup>
							<col className="w-[5%]" />
							<col className="w-[22%]" />
							<col className="w-[23%]" />
							<col className="w-[18%]" />
							<col className="w-[17%]" />
							<col className="w-[15%]" />
						</colgroup>
						<thead className="bg-muted">
							{table.getHeaderGroups().map((headerGroup) => (
								<tr key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<th
											key={header.id}
											className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
										>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</th>
									))}
								</tr>
							))}
						</thead>
						<tbody className="bg-card divide-y divide-border">
							{table.getRowModel().rows.map((row) => (
								<tr
									key={row.id}
									className={`hover:bg-muted/50 ${
										row.getIsSelected() ? "bg-muted/30" : ""
									}`}
								>
									{row.getVisibleCells().map((cell) => (
										<td key={cell.id} className="px-4 py-3">
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}
