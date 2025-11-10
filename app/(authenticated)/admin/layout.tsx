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
  const [user, setUser] = useState<{ name: string; email: string; role?: string; avatar?: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("adminSidebarCollapsed")
      return saved === "true"
    }
    return false
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user")
      if (stored) {
        const userData = JSON.parse(stored)
        setUser(userData)
        // Redirect if not admin
        if (userData.role !== "admin") {
          router.push("/")
        }
      } else {
        router.push("/auth/login")
      }
      setIsLoading(false)

      // Listen for sidebar toggle events
      const handleSidebarToggle = (e: CustomEvent) => {
        setIsSidebarCollapsed(e.detail.collapsed)
      }

      window.addEventListener("sidebarToggle" as any, handleSidebarToggle as EventListener)

      return () => {
        window.removeEventListener("sidebarToggle" as any, handleSidebarToggle as EventListener)
      }
    }
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== "admin") {
    return null
  }

  // Transform user for Navbar component
  const navbarUser = user
    ? {
        name: user.name,
        role: user.role,
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
          "flex-1 flex flex-col transition-all duration-300",
          isSidebarCollapsed ? "ml-16" : "ml-64"
        )}
      >
        {/* Navbar positioned after sidebar */}
        <div className="sticky top-0 z-30">
          <Navbar user={navbarUser} hideLogo={true} />
        </div>

        {/* Main content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
