/**
 * Containers Page
 * Lists containers for the selected server (environment)
 */

import { ContainersClient } from "./containers-client"

export default async function ContainersPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Containers</h1>
        <div />
      </div>
      <ContainersClient />
    </div>
  )
}
