/**
 * Type-Safe API Client
 * Hono RPC mounted in a single Next.js route
 */

import { hc } from "hono/client"
import type { ControlPlaneAppType } from "@agistack/control-plane-api/server"

function getBaseUrl() {
  const cpHttp = process.env.NEXT_PUBLIC_CP_HTTP_URL || "http://localhost:3002/api"
  return cpHttp
}

const API_URL = getBaseUrl()

export const api = hc<ControlPlaneAppType>(API_URL)

export type ApiClient = typeof api
