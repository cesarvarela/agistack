"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"

type EnvId = string | null

interface EnvironmentContextValue {
  selected: EnvId
  setSelected: (id: EnvId) => void
  ready: boolean
}

const EnvironmentContext = createContext<EnvironmentContextValue | undefined>(undefined)

const STORAGE_KEY = "ag_env"

export function EnvironmentProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelectedState] = useState<EnvId>(null)
  const [ready, setReady] = useState(false)

  const sp = useSearchParams()

  // Initialize from URL or storage on mount; keep in sync with URL
  useEffect(() => {
    try {
      const id = sp?.get("serverId")
      if (id && id !== "none") {
        setSelectedState(id)
      } else {
        const stored = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
        setSelectedState(stored && stored !== "none" ? stored : null)
      }
    } catch {
      setSelectedState(null)
    } finally {
      setReady(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp])

  const setSelected = useCallback((id: EnvId) => {
    setSelectedState(id)
    try {
      const v = id ?? "none"
      if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, v)
    } catch {}
  }, [])

  const value = useMemo<EnvironmentContextValue>(() => ({ selected, setSelected, ready }), [selected, setSelected, ready])

  return <EnvironmentContext.Provider value={value}>{children}</EnvironmentContext.Provider>
}

export function useEnvironment() {
  const ctx = useContext(EnvironmentContext)
  if (!ctx) throw new Error("useEnvironment must be used within EnvironmentProvider")
  return ctx
}
