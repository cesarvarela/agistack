"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { api } from "@/lib/api-client"
import { useEnvironment } from "@/context/environment-context"

interface ServerItem {
  id: string
  name: string
  status?: "online" | "offline" | "error"
}

export function EnvironmentSelector() {
  const { selected, setSelected, ready } = useEnvironment()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const [servers, setServers] = useState<ServerItem[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    let canceled = false
    async function load() {
      setLoading(true)
      try {
        const res = await api.servers.$get()
        if (!canceled && res.ok) {
          const data = await res.json()
          setServers((data?.servers || []) as ServerItem[])
        }
      } finally {
        if (!canceled) setLoading(false)
      }
    }
    load()
    return () => {
      canceled = true
    }
  }, [])

  const onPick = (id: string | null) => {
    setSelected(id)
    // Keep URL param in sync for better shareability
    const url = new URL(window.location.href)
    if (id) url.searchParams.set("serverId", id)
    else url.searchParams.delete("serverId")
    router.replace(url.pathname + (url.search ? `?${url.searchParams.toString()}` : ""))
  }

  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Environment:</span>
        <div className="h-6 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">Environment:</span>
      <div className="flex gap-1">
        <button
          onClick={() => onPick(null)}
          className={`px-2 py-1 rounded text-sm ${
            selected === null ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          }`}
          title="No environment selected"
        >
          None
        </button>
        {servers.map((s) => (
          <button
            key={s.id}
            onClick={() => onPick(s.id)}
            className={`px-2 py-1 rounded text-sm inline-flex items-center gap-2 ${
              selected === s.id ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            }`}
            title={s.name}
          >
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                s.status === "online" ? "bg-green-500" : s.status === "error" ? "bg-red-500" : "bg-gray-400"
              }`}
            />
            <span>{s.name}</span>
          </button>
        ))}
      </div>
      {loading && <span className="text-xs text-gray-400">Loading...</span>}
    </div>
  )
}
