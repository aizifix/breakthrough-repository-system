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
  MoreVertical,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from "@/app/config/api"

interface Announcement {
  id: number | string
  title: string
  content: string
  published: boolean | number
  created_at: string
  updated_at: string
  created_by_name?: string
  created_by?: number
  createdAt?: string
  updatedAt?: string
  createdBy?: string
}

export default function AnnouncementsPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; email: string; role?: string; userId?: number; user_id?: number } | null>(null)
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
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user")
      if (stored) {
        const userData = JSON.parse(stored)
        setUser(userData)
        if (userData.role !== "admin") {
          router.push("/")
        } else {
          loadAnnouncements()
        }
      } else {
        router.push("/auth/login")
      }
    }
  }, [router])

  const loadAnnouncements = async () => {
    try {
      setIsLoading(true)
      const response = await getAnnouncements(false)
      if (response.status === "success" && response.data) {
        setAnnouncements(response.data)
      } else {
        setAnnouncements([])
      }
    } catch (error) {
      console.error("Error loading announcements:", error)
      setAnnouncements([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDialog = (announcement?: Announcement) => {
    if (announcement) {
      const normalized = normalizeAnnouncement(announcement)
      setIsEditMode(true)
      setEditingAnnouncement(normalized)
      setFormData({
        title: normalized.title,
        content: normalized.content,
        published: typeof normalized.published === "boolean" ? normalized.published : normalized.published === 1,
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

      const userId = user?.userId || user?.user_id
      if (!userId) {
        alert("User ID not found. Please log in again.")
        setIsSubmitting(false)
        return
      }

      if (isEditMode && editingAnnouncement) {
        // Update existing announcement
        const response = await updateAnnouncement(Number(editingAnnouncement.id), {
          title: formData.title.trim(),
          content: formData.content.trim(),
          published: formData.published,
        })
        if (response.status === "success") {
          await loadAnnouncements()
          handleCloseDialog()
        } else {
          alert(response.message || "Failed to update announcement. Please try again.")
        }
      } else {
        // Create new announcement
        const response = await createAnnouncement({
          title: formData.title.trim(),
          content: formData.content.trim(),
          published: formData.published,
          created_by: userId,
        })
        if (response.status === "success") {
          await loadAnnouncements()
          handleCloseDialog()
        } else {
          alert(response.message || "Failed to create announcement. Please try again.")
        }
      }
    } catch (error) {
      console.error("Error saving announcement:", error)
      alert("Failed to save announcement. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number | string) => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      try {
        const response = await deleteAnnouncement(Number(id))
        if (response.status === "success") {
          await loadAnnouncements()
        } else {
          alert(response.message || "Failed to delete announcement. Please try again.")
        }
      } catch (error) {
        console.error("Error deleting announcement:", error)
        alert("Failed to delete announcement. Please try again.")
      }
    }
  }

  const handleTogglePublish = async (id: number | string) => {
    const announcement = announcements.find((ann) => ann.id === id)
    if (!announcement) return

    try {
      const response = await updateAnnouncement(Number(id), {
        title: announcement.title,
        content: announcement.content,
        published: !announcement.published,
      })
      if (response.status === "success") {
        await loadAnnouncements()
      } else {
        alert(response.message || "Failed to update announcement. Please try again.")
      }
    } catch (error) {
      console.error("Error toggling publish:", error)
      alert("Failed to update announcement. Please try again.")
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const normalizeAnnouncement = (ann: Announcement): Announcement => {
    return {
      ...ann,
      id: ann.id,
      published: typeof ann.published === "number" ? ann.published === 1 : ann.published,
      createdAt: ann.created_at || ann.createdAt,
      updatedAt: ann.updated_at || ann.updatedAt,
      createdBy: ann.created_by_name || ann.createdBy || "Admin",
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Megaphone className="text-primary" size={24} />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Announcements</h1>
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
              <div className="overflow-x-auto -mx-6 px-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[250px]">Title</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[120px]">Created</TableHead>
                      <TableHead className="min-w-[120px]">Updated</TableHead>
                      <TableHead className="text-right min-w-[120px] sticky right-0 bg-card z-10 border-l border-border">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                        <p className="text-muted-foreground mt-2">Loading announcements...</p>
                      </TableCell>
                    </TableRow>
                  ) : announcements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <p className="text-muted-foreground">No announcements found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    announcements.map((announcement) => {
                      const normalized = normalizeAnnouncement(announcement)
                      return (
                        <TableRow key={normalized.id}>
                          <TableCell className="font-medium">
                            <div className="truncate max-w-[300px]" title={normalized.title}>
                              {normalized.title}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={normalized.published ? "default" : "secondary"}
                            >
                              {normalized.published ? "Published" : "Draft"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <div className="flex items-center gap-2">
                              {formatDate(normalized.createdAt || normalized.created_at)}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(normalized.updatedAt || normalized.updated_at)}
                          </TableCell>
                          <TableCell className="text-right sticky right-0 bg-card z-10 border-l border-border">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleTogglePublish(normalized.id)}>
                                  {normalized.published ? (
                                    <>
                                      <X size={16} className="mr-2" />
                                      Unpublish
                                    </>
                                  ) : (
                                    <>
                                      <Eye size={16} className="mr-2" />
                                      Publish
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenDialog(normalized)}>
                                  <FileText size={16} className="mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(normalized.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 size={16} className="mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
                </Table>
              </div>
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
