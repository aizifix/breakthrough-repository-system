"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { User, Mail, Building2, Briefcase, FileText, User as PhoneIcon, Mail as MapIcon, Download, FileText as Edit2, ArrowLeft, Fingerprint, CreditCard, Image as ImageIcon, CheckCircle2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getUserProfile } from "@/app/config/api"
import { Badge } from "@/components/ui/badge"

interface UserProfile {
  name: string
  email: string
  avatar?: string
  role?: string
  userId?: number
  uniqueId?: string
  isVerified?: boolean
  // Extended profile fields
  institution?: string
  department?: string
  position?: string
  biography?: string
  contactNumber?: string
  address?: string
  researchType?: string
  researchArea?: string
  keywords?: string
  studentIdNumber?: string
  studentIdImage?: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<UserProfile>({
    name: "",
    email: "",
    uniqueId: "",
    isVerified: false,
    institution: "",
    department: "",
    position: "",
    biography: "",
    contactNumber: "",
    address: "",
    researchType: "",
    researchArea: "",
    keywords: "",
    studentIdNumber: "",
    studentIdImage: "",
  })

  // Load user and profile data from API
  useEffect(() => {
    const loadProfile = async () => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("user")
        if (stored) {
          try {
            const userData = JSON.parse(stored)
            setUser(userData)

            // Fetch full profile from API
            const userId = userData.userId || userData.user_id
            if (userId) {
              try {
                const response = await getUserProfile(userId)
                if (response.status === "success" && response.user) {
                  const apiUser = response.user

                  // Map API data to profile format
                  const apiProfile: UserProfile = {
                    name: apiUser.user_name || userData.name,
                    email: apiUser.user_email || userData.email,
                    avatar: userData.avatar,
                    role: apiUser.user_role || userData.role,
                    userId: apiUser.user_id,
                    uniqueId: apiUser.user_unique_id || userData.uniqueId,
                    isVerified: (apiUser as any).is_verified ?? false,
                    institution: apiUser.user_school || "",
                    department: apiUser.user_department || "",
                    position: apiUser.user_type || "",
                    contactNumber: apiUser.user_contact || "",
                    address: apiUser.user_address || "",
                    studentIdNumber: (apiUser as any).student_id_number || "",
                    studentIdImage: (apiUser as any).student_id_image || "",
                    // These fields might not be in the database yet, so check localStorage
                    biography: "",
                    researchType: "",
                    researchArea: "",
                    keywords: "",
                  }

                  // Load extended profile data from localStorage (for fields not in DB)
                  const storedProfile = localStorage.getItem(`userProfile_${userData.email}`)
                  if (storedProfile) {
                    const profileData = JSON.parse(storedProfile)
                    apiProfile.biography = profileData.biography || ""
                    apiProfile.researchType = profileData.researchType || ""
                    apiProfile.researchArea = profileData.researchArea || ""
                    apiProfile.keywords = profileData.keywords || ""
                  }

                  setProfile(apiProfile)
                  setFormData(apiProfile)
                } else {
                  // Fallback to localStorage if API fails
                  const storedProfile = localStorage.getItem(`userProfile_${userData.email}`)
                  const profileData = storedProfile ? JSON.parse(storedProfile) : {}
                  const mergedProfile: UserProfile = {
                    ...userData,
                    ...profileData,
                  }
                  setProfile(mergedProfile)
                  setFormData(mergedProfile)
                }
              } catch (error) {
                console.error("Error fetching profile:", error)
                // Fallback to localStorage if API fails
                const storedProfile = localStorage.getItem(`userProfile_${userData.email}`)
                const profileData = storedProfile ? JSON.parse(storedProfile) : {}
                const mergedProfile: UserProfile = {
                  ...userData,
                  ...profileData,
                }
                setProfile(mergedProfile)
                setFormData(mergedProfile)
              }
            } else {
              // No userId, use localStorage only
              const storedProfile = localStorage.getItem(`userProfile_${userData.email}`)
              const profileData = storedProfile ? JSON.parse(storedProfile) : {}
              const mergedProfile: UserProfile = {
                ...userData,
                ...profileData,
              }
              setProfile(mergedProfile)
              setFormData(mergedProfile)
            }
          } catch (error) {
            console.error("Error parsing user data:", error)
            router.push("/auth/login")
          }
        } else {
          router.push("/auth/login")
        }
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [router])

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Update user data (basic info)
      const updatedUser = {
        name: formData.name,
        email: formData.email,
        avatar: formData.avatar || user?.avatar,
        role: formData.role || user?.role,
        userId: user?.userId,
        uniqueId: user?.uniqueId || formData.uniqueId,
      }

      // Save extended profile data separately
      const extendedProfile = {
        institution: formData.institution,
        department: formData.department,
        position: formData.position,
        biography: formData.biography,
        contactNumber: formData.contactNumber,
        address: formData.address,
        researchType: formData.researchType,
        researchArea: formData.researchArea,
        keywords: formData.keywords,
      }

      localStorage.setItem("user", JSON.stringify(updatedUser))
      localStorage.setItem(`userProfile_${formData.email}`, JSON.stringify(extendedProfile))

      // Update state
      setUser(updatedUser)
      setProfile({ ...updatedUser, ...extendedProfile })

      // Dispatch event to notify other components
      window.dispatchEvent(new Event("storage"))
      window.dispatchEvent(new CustomEvent("userUpdated", { detail: updatedUser }))

      setIsEditing(false)
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    // Reset form data to current profile
    if (profile) {
      setFormData(profile)
    }
    setIsEditing(false)
  }

  // Generate avatar initials
  const getAvatarInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
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

  if (!user || !profile) {
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
              <BreadcrumbPage>Profile</BreadcrumbPage>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <User size={24} className="text-primary" />
                  Profile
                </h1>
                {profile.isVerified ? (
                  <Badge className="bg-green-600 hover:bg-green-700 text-white border-green-700">
                    <CheckCircle2 size={14} />
                    Verified
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600">
                    <AlertCircle size={14} />
                    Not Verified
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {profile.isVerified
                  ? "Your account has been verified by admin/staff"
                  : "Please wait for admin/staff to review your account"}
              </p>
            </div>
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              >
                <Edit2 size={20} />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-6 space-y-6">
          {/* Avatar and Basic Info Section */}
          <div className="flex flex-col sm:flex-row gap-6 pb-6 border-b border-border">
              <div className="shrink-0">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                {formData.avatar || getAvatarInitials(formData.name)}
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground font-medium flex items-center gap-2">
                  <User size={16} />
                  Full Name
                </Label>
                {isEditing ? (
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="bg-input border-border"
                  />
                ) : (
                  <p className="text-foreground">{profile.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium flex items-center gap-2">
                  <Mail size={16} />
                  Email Address
                </Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="bg-input border-border"
                  />
                ) : (
                  <p className="text-foreground">{profile.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="uniqueId" className="text-foreground font-medium flex items-center gap-2">
                  <Fingerprint size={16} />
                  Breakthrough ID (BT-ID):
                </Label>
                <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-md">
                  <p className="text-foreground font-mono font-semibold text-base">{profile.uniqueId || "Not assigned"}</p>
                </div>
                <p className="text-xs text-muted-foreground">This is your unique identifier. Please save this for future reference.</p>
              </div>
            </div>
          </div>

          {/* Institution Information Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Building2 size={20} className="text-primary" />
              Institution Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="institution" className="text-foreground font-medium">
                  School / Institution
                </Label>
                {isEditing ? (
                  <Input
                    id="institution"
                    type="text"
                    placeholder="University of Example"
                    value={formData.institution || ""}
                    onChange={(e) => handleInputChange("institution", e.target.value)}
                    className="bg-input border-border"
                  />
                ) : (
                  <p className="text-foreground">{profile.institution || "Not provided"}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="department" className="text-foreground font-medium">
                  Department / College / Unit
                </Label>
                {isEditing ? (
                  <Input
                    id="department"
                    type="text"
                    placeholder="Computer Science Department"
                    value={formData.department || ""}
                    onChange={(e) => handleInputChange("department", e.target.value)}
                    className="bg-input border-border"
                  />
                ) : (
                  <p className="text-foreground">{profile.department || "Not provided"}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="position" className="text-foreground font-medium">
                  Position / Role
                </Label>
                {isEditing ? (
                  <Select
                    value={formData.position || ""}
                    onValueChange={(value) => handleInputChange("position", value)}
                  >
                    <SelectTrigger className="w-full bg-input border-border">
                      <SelectValue placeholder="Select your position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Student">Student</SelectItem>
                      <SelectItem value="Faculty">Faculty</SelectItem>
                      <SelectItem value="Researcher">Researcher</SelectItem>
                      <SelectItem value="Librarian">Librarian</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-foreground">{profile.position || "Not provided"}</p>
                )}
              </div>
            </div>
          </div>

          {/* Student ID Information Section */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <CreditCard size={20} className="text-primary" />
              Student ID Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="studentIdNumber" className="text-foreground font-medium flex items-center gap-2">
                  <CreditCard size={16} />
                  Student ID Number
                </Label>
                {isEditing ? (
                  <Input
                    id="studentIdNumber"
                    type="text"
                    placeholder="e.g., 2021-12345"
                    value={formData.studentIdNumber || ""}
                    onChange={(e) => handleInputChange("studentIdNumber", e.target.value)}
                    className="bg-input border-border"
                    disabled
                  />
                ) : (
                  <div className="px-4 py-2 bg-muted/50 border border-border rounded-md">
                    <p className="text-foreground">{profile.studentIdNumber || "Not provided"}</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">This field cannot be edited after registration.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentIdImage" className="text-foreground font-medium flex items-center gap-2">
                  <ImageIcon size={16} />
                  Student ID Photo
                </Label>
                {profile.studentIdImage ? (
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <div className="w-full overflow-hidden rounded-md border border-border bg-background">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`http://localhost/repository-api/${profile.studentIdImage}`}
                        alt="Student ID"
                        className="w-full h-48 object-contain bg-background"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent) {
                            parent.innerHTML = '<p class="text-muted-foreground text-sm p-4">Image not found</p>'
                          }
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Uploaded student ID for verification</p>
                  </div>
                ) : (
                  <div className="px-4 py-8 bg-muted/50 border border-border rounded-md text-center">
                    <p className="text-muted-foreground">No student ID photo uploaded</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Information Section */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Briefcase size={20} className="text-primary" />
              Profile Information
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="biography" className="text-foreground font-medium">
                  Biography / About
                </Label>
                {isEditing ? (
                  <Textarea
                    id="biography"
                    placeholder="Tell us about yourself..."
                    value={formData.biography || ""}
                    onChange={(e) => handleInputChange("biography", e.target.value)}
                    className="bg-input border-border min-h-32"
                    maxLength={500}
                  />
                ) : (
                  <p className="text-foreground whitespace-pre-wrap">
                    {profile.biography || "Not provided"}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactNumber" className="text-foreground font-medium flex items-center gap-2">
                    <PhoneIcon size={16} />
                    Contact Number
                  </Label>
                  {isEditing ? (
                    <Input
                      id="contactNumber"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={formData.contactNumber || ""}
                      onChange={(e) => handleInputChange("contactNumber", e.target.value)}
                      className="bg-input border-border"
                    />
                  ) : (
                    <p className="text-foreground">{profile.contactNumber || "Not provided"}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-foreground font-medium flex items-center gap-2">
                    <MapIcon size={16} />
                    Address
                  </Label>
                  {isEditing ? (
                    <Input
                      id="address"
                      type="text"
                      placeholder="City, Province, Country"
                      value={formData.address || ""}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      className="bg-input border-border"
                    />
                  ) : (
                    <p className="text-foreground">{profile.address || "Not provided"}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Research Information Section */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <FileText size={20} className="text-primary" />
              Research Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="researchType" className="text-foreground font-medium">
                  Research Type / Field
                </Label>
                {isEditing ? (
                  <Select
                    value={formData.researchType || ""}
                    onValueChange={(value) => handleInputChange("researchType", value)}
                  >
                    <SelectTrigger className="w-full bg-input border-border">
                      <SelectValue placeholder="Select research type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Thesis">Thesis</SelectItem>
                      <SelectItem value="Dissertation">Dissertation</SelectItem>
                      <SelectItem value="Journal">Journal</SelectItem>
                      <SelectItem value="Capstone">Capstone</SelectItem>
                      <SelectItem value="Research Paper">Research Paper</SelectItem>
                      <SelectItem value="Conference Paper">Conference Paper</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-foreground">{profile.researchType || "Not provided"}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="researchArea" className="text-foreground font-medium">
                  Research Area / Discipline
                </Label>
                {isEditing ? (
                  <Select
                    value={formData.researchArea || ""}
                    onValueChange={(value) => handleInputChange("researchArea", value)}
                  >
                    <SelectTrigger className="w-full bg-input border-border">
                      <SelectValue placeholder="Select research area" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Social Science">Social Science</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Medicine">Medicine</SelectItem>
                      <SelectItem value="Computer Science">Computer Science</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Arts">Arts</SelectItem>
                      <SelectItem value="Natural Sciences">Natural Sciences</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-foreground">{profile.researchArea || "Not provided"}</p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="keywords" className="text-foreground font-medium">
                  Keywords / Expertise Tags
                </Label>
                {isEditing ? (
                  <Input
                    id="keywords"
                    type="text"
                    placeholder="e.g., machine-learning, data-science, ai"
                    value={formData.keywords || ""}
                    onChange={(e) => handleInputChange("keywords", e.target.value)}
                    className="bg-input border-border"
                  />
                ) : (
                  <p className="text-foreground">{profile.keywords || "Not provided"}</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              >
                <Download size={20} />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={isSaving}
                className="bg-transparent border-border"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
