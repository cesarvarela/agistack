"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEnvironment } from "@/context/environment-context"
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Fragment } from "react"

interface BreadcrumbSegment {
	label: string
	href?: string
}

export function Breadcrumbs() {
	const pathname = usePathname()
	const { selected } = useEnvironment()

	const segments = generateBreadcrumbs(pathname, selected)

	if (segments.length === 0) {
		return null
	}

	return (
		<Breadcrumb>
			<BreadcrumbList>
				{segments.map((segment, index) => {
					const isLast = index === segments.length - 1

					return (
						<Fragment key={segment.href || segment.label}>
							<BreadcrumbItem>
								{isLast ? (
									<BreadcrumbPage>{segment.label}</BreadcrumbPage>
								) : segment.href ? (
									<BreadcrumbLink asChild>
										<Link href={segment.href}>{segment.label}</Link>
									</BreadcrumbLink>
								) : (
									<span className="text-muted-foreground">{segment.label}</span>
								)}
							</BreadcrumbItem>
							{!isLast && <BreadcrumbSeparator />}
						</Fragment>
					)
				})}
			</BreadcrumbList>
		</Breadcrumb>
	)
}

function generateBreadcrumbs(pathname: string, environment: string | null): BreadcrumbSegment[] {
	const segments: BreadcrumbSegment[] = []
	const pathParts = pathname.split("/").filter(Boolean)

	// Always start with Home
	segments.push({ label: "Home", href: "/" })

	// Handle special routes
	if (pathParts[0] === "settings") {
		segments.push({ label: "Settings" })
		return segments
	}

	// Handle environment-based routes
	if (environment && pathParts.length > 0) {
		// Add environment
		segments.push({
			label: environment,
			href: `/${environment}/dashboard`,
		})

		// Handle sub-routes
		if (pathParts.length > 1) {
			const subRoute = pathParts[1]

			switch (subRoute) {
				case "dashboard":
					segments.push({ label: "Dashboard" })
					break

				case "containers":
					if (pathParts.length === 2) {
						// On containers list page
						segments.push({ label: "Containers" })
					} else {
						// On container detail page
						segments.push({
							label: "Containers",
							href: `/${environment}/containers`,
						})

						// Container detail
						if (pathParts.length > 2 && pathParts[2]) {
							const containerId = pathParts[2]
							// We don't have container name here, so just use the ID
							segments.push({ label: containerId })
						}
					}
					break

				default:
					// Generic sub-route handling
					if (subRoute) {
						segments.push({ label: capitalizeFirst(subRoute) })
					}
					break
			}
		}
	}

	return segments
}

function capitalizeFirst(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1)
}
