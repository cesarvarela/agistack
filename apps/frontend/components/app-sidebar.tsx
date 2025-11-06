"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, LayoutDashboard, Box, Settings } from "lucide-react"
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar"
import { useEnvironment } from "@/context/environment-context"

export function AppSidebar() {
	const pathname = usePathname()
	const { selected } = useEnvironment()

	// Always visible items
	const globalItems = [
		{
			title: "Home",
			url: "/",
			icon: Home,
		},
	]

	// Environment-dependent items (only shown when environment is selected)
	const environmentItems = selected
		? [
				{
					title: "Dashboard",
					url: `/${selected}/dashboard`,
					icon: LayoutDashboard,
				},
				{
					title: "Containers",
					url: `/${selected}/containers`,
					icon: Box,
				},
			]
		: []

	// Admin items (always visible)
	const adminItems = [
		{
			title: "Settings",
			url: "/settings",
			icon: Settings,
		},
	]

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild>
							<Link href="/">
								<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
									<span className="font-bold text-lg">A</span>
								</div>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-semibold">AGIStack</span>
								</div>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				{/* Home navigation */}
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{globalItems.map((item) => {
								const isActive = pathname === item.url
								return (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
											<Link href={item.url}>
												<item.icon />
												<span>{item.title}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								)
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				{/* Environment-dependent navigation (only shown when environment is selected) */}
				{environmentItems.length > 0 && (
					<SidebarGroup>
						<SidebarGroupLabel>Environment</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{environmentItems.map((item) => {
									const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`)
									return (
										<SidebarMenuItem key={item.title}>
											<SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
												<Link href={item.url}>
													<item.icon />
													<span>{item.title}</span>
												</Link>
											</SidebarMenuButton>
										</SidebarMenuItem>
									)
								})}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				)}

				{/* Admin navigation */}
				<SidebarGroup>
					<SidebarGroupLabel>Admin</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{adminItems.map((item) => {
								const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`)
								return (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
											<Link href={item.url}>
												<item.icon />
												<span>{item.title}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								)
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarRail />
		</Sidebar>
	)
}
