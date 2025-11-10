"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  User as Users,
  Search,
  FileText,
  Trash2,
  Shield,
  User as UserIcon,
  Mail,
  Building2,
  Menu,
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
import { getUsers, updateUser, deleteUser } from "@/app/config/api"

interface User {
  id: string
  name: string
  email: string
  role: "admin" | "publisher"
  avatar?: string
  institution?: string | null
  department?: string | null
  position?: string | null
  createdAt: string
  lastLogin?: string
  status: "active" | "inactive" | "suspended"
  repositoriesCount?: number
}

export default function UsersPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; email: string; role?: string } | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "publisher" as "admin" | "publisher",
    institution: "",
    department: "",
    position: "",
    status: "active" as "active" | "inactive" | "suspended",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user")
      if (stored) {
        const userData = JSON.parse(stored)
        setUser(userData)
        if (userData.user_role !== "admin" && userData.role !== "admin") {
          router.push("/")
        } else {
          loadUsers()
        }
      } else {
        router.push("/auth/login")
      }
    }
  }, [router])

  useEffect(() => {
    filterUsers()
  }, [searchQuery, roleFilter, statusFilter, users])

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      const response = await getUsers()

      if (response.status === "success" && response.data) {
        // Format the data to match expected structure
        const formattedUsers: User[] = response.data.map((user: any) => ({
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          role: user.role as "admin" | "publisher",
          avatar: user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
          institution: user.institution || null,
          department: user.department || null,
          position: user.position || null,
          createdAt: user.createdAt,
          status: user.status || "active",
          repositoriesCount: user.repositoriesCount || 0,
        }))

        setUsers(formattedUsers)
      } else {
        console.error("Failed to load users:", response.message)
        setUsers([])
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = [...users]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          u.institution?.toLowerCase().includes(query) ||
          u.department?.toLowerCase().includes(query)
      )
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => u.role === roleFilter)
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((u) => u.status === statusFilter)
    }

    setFilteredUsers(filtered)
  }

  const handleOpenDialog = (userToEdit?: User) => {
    if (userToEdit) {
      setEditingUser(userToEdit)
      setFormData({
        name: userToEdit.name,
        email: userToEdit.email,
        role: userToEdit.role,
        institution: userToEdit.institution || "",
        department: userToEdit.department || "",
        position: userToEdit.position || "",
        status: userToEdit.status,
      })
    } else {
      setEditingUser(null)
      setFormData({
        name: "",
        email: "",
        role: "publisher",
        institution: "",
        department: "",
        position: "",
        status: "active",
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingUser(null)
    setFormData({
      name: "",
      email: "",
      role: "publisher",
      institution: "",
      department: "",
      position: "",
      status: "active",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!formData.name.trim() || !formData.email.trim()) {
        alert("Please fill in all required fields")
        setIsSubmitting(false)
        return
      }

      if (editingUser) {
        // Update existing user
        const userId = parseInt(editingUser.id)
        const updateData = {
          user_name: formData.name.trim(),
          user_email: formData.email.trim(),
          user_role: formData.role,
          user_school: formData.institution.trim() || null,
          user_department: formData.department.trim() || null,
          user_type: formData.position.trim() || null,
        }

        const response = await updateUser(userId, updateData)

        if (response.status === "success") {
          // Reload users to get updated data
          await loadUsers()
          handleCloseDialog()
        } else {
          alert(response.message || "Failed to update user. Please try again.")
        }
      } else {
        // Note: Creating new users should be done through registration/auth endpoint
        // For now, we'll show an error message
        alert("User creation should be done through the registration system. Please use the registration page.")
        setIsSubmitting(false)
        return
      }
    } catch (error) {
      console.error("Error saving user:", error)
      alert("Failed to save user. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      try {
        const userId = parseInt(id)
        const response = await deleteUser(userId)

        if (response.status === "success") {
          // Reload users to reflect changes
          await loadUsers()
        } else {
          alert(response.message || "Failed to delete user. Please try again.")
        }
      } catch (error) {
        console.error("Error deleting user:", error)
        alert("Failed to delete user. Please try again.")
      }
    }
  }

  const handleStatusChange = async (id: string, newStatus: "active" | "inactive" | "suspended") => {
    // Note: Status field doesn't exist in database yet
    // For now, we'll just update locally or you can add status field to database
    // This is a placeholder - you may want to add a status column to tbl_users
    const updated = users.map((u) =>
      u.id === id ? { ...u, status: newStatus } : u
    )
    setUsers(updated)
    // If you add status to database, uncomment below:
    // try {
    //   const userId = parseInt(id)
    //   await updateUser(userId, { status: newStatus })
    //   await loadUsers()
    // } catch (error) {
    //   console.error("Error updating user status:", error)
    // }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "inactive":
        return "secondary"
      case "suspended":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    publishers: users.filter((u) => u.role === "publisher").length,
    admins: users.filter((u) => u.role === "admin").length,
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
              <Users className="text-primary" size={28} />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Users</h1>
                <p className="text-muted-foreground">
                  Manage user accounts and permissions
                </p>
              </div>
            </div>
            {/* User creation should be done through registration system */}
            {/* <Button
              onClick={() => handleOpenDialog()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            >
              <UserIcon size={20} />
              Add User
            </Button> */}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Publishers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.publishers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Admins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.admins}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search users by name, email, institution..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="publisher">Publisher</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              {filteredUsers.length} of {users.length} users
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto text-muted-foreground mb-4" size={48} />
                <p className="text-lg font-medium text-foreground mb-2">
                  No users found
                </p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "No users in the system yet"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Institution</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Repositories</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((userItem) => (
                    <TableRow key={userItem.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-sm font-semibold">
                            {userItem.avatar ||
                              userItem.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-medium">{userItem.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail size={12} />
                              {userItem.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={userItem.role === "admin" ? "default" : "secondary"}>
                          {userItem.role === "admin" ? (
                            <span className="flex items-center gap-1">
                              <Shield size={12} />
                              Admin
                            </span>
                          ) : (
                            "Publisher"
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {userItem.institution || "-"}
                          {userItem.department && (
                            <div className="text-muted-foreground text-xs">
                              {userItem.department}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(userItem.status)}>
                          {userItem.status.charAt(0).toUpperCase() + userItem.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {userItem.repositoriesCount !== undefined
                          ? userItem.repositoriesCount
                          : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-1">
                          {formatDate(userItem.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Menu size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleOpenDialog(userItem)}>
                              <FileText size={16} className="mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            {userItem.status === "active" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(userItem.id, "inactive")}
                                >
                                  Deactivate
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(userItem.id, "suspended")}
                                >
                                  Suspend
                                </DropdownMenuItem>
                              </>
                            )}
                            {userItem.status === "inactive" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(userItem.id, "active")}
                              >
                                Activate
                              </DropdownMenuItem>
                            )}
                            {userItem.status === "suspended" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(userItem.id, "active")}
                              >
                                Unsuspend
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(userItem.id)}
                              className="text-destructive"
                            >
                              <Trash2 size={16} className="mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                {editingUser ? "Edit User" : "Create New User"}
              </DialogTitle>
              <DialogDescription>
                {editingUser
                  ? "Update the user information below."
                  : "Fill in the details to create a new user account."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role *</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: "admin" | "publisher") =>
                        setFormData({ ...formData, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="publisher">Publisher</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: "active" | "inactive" | "suspended") =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="institution">Institution</Label>
                  <Input
                    id="institution"
                    value={formData.institution}
                    onChange={(e) =>
                      setFormData({ ...formData, institution: e.target.value })
                    }
                    placeholder="Enter institution name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                      placeholder="Enter department"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) =>
                        setFormData({ ...formData, position: e.target.value })
                      }
                      placeholder="Enter position"
                    />
                  </div>
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
                    : editingUser
                      ? "Update User"
                      : "Create User"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
