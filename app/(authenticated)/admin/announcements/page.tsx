"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  FileText as Megaphone,
  Plus,
  FileText,
  Trash2,
  Eye,
  X,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface Announcement {
  id: string
  title: string
  content: string
  published: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
}

export default function AnnouncementsPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; email: string; role?: string } | null>(null)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    published: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user")
      if (stored) {
        const userData = JSON.parse(stored)
        setUser(userData)
        if (userData.role !== "admin") {
          router.push("/")
        }
      } else {
        router.push("/auth/login")
      }
      loadAnnouncements()
    }
  }, [router])

  const loadAnnouncements = () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("adminAnnouncements")
      if (stored) {
        setAnnouncements(JSON.parse(stored))
      } else {
        // Sample announcements
        const sampleAnnouncements: Announcement[] = [
          {
            id: "1",
            title: "Welcome to Breakthrough Research Repository",
            content: "We're excited to announce the launch of our new research repository platform. Share and discover cutting-edge research across multiple disciplines.",
            published: true,
            createdAt: "2024-01-15T10:00:00Z",
            updatedAt: "2024-01-15T10:00:00Z",
            createdBy: "Admin",
          },
          {
            id: "2",
            title: "New Feature: Enhanced Search Capabilities",
            content: "We've improved our search functionality with advanced filters and keyword matching. Try it out and let us know what you think!",
            published: true,
            createdAt: "2024-02-01T14:30:00Z",
            updatedAt: "2024-02-01T14:30:00Z",
            createdBy: "Admin",
          },
          {
            id: "3",
            title: "Maintenance Scheduled for Next Week",
            content: "We will be performing scheduled maintenance on March 15th from 2 AM to 4 AM EST. The platform will be temporarily unavailable during this time.",
            published: false,
            createdAt: "2024-03-10T09:00:00Z",
            updatedAt: "2024-03-10T09:00:00Z",
            createdBy: "Admin",
          },
        ]
        setAnnouncements(sampleAnnouncements)
        localStorage.setItem("adminAnnouncements", JSON.stringify(sampleAnnouncements))
      }
    }
  }

  const handleOpenDialog = (announcement?: Announcement) => {
    if (announcement) {
      setIsEditMode(true)
      setEditingAnnouncement(announcement)
      setFormData({
        title: announcement.title,
        content: announcement.content,
        published: announcement.published,
      })
    } else {
      setIsEditMode(false)
      setEditingAnnouncement(null)
      setFormData({
        title: "",
        content: "",
        published: false,
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setIsEditMode(false)
    setEditingAnnouncement(null)
    setFormData({
      title: "",
      content: "",
      published: false,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!formData.title.trim() || !formData.content.trim()) {
        alert("Please fill in all required fields")
        setIsSubmitting(false)
        return
      }

      const now = new Date().toISOString()

      if (isEditMode && editingAnnouncement) {
        // Update existing announcement
        const updated = announcements.map((ann) =>
          ann.id === editingAnnouncement.id
            ? {
                ...ann,
                title: formData.title.trim(),
                content: formData.content.trim(),
                published: formData.published,
                updatedAt: now,
              }
            : ann
        )
        setAnnouncements(updated)
        localStorage.setItem("adminAnnouncements", JSON.stringify(updated))
      } else {
        // Create new announcement
        const newAnnouncement: Announcement = {
          id: Date.now().toString(),
          title: formData.title.trim(),
          content: formData.content.trim(),
          published: formData.published,
          createdAt: now,
          updatedAt: now,
          createdBy: user?.name || "Admin",
        }
        const updated = [...announcements, newAnnouncement]
        setAnnouncements(updated)
        localStorage.setItem("adminAnnouncements", JSON.stringify(updated))
      }

      handleCloseDialog()
    } catch (error) {
      alert("Failed to save announcement. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      const updated = announcements.filter((ann) => ann.id !== id)
      setAnnouncements(updated)
      localStorage.setItem("adminAnnouncements", JSON.stringify(updated))
    }
  }

  const handleTogglePublish = (id: string) => {
    const updated = announcements.map((ann) =>
      ann.id === id
        ? {
            ...ann,
            published: !ann.published,
            updatedAt: new Date().toISOString(),
          }
        : ann
    )
    setAnnouncements(updated)
    localStorage.setItem("adminAnnouncements", JSON.stringify(updated))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Megaphone className="text-primary" size={28} />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Announcements</h1>
                <p className="text-muted-foreground">
                  Manage system-wide announcements and notifications
                </p>
              </div>
            </div>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            >
              <Plus size={20} />
              Create Announcement
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Announcements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{announcements.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Published
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {announcements.filter((a) => a.published).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Drafts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {announcements.filter((a) => !a.published).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Announcements Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Announcements</CardTitle>
            <CardDescription>
              View and manage all system announcements
            </CardDescription>
          </CardHeader>
          <CardContent>
            {announcements.length === 0 ? (
              <div className="text-center py-12">
                <Megaphone className="mx-auto text-muted-foreground mb-4" size={48} />
                <p className="text-lg font-medium text-foreground mb-2">
                  No announcements yet
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first announcement to get started
                </p>
                <Button onClick={() => handleOpenDialog()} variant="outline">
                  <Plus size={16} className="mr-2" />
                  Create Announcement
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {announcements.map((announcement) => (
                    <TableRow key={announcement.id}>
                      <TableCell className="font-medium">
                        {announcement.title}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={announcement.published ? "default" : "secondary"}
                        >
                          {announcement.published ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-2">
                          {formatDate(announcement.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(announcement.updatedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTogglePublish(announcement.id)}
                            title={announcement.published ? "Unpublish" : "Publish"}
                          >
                            {announcement.published ? (
                              <X size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(announcement)}
                          >
                            <FileText size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(announcement.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? "Edit Announcement" : "Create New Announcement"}
              </DialogTitle>
              <DialogDescription>
                {isEditMode
                  ? "Update the announcement details below."
                  : "Fill in the details to create a new announcement."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Enter announcement title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    placeholder="Enter announcement content"
                    rows={8}
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="published"
                    checked={formData.published}
                    onChange={(e) =>
                      setFormData({ ...formData, published: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="published" className="font-normal cursor-pointer">
                    Publish immediately
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Saving..."
                    : isEditMode
                      ? "Update Announcement"
                      : "Create Announcement"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
