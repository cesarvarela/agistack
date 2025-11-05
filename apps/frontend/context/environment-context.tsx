"use client"

import { usePathname } from "next/navigation"
import { createContext, useContext, useEffect, useMemo, useState } from "react"

type EnvId = string | null

interface EnvironmentContextValue {
	selected: EnvId
	ready: boolean
}

const EnvironmentContext = createContext<EnvironmentContextValue | undefined>(undefined)

export function EnvironmentProvider({ children }: { children: React.ReactNode }) {
	const [selected, setSelected] = useState<EnvId>(null)
	const [ready, setReady] = useState(false)

	const pathname = usePathname()

	// Extract environment from pathname (e.g., /prod/containers → prod)
	useEffect(() => {
		if (!pathname) {
			setSelected(null)
			setReady(true)
			return
		}

		const segments = pathname.split("/").filter(Boolean)
		const firstSegment = segments[0]
		const environment: EnvId =
			segments.length > 0 && firstSegment && firstSegment !== "api" ? firstSegment : null

		setSelected(environment)
		setReady(true)
	}, [pathname])

	const value = useMemo<EnvironmentContextValue>(() => ({ selected, ready }), [selected, ready])

	return <EnvironmentContext.Provider value={value}>{children}</EnvironmentContext.Provider>
}

export function useEnvironment() {
	const ctx = useContext(EnvironmentContext)
	if (!ctx) throw new Error("useEnvironment must be used within EnvironmentProvider")
	return ctx
}
