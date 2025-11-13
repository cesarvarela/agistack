import type { Metadata } from "next"
import { DashboardClient } from "./dashboard-client"

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

	return <DashboardClient environment={environment} />
}
