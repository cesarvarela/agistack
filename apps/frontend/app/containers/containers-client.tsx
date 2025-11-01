"use client"

import { useEffect, useMemo, useState } from "react"
import { useEnvironment } from "@/context/environment-context"
import { api } from "@/lib/api-client"

export function ContainersClient() {
  const { selected, ready } = useEnvironment()
  const [containers, setContainers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let canceled = false
    async function load() {
      if (!selected) {
        setContainers([])
        setLoading(false)
        setError(null)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const res = await api.containers.$get({ query: { serverId: selected } })
        if (!canceled) {
          if (!res.ok) {
            setError(`Failed to load containers (${res.status})`)
            setContainers([])
          } else {
            const data = await res.json()
            setContainers(data?.containers || [])
          }
        }
      } catch (e) {
        if (!canceled) setError(e instanceof Error ? e.message : "Failed to load containers")
      } finally {
        if (!canceled) setLoading(false)
      }
    }
    load()
    return () => {
      canceled = true
    }
  }, [selected])

  if (!ready) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-48 w-full bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
      </div>
    )
  }

  if (!selected) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No environment selected</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Use the header to select an environment.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-48 w-full bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
          <colgroup>
            <col className="w-[25%]" />
            <col className="w-[25%]" />
            <col className="w-[20%]" />
            <col className="w-[15%]" />
            <col className="w-[15%]" />
          </colgroup>
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Image
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ports
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {containers.map((container: any, index: number) => (
              <tr key={`${container.dockerId}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <div
                      className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate"
                      title={container.name || container.dockerId}
                    >
                      {container.name || container.dockerId.slice(0, 12)}
                    </div>
                    {container.managedByPlatform && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 w-fit">
                        Managed
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-900 dark:text-gray-100 truncate" title={container.image || "N/A"}>
                    {container.image || "N/A"}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                      String(container.state).toLowerCase().includes("running")
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {container.state || "Unknown"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  <div
                    className="truncate"
                    title={Array.isArray(container.ports) && container.ports.length > 0
                      ? container.ports.map((p: any) => `${p.PublicPort || ''}${p.PublicPort ? ':' : ''}${p.PrivatePort}`).join(", ")
                      : "-"}
                  >
                    {Array.isArray(container.ports) && container.ports.length > 0
                      ? container.ports.slice(0, 2).map((p: any) => `${p.PublicPort || ''}${p.PublicPort ? ':' : ''}${p.PrivatePort}`).join(", ")
                      : "-"}
                    {container.ports?.length > 2 && ` +${container.ports.length - 2}`}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-medium">
                  <a
                    href={`/containers/${container.dockerId}?serverId=${encodeURIComponent(selected || "")}`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
