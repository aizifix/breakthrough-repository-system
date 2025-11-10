"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  FileText as SettingsIcon,
  ArrowLeft,
  Mail as BellIcon,
  Shield,
  Lock,
  Eye,
  X,
  Mail,
  Download as SaveIcon,
  User,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface UserSettings {
  email: string
  password?: string
  newPassword?: string
  confirmPassword?: string
  // Notification preferences
  emailNotifications: boolean
  repositoryUpdates: boolean
  comments: boolean
  // Privacy settings
  profileVisibility: "public" | "private" | "limited"
  showEmail: boolean
  showContact: boolean
  // Security
  twoFactorAuth: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [settings, setSettings] = useState<UserSettings>({
    email: "",
    password: "",
    newPassword: "",
    confirmPassword: "",
    emailNotifications: true,
    repositoryUpdates: true,
    comments: true,
    profileVisibility: "public",
    showEmail: false,
    showContact: false,
    twoFactorAuth: false,
  })

  // Load user and settings from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user")
      if (stored) {
        const userData = JSON.parse(stored)
        setUser(userData)

        // Load settings from localStorage
        const storedSettings = localStorage.getItem(`userSettings_${userData.email}`)
        if (storedSettings) {
          const savedSettings = JSON.parse(storedSettings)
          setSettings((prev) => ({
            ...prev,
            ...savedSettings,
            email: userData.email,
          }))
        } else {
          setSettings((prev) => ({
            ...prev,
            email: userData.email,
          }))
        }
      } else {
        router.push("/auth/login")
      }
      setIsLoading(false)
    }
  }, [router])

  const handleSettingChange = (field: keyof UserSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Validate password change if new password is provided
      if (settings.newPassword) {
        if (settings.newPassword.length < 8) {
          toast({
            title: "Error",
            description: "Password must be at least 8 characters long.",
            variant: "destructive",
          })
          setIsSaving(false)
          return
        }
        if (settings.newPassword !== settings.confirmPassword) {
          toast({
            title: "Error",
            description: "New password and confirm password do not match.",
            variant: "destructive",
          })
          setIsSaving(false)
          return
        }
      }

      // Save settings to localStorage (excluding password fields for security)
      const settingsToSave = {
        emailNotifications: settings.emailNotifications,
        repositoryUpdates: settings.repositoryUpdates,
        comments: settings.comments,
        profileVisibility: settings.profileVisibility,
        showEmail: settings.showEmail,
        showContact: settings.showContact,
        twoFactorAuth: settings.twoFactorAuth,
      }

      localStorage.setItem(`userSettings_${settings.email}`, JSON.stringify(settingsToSave))

      // Clear password fields after save
      setSettings((prev) => ({
        ...prev,
        password: "",
        newPassword: "",
        confirmPassword: "",
      }))

      toast({
        title: "Settings saved",
        description: "Your settings have been successfully updated.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

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
    return null
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/publisher">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Settings</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push("/publisher")}
          className="mb-6 gap-2"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <SettingsIcon size={32} className="text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Account Security */}
          <div className="bg-card border border-border rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <Shield size={20} className="text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Account Security</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium flex items-center gap-2">
                  <Mail size={16} />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  disabled
                  className="bg-muted border-border"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="current-password" className="text-foreground font-medium flex items-center gap-2">
                  <Lock size={16} />
                  Current Password
                </Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter current password"
                    value={settings.password || ""}
                    onChange={(e) => handleSettingChange("password", e.target.value)}
                    className="bg-input border-border pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <X size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-foreground font-medium">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password (min. 8 characters)"
                    value={settings.newPassword || ""}
                    onChange={(e) => handleSettingChange("newPassword", e.target.value)}
                    className="bg-input border-border pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <X size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-foreground font-medium">
                  Confirm New Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={settings.confirmPassword || ""}
                  onChange={(e) => handleSettingChange("confirmPassword", e.target.value)}
                  className="bg-input border-border"
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="space-y-0.5">
                  <Label htmlFor="two-factor" className="text-foreground font-medium">
                    Two-Factor Authentication
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Switch
                  id="two-factor"
                  checked={settings.twoFactorAuth}
                  onCheckedChange={(checked) => handleSettingChange("twoFactorAuth", checked)}
                />
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="bg-card border border-border rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <BellIcon size={20} className="text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Notification Preferences</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications" className="text-foreground font-medium">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="repository-updates" className="text-foreground font-medium">
                    Repository Updates
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about repository status changes
                  </p>
                </div>
                <Switch
                  id="repository-updates"
                  checked={settings.repositoryUpdates}
                  onCheckedChange={(checked) => handleSettingChange("repositoryUpdates", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="comments" className="text-foreground font-medium">
                    Comments & Interactions
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Notify me when someone comments on my repositories
                  </p>
                </div>
                <Switch
                  id="comments"
                  checked={settings.comments}
                  onCheckedChange={(checked) => handleSettingChange("comments", checked)}
                />
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="bg-card border border-border rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <User size={20} className="text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Privacy Settings</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-visibility" className="text-foreground font-medium">
                  Profile Visibility
                </Label>
                <Select
                  value={settings.profileVisibility}
                  onValueChange={(value) =>
                    handleSettingChange("profileVisibility", value as "public" | "private" | "limited")
                  }
                >
                  <SelectTrigger className="w-full bg-input border-border">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public - Anyone can view your profile</SelectItem>
                    <SelectItem value="limited">Limited - Only registered users can view</SelectItem>
                    <SelectItem value="private">Private - Only you can view</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-email" className="text-foreground font-medium">
                    Show Email Address
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Display your email on your public profile
                  </p>
                </div>
                <Switch
                  id="show-email"
                  checked={settings.showEmail}
                  onCheckedChange={(checked) => handleSettingChange("showEmail", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-contact" className="text-foreground font-medium">
                    Show Contact Information
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Display contact number and address on profile
                  </p>
                </div>
                <Switch
                  id="show-contact"
                  checked={settings.showContact}
                  onCheckedChange={(checked) => handleSettingChange("showContact", checked)}
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            >
              <SaveIcon size={20} />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
