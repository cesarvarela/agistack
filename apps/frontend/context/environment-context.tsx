"use client"

import { usePathname } from "next/navigation"
import { createContext, useContext, useEffect, useMemo, useState } from "react"

type EnvId = string | null

export interface RuntimeConfig {
	controlPlanePort: number
	nodeSecret: string
	nodePort: number
}

interface EnvironmentContextValue {
	selected: EnvId
	ready: boolean
	runtimeConfig: RuntimeConfig
}

const EnvironmentContext = createContext<EnvironmentContextValue | undefined>(undefined)

export function EnvironmentProvider({
	children,
	runtimeConfig,
}: {
	children: React.ReactNode
	runtimeConfig: RuntimeConfig
}) {
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

		// List of reserved routes that are not environments
		const reservedRoutes = ["api", "settings"]

		const environment: EnvId =
			segments.length > 0 && firstSegment && !reservedRoutes.includes(firstSegment)
				? firstSegment
				: null

		setSelected(environment)
		setReady(true)
	}, [pathname])

	const value = useMemo<EnvironmentContextValue>(
		() => ({ selected, ready, runtimeConfig }),
		[selected, ready, runtimeConfig],
	)

	return <EnvironmentContext.Provider value={value}>{children}</EnvironmentContext.Provider>
}

export function useEnvironment() {
	const ctx = useContext(EnvironmentContext)
	if (!ctx) throw new Error("useEnvironment must be used within EnvironmentProvider")
	return ctx
}

export function useRuntimeConfig() {
	const ctx = useContext(EnvironmentContext)
	if (!ctx) throw new Error("useRuntimeConfig must be used within EnvironmentProvider")
	return ctx.runtimeConfig
}
