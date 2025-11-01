"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PanelRight } from "lucide-react"

export interface SidebarTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function SidebarTrigger({ className, ...props }: SidebarTriggerProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn("-ml-1", className)}
      {...props}
    >
      <PanelRight className="w-4 h-4" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}

