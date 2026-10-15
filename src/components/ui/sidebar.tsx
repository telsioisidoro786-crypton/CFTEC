"use client"

import * as React from "react"
import { cn } from "../../lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet"
import { Separator } from "./separator"
import { Button } from "./button"

interface SidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function Sidebar({ open, onOpenChange, children }: SidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-72 p-0 lg:w-64 lg:static lg:hidden lg:shadow-none lg:border-r lg:bg-background h-full">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-lg font-heading">Menu</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </SheetContent>
    </Sheet>
  )
}

interface SidebarMenuProps {
  className?: string
  children: React.ReactNode
}

export function SidebarMenu({ className, children }: SidebarMenuProps) {
  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {children}
    </nav>
  )
}

interface SidebarMenuItemProps {
  asChild?: boolean
  isActive?: boolean
  className?: string
  children: React.ReactNode
  onClick?: () => void
}

export function SidebarMenuItem({ asChild = false, isActive, className, children, onClick, ...props }: SidebarMenuItemProps) {
  return (
    <Button
      asChild={asChild}
      variant={isActive ? "default" : "ghost"}
      className={cn(
        "w-full justify-start gap-3 text-sm font-medium",
        isActive && "bg-primary text-primary-foreground shadow-sm",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </Button>
  )
}

interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  isActive?: boolean
}

export function SidebarMenuButton({ asChild = false, isActive, className, children, ...props }: SidebarMenuButtonProps) {
  return (
    <Button
      asChild={asChild}
      variant={isActive ? "default" : "ghost"}
      className={cn(
        "w-full justify-start gap-3 text-sm font-medium",
        isActive && "bg-primary text-primary-foreground shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}

interface SidebarGroupProps {
  label?: string
  children: React.ReactNode
}

export function SidebarGroup({ label, children }: SidebarGroupProps) {
  return (
    <div className="space-y-1">
      {label && (
        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </div>
      )}
      {children}
    </div>
  )
}

export { Separator }