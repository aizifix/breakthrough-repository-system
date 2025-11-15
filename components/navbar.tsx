"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Menu, X, User, Settings, LogOut, Bookmark, FolderOpen, Plus, Bell } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { getNotifications, getUnreadCount, markNotificationAsRead, markAllNotificationsAsRead } from "@/app/config/api"

interface Notification {
  id: string | number
  title: string
  message: string
  time: string
  read: boolean
  type?: "info" | "success" | "warning" | "error" | "announcement"
  related_id?: number
  related_type?: string
}

export default function Navbar({
  user,
  hideLogo = false
}: {
  user?: { name: string; avatar?: string; role?: string }
  hideLogo?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()

  // Load notifications from API
  useEffect(() => {
    if (typeof window !== "undefined" && user) {
      loadNotifications()
      loadUnreadCount()

      // Refresh notifications every 30 seconds
      const interval = setInterval(() => {
        loadNotifications()
        loadUnreadCount()
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [user])

  const loadNotifications = async () => {
    if (!user) return

    try {
      // Get user ID from localStorage
      const stored = localStorage.getItem("user")
      if (!stored) return

      const userData = JSON.parse(stored)
      const userId = userData.userId || userData.user_id
      if (!userId) return

      const response = await getNotifications(userId, false)
      if (response.status === "success" && response.data) {
        setNotifications(response.data.map((notif: any) => ({
          id: notif.id,
          title: notif.title,
          message: notif.message,
          time: notif.time,
          read: notif.read,
          type: notif.type || "info",
          related_id: notif.related_id,
          related_type: notif.related_type,
        })))
      }
    } catch (error) {
      console.error("Error loading notifications:", error)
    }
  }

  const loadUnreadCount = async () => {
    if (!user) return

    try {
      const stored = localStorage.getItem("user")
      if (!stored) return

      const userData = JSON.parse(stored)
      const userId = userData.userId || userData.user_id
      if (!userId) return

      const response = await getUnreadCount(userId)
      if (response.status === "success") {
        setUnreadCount(response.count || 0)
      }
    } catch (error) {
      console.error("Error loading unread count:", error)
    }
  }

  const markAsRead = async (id: string | number) => {
    if (!user) return

    try {
      const stored = localStorage.getItem("user")
      if (!stored) return

      const userData = JSON.parse(stored)
      const userId = userData.userId || userData.user_id
      if (!userId) return

      await markNotificationAsRead(Number(id), userId)

      // Update local state
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    if (!user) return

    try {
      const stored = localStorage.getItem("user")
      if (!stored) return

      const userData = JSON.parse(stored)
      const userId = userData.userId || userData.user_id
      if (!userId) return

      await markAllNotificationsAsRead(userId)

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("Error marking all as read:", error)
    }
  }

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user")
      // Clear all user-related data
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith("savedRepositories_") || key.startsWith("notifications_") || key.startsWith("adminAnnouncements")) {
          localStorage.removeItem(key)
        }
      })
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event("userLogout"))
      // Replace history to prevent back button navigation
      window.history.replaceState(null, "", "/")
      router.push("/")
      // Force a refresh to update the UI
      setTimeout(() => {
        router.refresh()
      }, 100)
    }
  }

  return (
    <nav className="sticky top-0 z-50 w-full bg-card border-b border-border h-16 flex items-center">
      <div className={cn(
        "mx-auto w-full",
        hideLogo ? "px-4" : "max-w-7xl px-4 sm:px-6 lg:px-8"
      )}>
        <div className="flex justify-between items-center h-full">
          {/* Logo */}
          {!hideLogo && (
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <span className="text-accent-foreground text-sm font-bold">BT</span>
              </div>
              Breakthrough
            </Link>
          )}
          {hideLogo && <div className="flex-1"></div>}

          {/* Desktop Menu */}
          {!user && (
            <div className="hidden md:flex items-center gap-1">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  Home
                </Button>
              </Link>
              <Link href="/repositories">
                <Button variant="ghost" size="sm">
                  Repositories
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="ghost" size="sm">
                  About
                </Button>
              </Link>
            </div>
          )}

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                {/* Notification Button */}
                <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="relative"
                      aria-label="Notifications"
                    >
                      <Bell size={20} />
                      {unreadCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80 p-0">
                    <div className="flex items-center justify-between p-4 border-b border-border">
                      <h3 className="font-semibold text-foreground">Notifications</h3>
                      {unreadCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={markAllAsRead}
                          className="text-xs h-7"
                        >
                          Mark all as read
                        </Button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                          <Bell size={32} className="mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No notifications</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-border">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className="p-4 hover:bg-muted/50 cursor-pointer transition-colors bg-background"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                    !notification.read
                                      ? notification.type === "success"
                                        ? "bg-blue-500"
                                        : notification.type === "error"
                                          ? "bg-red-500"
                                          : notification.type === "warning"
                                            ? "bg-yellow-500"
                                            : "bg-blue-500"
                                      : "bg-transparent"
                                  }`}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground">
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {notification.time}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-3 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg px-2 py-1">
                      <div className="flex flex-col items-start">
                        <span className="text-sm text-foreground font-medium">{user.name}</span>
                        {user.role === "publisher" && (
                          <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                            Publisher
                          </span>
                        )}
                        {user.role === "admin" && (
                          <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-sm font-semibold">
                        {user.avatar || user.name.charAt(0)}
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/publisher/profile" className="flex items-center gap-2">
                        <User size={16} />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/publisher/saved-repository" className="flex items-center gap-2">
                        <Bookmark size={16} />
                        Saved Repository
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/publisher/my-repository" className="flex items-center gap-2">
                        <FolderOpen size={16} />
                        My Repository
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/publisher/settings" className="flex items-center gap-2">
                        <Settings size={16} />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} variant="destructive" className="flex items-center gap-2">
                      <LogOut size={16} />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="outline" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {!user && (
              <>
                <Link href="/">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    Home
                  </Button>
                </Link>
                <Link href="/repositories">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    Repositories
                  </Button>
                </Link>
                <Link href="/about">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    About
                  </Button>
                </Link>
              </>
            )}
            <div className={`${!user ? 'pt-2 border-t border-border' : ''} space-y-2`}>
              {user ? (
                <>
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{user.name}</p>
                    {user.role === "publisher" && (
                      <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium inline-block mt-1">
                        Publisher
                      </span>
                    )}
                    {user.role === "admin" && (
                      <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium inline-block mt-1">
                        Admin
                      </span>
                    )}
                  </div>
                  {/* Mobile Notification Button */}
                  <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 relative"
                        aria-label="Notifications"
                      >
                        <Bell size={16} />
                        Notifications
                        {unreadCount > 0 && (
                          <Badge
                            variant="destructive"
                            className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs"
                          >
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </Badge>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-80 p-0">
                      <div className="flex items-center justify-between p-4 border-b border-border">
                        <h3 className="font-semibold text-foreground">Notifications</h3>
                        {unreadCount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllAsRead}
                            className="text-xs h-7"
                          >
                            Mark all as read
                          </Button>
                        )}
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-muted-foreground">
                            <Bell size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No notifications</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-border">
                            {notifications.map((notification) => (
                              <div
                                key={notification.id}
                                className="p-4 hover:bg-muted/50 cursor-pointer transition-colors bg-background"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                      !notification.read
                                        ? notification.type === "success"
                                          ? "bg-blue-500"
                                          : notification.type === "error"
                                            ? "bg-red-500"
                                            : notification.type === "warning"
                                              ? "bg-yellow-500"
                                              : "bg-blue-500"
                                        : "bg-transparent"
                                    }`}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground">
                                      {notification.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                      {notification.time}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Link href="/publisher/profile">
                    <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                      <User size={16} />
                      Profile
                    </Button>
                  </Link>
                  <Link href="/publisher/saved-repository">
                    <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                      <Bookmark size={16} />
                      Saved Repository
                    </Button>
                  </Link>
                  <Link href="/publisher/my-repository">
                    <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                      <FolderOpen size={16} />
                      My Repository
                    </Button>
                  </Link>
                  <Link href="/publisher/settings">
                    <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                      <Settings size={16} />
                      Settings
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      Login
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
