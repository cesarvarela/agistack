/**
 * WebSocket React Hook
 * Manages WebSocket connection with automatic reconnection
 */

"use client"

import { useEffect, useRef, useState, useCallback } from "react"

type MessageHandler = (message: any) => void

interface UseWebSocketOptions {
	url?: string
	reconnect?: boolean
	reconnectInterval?: number
	reconnectAttempts?: number
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
	const {
		url = typeof window !== "undefined"
			? (process.env.NEXT_PUBLIC_CP_WS_URL || "ws://localhost:3002/ws")
			: (process.env.NEXT_PUBLIC_CP_WS_URL || "ws://localhost:3002/ws"),
		reconnect = true,
		reconnectInterval = 3000,
		reconnectAttempts = 10,
	} = options

	const [isConnected, setIsConnected] = useState(false)
	const [reconnectCount, setReconnectCount] = useState(0)
	const wsRef = useRef<WebSocket | null>(null)
	const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
	const messageHandlersRef = useRef<Map<string, Set<MessageHandler>>>(new Map())

	// Connect to WebSocket
	const connect = useCallback(() => {
		if (wsRef.current?.readyState === WebSocket.OPEN) {
			return
		}

		try {
			const ws = new WebSocket(url)

			ws.onopen = () => {
				console.log("WebSocket connected")
				setIsConnected(true)
				setReconnectCount(0)
			}

			ws.onmessage = (event) => {
				try {
					const message = JSON.parse(event.data)
					const handlers = messageHandlersRef.current.get(message.type)
					if (handlers) {
						for (const handler of handlers) {
							handler(message)
						}
					}
					// Also call handlers for '*' (all messages)
					const allHandlers = messageHandlersRef.current.get("*")
					if (allHandlers) {
						for (const handler of allHandlers) {
							handler(message)
						}
					}
				} catch (error) {
					console.error("Failed to parse WebSocket message:", error)
				}
			}

			ws.onclose = () => {
				console.log("WebSocket disconnected")
				setIsConnected(false)

				// Attempt reconnection
				if (reconnect && reconnectCount < reconnectAttempts) {
					reconnectTimeoutRef.current = setTimeout(() => {
						console.log(`Reconnecting... (${reconnectCount + 1}/${reconnectAttempts})`)
						setReconnectCount((prev) => prev + 1)
						connect()
					}, reconnectInterval)
				}
			}

			ws.onerror = (error) => {
				console.error("WebSocket error:", error)
			}

			wsRef.current = ws
		} catch (error) {
			console.error("Failed to connect WebSocket:", error)
		}
	}, [url, reconnect, reconnectInterval, reconnectAttempts, reconnectCount])

	// Disconnect from WebSocket
	const disconnect = useCallback(() => {
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current)
		}
		if (wsRef.current) {
			wsRef.current.close()
			wsRef.current = null
		}
		setIsConnected(false)
	}, [])

	// Send message to server
	const send = useCallback((message: any) => {
		if (wsRef.current?.readyState === WebSocket.OPEN) {
			wsRef.current.send(JSON.stringify(message))
		} else {
			console.warn("WebSocket is not connected")
		}
	}, [])

	// Register message handler
	const on = useCallback((type: string, handler: MessageHandler) => {
		if (!messageHandlersRef.current.has(type)) {
			messageHandlersRef.current.set(type, new Set())
		}
		messageHandlersRef.current.get(type)?.add(handler)

		// Return unsubscribe function
		return () => {
			messageHandlersRef.current.get(type)?.delete(handler)
		}
	}, [])

	// Connect on mount, disconnect on unmount
	useEffect(() => {
		connect()
		return () => {
			disconnect()
		}
	}, [connect, disconnect])

	return {
		isConnected,
		send,
		on,
		connect,
		disconnect,
	}
}
