/**
 * Control Plane Sidecar Server (HTTP + WebSocket)
 * - Mounts Control Plane RPC (Hono) under /api
 * - Provides WebSocket gateway under /ws with OperationManager
 */

import { serve } from "bun"
import { controlPlaneApp, OperationManager } from "@agistack/control-plane-api/server"
import { cors } from "hono/cors"

const HTTP_PORT = Number.parseInt(process.env.CONTROL_PLANE_PORT || "3002", 10)

// Use the controlPlaneApp directly; it already has basePath('/api')
const httpApp = controlPlaneApp
// Enable CORS for all API routes
httpApp.use("*", cors({
  origin: (origin) => origin ?? "*",
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["*"],
  exposeHeaders: ["*"],
  credentials: true,
}))

// Operation manager singleton
const ops = new OperationManager()

// Start server: route WS upgrades at /ws; everything else to Hono app
serve({
  port: HTTP_PORT,
  fetch(req, server) {
    const url = new URL(req.url)
    const { pathname } = url
    if (pathname === "/ws" && server.upgrade(req)) {
      return new Response(null, { status: 101 })
    }

    // CORS handling (preflight + response headers)
    const origin = req.headers.get("Origin") || "*"
    if (req.method === "OPTIONS") {
      const res = new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
          "Access-Control-Allow-Headers": req.headers.get("Access-Control-Request-Headers") || "*",
          "Access-Control-Allow-Credentials": "true",
          Vary: "Origin",
        },
      })
      return res
    }

    return httpApp.fetch(req).then((res) => {
      const h = new Headers(res.headers)
      h.set("Access-Control-Allow-Origin", origin)
      h.set("Access-Control-Allow-Credentials", "true")
      h.append("Vary", "Origin")
      return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h })
    })
  },
  websocket: {
    open(ws) {
      // no-op
    },
    async message(ws, message) {
      try {
        const msg = JSON.parse(typeof message === "string" ? message : Buffer.from(message as ArrayBuffer).toString("utf8"))
        if (msg?.type === "start_operation") {
          const { op, input } = msg
          const { opId } = await ops.start(op, input, (event) => {
            ws.send(JSON.stringify({ type: "operation_event", opId, event }))
          })
          ws.send(JSON.stringify({ type: "operation_started", opId, op }))
          return
        }
        if (msg?.type === "unsubscribe_op") {
          const { opId } = msg
          ops.unsubscribe(opId)
          ws.send(JSON.stringify({ type: "operation_unsubscribed", opId }))
          return
        }
        if (msg?.type === "cancel_operation") {
          const { opId } = msg
          await ops.cancel(opId)
          ws.send(JSON.stringify({ type: "operation_canceled", opId }))
          return
        }
      } catch (e) {
        console.error("WS message error", e)
        try {
          ws.send(JSON.stringify({ type: "error", message: e instanceof Error ? e.message : "Invalid message" }))
        } catch {}
      }
    },
    close() {
      // no-op
    },
  },
})

console.log(`✅ Control Plane Sidecar running at http://localhost:${HTTP_PORT}`)
console.log(`   HTTP RPC:     http://localhost:${HTTP_PORT}/api/...`)
console.log(`   WebSocket:    ws://localhost:${HTTP_PORT}/ws`)
