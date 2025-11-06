import type { Metadata } from "next"

type PageProps = {
	params: Promise<{ environment: string }>
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
	const params = await props.params
	return {
		title: `Dashboard - ${params.environment}`,
	}
}

export default async function DashboardPage(props: PageProps) {
	const params = await props.params
	const { environment } = params

	return (
		<div className="container mx-auto p-6">
			<div className="mb-6">
				<h1 className="text-3xl font-bold">Dashboard</h1>
				<p className="text-muted-foreground mt-2">
					Environment: <span className="font-mono font-semibold">{environment}</span>
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				<div className="rounded-lg border bg-card p-6">
					<h3 className="font-semibold mb-2">Resource Overview</h3>
					<p className="text-sm text-muted-foreground">
						System metrics and resource usage will be displayed here.
					</p>
				</div>

				<div className="rounded-lg border bg-card p-6">
					<h3 className="font-semibold mb-2">Container Statistics</h3>
					<p className="text-sm text-muted-foreground">
						Quick stats about running and stopped containers.
					</p>
				</div>

				<div className="rounded-lg border bg-card p-6">
					<h3 className="font-semibold mb-2">Recent Activity</h3>
					<p className="text-sm text-muted-foreground">
						Timeline of recent container events and actions.
					</p>
				</div>
			</div>
		</div>
	)
}
