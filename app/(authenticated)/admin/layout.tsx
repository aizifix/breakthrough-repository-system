"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import AdminSidebar from "@/components/admin-sidebar"
import Navbar from "@/components/navbar"
import { cn } from "@/lib/utils"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<{ name?: string; email: string; role?: string; avatar?: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("adminSidebarCollapsed")
      return saved === "true"
    }
    return false
  })
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    const checkAuth = () => {
      const stored = localStorage.getItem("user")
      if (stored) {
        const userData = JSON.parse(stored)
        setUser(userData)
        if (userData.role !== "admin") {
          window.history.replaceState(null, "", "/")
          router.replace("/")
        }
      } else {
        window.history.replaceState(null, "", "/auth/login")
        router.replace("/auth/login")
      }
      setIsLoading(false)
    }

    checkAuth()

    const handleLogout = () => {
      setUser(null)
      window.history.replaceState(null, "", "/auth/login")
      router.replace("/auth/login")
    }

    const handleSidebarToggle = (e: CustomEvent) => {
      setIsSidebarCollapsed(e.detail.collapsed)
    }

    window.addEventListener("userLogout", handleLogout)
    window.addEventListener("sidebarToggle" as any, handleSidebarToggle as EventListener)

    return () => {
      window.removeEventListener("userLogout", handleLogout)
      window.removeEventListener("sidebarToggle" as any, handleSidebarToggle as EventListener)
    }
  }, [router, isMounted])

  useEffect(() => {
    if (!isMounted || !user) return

    const handlePopState = (event: PopStateEvent) => {
      const stored = localStorage.getItem("user")
      if (!stored) return
      window.history.pushState(null, "", window.location.href)
    }

    window.history.pushState(null, "", window.location.href)
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [user, isMounted])

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying session...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== "admin") {
    return null
  }

  const navbarUser = user && user.name
    ? {
        name: user.name,
        role: user.role || "publisher",
        avatar: user.avatar || user.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
      }
    : undefined

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 min-w-0",
          isSidebarCollapsed ? "ml-20" : "ml-72"
        )}
      >
        <div className="sticky top-0 z-30 bg-background">
          <Navbar user={navbarUser} hideLogo={true} />
        </div>
        <main className="flex-1 min-w-0 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
