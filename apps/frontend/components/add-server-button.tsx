"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api-client"

export function AddServerButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("Test Agent")
  const [agentUrl, setAgentUrl] = useState("http://localhost:3001")
  const [type, setType] = useState<"remote" | "local">("remote")
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await api.servers.$post({ json: { name, agentUrl, type } })
      if (!res.ok) {
        let message = "Failed to add server"
        try {
          const data = await res.json()
          message = data?.error || message
        } catch {}
        setError(message)
        setLoading(false)
        return
      }
      // Optionally test connection to update status
      try {
        const created = await res.json()
        const serverId = created?.server?.id
        if (serverId) {
          await api.servers["info"].$get({ query: { serverId } })
        }
      } catch {}
      setOpen(false)
      setLoading(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add server")
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Add Server</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Server / Agent</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Production Agent" />
          </div>
          <div>
            <label className="block text-sm mb-1">Agent URL</label>
            <Input
              value={agentUrl}
              onChange={(e) => setAgentUrl(e.target.value)}
              required
              placeholder="http://agent.example.com:3001"
            />
            <p className="text-xs text-gray-500 mt-1">HTTP base for the stateless agent’s /exec endpoint</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm">Type:</label>
            <button
              type="button"
              onClick={() => setType("remote")}
              className={`px-2 py-1 rounded text-sm ${
                type === "remote" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              Remote
            </button>
            <button
              type="button"
              onClick={() => setType("local")}
              className={`px-2 py-1 rounded text-sm ${
                type === "local" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              Local
            </button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Server"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
