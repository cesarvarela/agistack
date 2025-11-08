/**
 * Converts a tRPC client subscription (callback-based) to an async generator.
 * This bridges the gap between tRPC's callback API and the new async generator pattern.
 */
export function subscriptionToAsyncGenerator<T>(
	subscribeCallback: (callbacks: {
		onData: (data: T) => void
		onError: (error: unknown) => void
		onComplete: () => void
	}) => { unsubscribe: () => void },
): AsyncGenerator<T> {
	return (async function* () {
		// Create a queue to bridge callback-based subscription to async generator
		const queue: Array<
			{ type: "data"; payload: T } | { type: "error"; payload: unknown } | { type: "complete" }
		> = []
		let resolveNext: ((value: boolean) => void) | null = null
		let isComplete = false

		const subscription = subscribeCallback({
			onData: (event) => {
				queue.push({ type: "data", payload: event })
				resolveNext?.(true)
				resolveNext = null
			},
			onError: (err) => {
				queue.push({ type: "error", payload: err })
				isComplete = true
				resolveNext?.(true)
				resolveNext = null
			},
			onComplete: () => {
				queue.push({ type: "complete" })
				isComplete = true
				resolveNext?.(true)
				resolveNext = null
			},
		})

		try {
			while (!isComplete || queue.length > 0) {
				// Wait for next event if queue is empty
				if (queue.length === 0) {
					await new Promise<boolean>((resolve) => {
						resolveNext = resolve
					})
				}

				const event = queue.shift()
				if (!event) continue

				if (event.type === "data") {
					yield event.payload
				} else if (event.type === "error") {
					throw event.payload
				} else if (event.type === "complete") {
					break
				}
			}
		} finally {
			subscription.unsubscribe()
		}
	})()
}
