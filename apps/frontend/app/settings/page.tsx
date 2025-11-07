import type { Metadata } from "next"

export const metadata: Metadata = {
	title: "Settings",
}

export default function SettingsPage() {
	return (
		<div className="container mx-auto p-6">
			<div className="mb-6">
				<h1 className="text-3xl font-bold">Settings</h1>
				<p className="text-muted-foreground mt-2">Manage your global application settings.</p>
			</div>

			<div className="rounded-lg border bg-card p-6">
				<h3 className="font-semibold mb-2">Global Configuration</h3>
				<p className="text-sm text-muted-foreground">
					Global settings and configuration options will be available here.
				</p>
			</div>
		</div>
	)
}
