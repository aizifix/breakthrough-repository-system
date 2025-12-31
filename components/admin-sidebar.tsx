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
  BarChart,
  ChevronLeft,
  ChevronRight,
  Crown,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  badge?: number
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Announcements", href: "/admin/announcements", icon: Megaphone },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Moderation", href: "/admin/moderation", icon: ShieldCheck, badge: 3 },
  { title: "Publishers", href: "/admin/publishers", icon: FileText },
  { title: "Reports", href: "/admin/reports", icon: BarChart },
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
      window.dispatchEvent(new CustomEvent("sidebarToggle", { detail: { collapsed: newState } }))
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      ;(window as any).adminSidebarToggle = toggleSidebar
      return () => {
        delete (window as any).adminSidebarToggle
      }
    }
  }, [isCollapsed])

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sidebarToggle", { detail: { collapsed: isCollapsed } }))
    }
  }, [])

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-gradient-to-b from-card to-card/80 border-r border-border transition-all duration-300 shadow-xl",
          isCollapsed ? "w-20" : "w-72"
        )}
      >
        <div className="flex flex-col h-full">
          <div className={cn(
            "h-16 border-b border-border/50 flex items-center px-4 flex-shrink-0 bg-gradient-to-r from-primary/5 to-transparent",
            isCollapsed && "justify-center px-2"
          )}>
            <div className={cn("flex items-center gap-3", isCollapsed && "justify-center w-full")}>
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-primary-foreground text-sm font-bold">BT</span>
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="font-bold text-base text-foreground">Breakthrough</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Crown size={10} className="text-amber-500" />
                    Admin Panel
                  </span>
                </div>
              )}
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 h-11 px-3 transition-all duration-200",
                      isCollapsed && "justify-center px-0",
                      isActive && "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/10",
                      !isActive && "hover:bg-accent hover:text-accent-foreground"
                    )}
                    title={isCollapsed ? item.title : undefined}
                  >
                    <Icon size={18} className={cn("flex-shrink-0", isCollapsed && "mx-auto")} />
                    {!isCollapsed && (
                      <>
                        <span className="truncate flex-1 text-left">{item.title}</span>
                        {item.badge && (
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary"
                          )}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Button>
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>

      <Button
        variant="outline"
        size="sm"
        onClick={toggleSidebar}
        className={cn(
          "fixed z-50 h-8 w-8 p-0 rounded-lg bg-card border border-border shadow-md hover:bg-accent transition-all duration-300",
          "top-1/2 -translate-y-1/2",
          isCollapsed ? "left-[64px]" : "left-[264px]"
        )}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight size={14} className="text-muted-foreground" />
        ) : (
          <ChevronLeft size={14} className="text-muted-foreground" />
        )}
      </Button>
    </>
  )
}
