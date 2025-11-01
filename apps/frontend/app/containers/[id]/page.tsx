/**
 * Container Detail Page
 * Shows container information with tabs for Overview, Logs, Stats, and Config
 */

import { notFound } from "next/navigation"
import { api } from "@/lib/api-client"
import { ContainerDetailClient } from "./container-detail-client"

interface ContainerDetailPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ContainerDetailPage({ params, searchParams }: ContainerDetailPageProps) {
  const p = await params
  const sp = await searchParams
  const serverId = (sp?.serverId as string) || "local"
  try {
    const response = await api.containers[":id"].$get({
      param: { id: p.id },
      query: { serverId },
    })

    if (!response.ok) notFound()
    const data = await response.json()
    const container = data.container
    if (!container) notFound()
    return <ContainerDetailClient container={container} />
  } catch (error) {
    console.error("Failed to fetch container:", error)
    notFound()
  }
}
