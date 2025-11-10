"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Navbar from "@/components/navbar"
import { Toaster } from "@/components/ui/toaster"

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<{ name: string; email: string; role?: string; avatar?: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Check if we're on an admin page
  const isAdminPage = pathname?.startsWith("/admin")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const loadUser = () => {
        const stored = localStorage.getItem("user")
        if (stored) {
          const userData = JSON.parse(stored)
          setUser(userData)
        } else {
          // No user found, redirect to login
          router.push("/auth/login")
        }
        setIsLoading(false)
      }

      loadUser()

      // Listen for storage changes
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "user") {
          loadUser()
        }
      }

      // Listen for custom logout event
      const handleLogout = () => {
        loadUser()
      }

      window.addEventListener("storage", handleStorageChange)
      window.addEventListener("userLogout", handleLogout)

      return () => {
        window.removeEventListener("storage", handleStorageChange)
        window.removeEventListener("userLogout", handleLogout)
      }
    }
  }, [router])

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

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Only show navbar if not on admin page (admin layout has its own navbar) */}
      {!isAdminPage && <Navbar user={navbarUser} />}
      {children}
      <Toaster />
    </div>
  )
}
