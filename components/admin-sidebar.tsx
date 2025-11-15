"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Megaphone,
  Users,
  ShieldCheck,
  FileText,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Announcements",
    href: "/admin/announcements",
    icon: Megaphone,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Moderation",
    href: "/admin/moderation",
    icon: ShieldCheck,
  },
  {
    title: "Publishers",
    href: "/admin/publishers",
    icon: FileText,
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
  },
]

export default function AdminSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("adminSidebarCollapsed")
      return saved === "true"
    }
    return false
  })
  const pathname = usePathname()

  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    if (typeof window !== "undefined") {
      localStorage.setItem("adminSidebarCollapsed", String(newState))
      // Dispatch event to update main content margin
      window.dispatchEvent(new CustomEvent("sidebarToggle", { detail: { collapsed: newState } }))
    }
  }

  // Expose toggle function globally for navbar access
  useEffect(() => {
    if (typeof window !== "undefined") {
      ;(window as any).adminSidebarToggle = toggleSidebar
      return () => {
        delete (window as any).adminSidebarToggle
      }
    }
  }, [isCollapsed])

  useEffect(() => {
    // Dispatch initial state
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sidebarToggle", { detail: { collapsed: isCollapsed } }))
    }
  }, [])

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo section */}
          <div className="h-16 border-b border-border flex items-center justify-center px-4 flex-shrink-0">
            <div className={cn("flex items-center gap-2", isCollapsed && "justify-center w-full")}>
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <span className="text-accent-foreground text-sm font-bold">BT</span>
              </div>
              {!isCollapsed && (
                <span className="font-bold text-xl text-primary">Breakthrough</span>
              )}
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 h-10",
                      isCollapsed && "justify-center px-0",
                      isActive && "bg-accent text-accent-foreground"
                    )}
                    title={isCollapsed ? item.title : undefined}
                  >
                    <Icon size={20} className={cn("flex-shrink-0", isCollapsed && "mx-auto")} />
                    {!isCollapsed && <span className="truncate">{item.title}</span>}
                  </Button>
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* Toggle Button - Positioned on the border */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleSidebar}
        className={cn(
          "fixed z-50 h-8 w-8 p-0 rounded-full bg-card border border-border shadow-sm hover:bg-accent transition-all duration-300",
          "top-1/2 -translate-y-1/2",
          isCollapsed ? "left-[48px]" : "left-[240px]"
        )}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>
    </>
  )
}
