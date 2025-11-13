import { Loader2 } from "lucide-react"

export function PageLoading() {
	return (
		<div className="flex h-full w-full items-center justify-center">
			<div className="flex flex-col items-center gap-2">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				<p className="text-sm text-muted-foreground">Loading...</p>
			</div>
		</div>
	)
}
