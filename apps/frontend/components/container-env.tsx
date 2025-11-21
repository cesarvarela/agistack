"use client"

/**
 * Container Environment Variables Component
 * Displays environment variables from a Docker container
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { trpc } from "@/lib/trpc"

interface ContainerEnvProps {
	containerId: string
	serverId: string
}

export function ContainerEnv({ containerId, serverId }: ContainerEnvProps) {
	const { data, isLoading, error } = trpc.proxy.container.env.useQuery({
		nodeId: serverId,
		dockerId: containerId,
	})

	// Parse "KEY=VALUE" strings into objects
	const envVars = (data?.env || []).map((str) => {
		const [key, ...valueParts] = str.split("=")
		return { key, value: valueParts.join("=") }
	})

	return (
		<Card>
			<CardHeader>
				<CardTitle>Environment Variables</CardTitle>
				<CardDescription>Container environment configuration</CardDescription>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<p className="text-sm text-muted-foreground">Loading environment variables...</p>
				) : error ? (
					<p className="text-sm text-destructive">Failed to load environment variables</p>
				) : envVars.length === 0 ? (
					<p className="text-sm text-muted-foreground">No environment variables</p>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Variable</TableHead>
								<TableHead>Value</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{envVars.map(({ key, value }) => (
								<TableRow key={key}>
									<TableCell className="font-mono font-medium">{key}</TableCell>
									<TableCell className="font-mono break-all">{value}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</CardContent>
		</Card>
	)
}
