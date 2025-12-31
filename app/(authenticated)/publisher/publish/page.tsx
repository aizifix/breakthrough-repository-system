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
  SelectSeparator,
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
import { FileText, Plus, X, CheckCircle2, ArrowLeft, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"

interface DepartmentOption {
  id: number
  name: string
  description?: string
}

interface ResearchTypeOption {
  id: number
  name: string
  description?: string
}

export default function PublishPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<{ name: string; email: string; role?: string; userId?: number; user_id?: number } | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    abstract: "",
    department: "",
    customDepartment: "",
    researchType: "",
    customResearchType: "",
    keywords: [] as string[],
    keywordInput: "",
  })
  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [researchTypes, setResearchTypes] = useState<ResearchTypeOption[]>([])
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true)
  const [isLoadingResearchTypes, setIsLoadingResearchTypes] = useState(true)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const [isCheckingVerification, setIsCheckingVerification] = useState(true)

  // Check user verification status
  useEffect(() => {
    const checkVerification = async () => {
      if (typeof window !== "undefined" && user) {
        try {
          let verificationStatus = (user as any)?.is_verified ?? (user as any)?.isVerified ?? false

          // Always fetch from API to get the latest verification status
          if (user.email) {
            try {
              const response = await fetch("http://localhost/repository-api/api/auth.php", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  operation: "get_user_by_email",
                  email: user.email,
                }),
              })

              const result = await response.json()
              if (result.status === "success" && result.user) {
                verificationStatus = result.user.is_verified ?? false
                // Update localStorage
                const updatedUser = {
                  ...user,
                  is_verified: verificationStatus,
                  isVerified: verificationStatus,
                }
                localStorage.setItem("user", JSON.stringify(updatedUser))
                setUser(updatedUser)
              }
            } catch (error) {
              console.error("Error checking verification status:", error)
            }
          }

          setIsVerified(verificationStatus)
        } catch (error) {
          console.error("Error checking verification:", error)
          setIsVerified(false)
        } finally {
          setIsCheckingVerification(false)
        }
      } else if (!user) {
        setIsCheckingVerification(false)
      }
    }

    if (user) {
      checkVerification()
    }
  }, [user])

  // Load departments from API
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setIsLoadingDepartments(true)
          const response = await fetch("http://localhost/repository-api/api/filters.php?operation=get_departments")
        const result = await response.json()
        if (result.status === "success" && result.data) {
          setDepartments(result.data)
        }
      } catch (error) {
        console.error("Failed to load departments:", error)
      } finally {
        setIsLoadingDepartments(false)
      }
    }
    loadDepartments()
  }, [])

  // Load research types from API
  useEffect(() => {
    const loadResearchTypes = async () => {
      try {
        setIsLoadingResearchTypes(true)
          const response = await fetch("http://localhost/repository-api/api/filters.php?operation=get_research_types")
        const result = await response.json()
        if (result.status === "success" && result.data) {
          setResearchTypes(result.data)
        }
      } catch (error) {
        console.error("Failed to load research types:", error)
      } finally {
        setIsLoadingResearchTypes(false)
      }
    }
    loadResearchTypes()
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user")
      if (stored) {
        try {
          const userData = JSON.parse(stored)

          // Check if userId is missing and try to fetch it
          if (!userData.userId && !userData.user_id && userData.email) {
            // Try to get user ID from API
            fetch("http://localhost/repository-api/api/auth.php", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                operation: "get_user_by_email",
                email: userData.email,
              }),
            })
              .then((res) => res.json())
              .then((result) => {
                if (result.status === "success" && result.user) {
                  const updatedUser = {
                    ...userData,
                    userId: result.user.user_id,
                    user_id: result.user.user_id,
                  }
                  localStorage.setItem("user", JSON.stringify(updatedUser))
                  setUser(updatedUser)
                } else {
                  setUser(userData)
                }
              })
              .catch(() => {
                setUser(userData)
              })
          } else {
            setUser(userData)
          }
        } catch (e) {
          router.push("/auth/login")
        }
      } else {
        router.push("/auth/login")
      }
    }
  }, [router])


  const handleKeywordAdd = () => {
    if (formData.keywordInput.trim() && !formData.keywords.includes(formData.keywordInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        keywords: [...prev.keywords, prev.keywordInput.trim()],
        keywordInput: "",
      }))
    }
  }

  const handleKeywordRemove = (keyword: string) => {
    setFormData((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((k) => k !== keyword),
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      console.log("File selected:", {
        name: file.name,
        size: file.size,
        type: file.type,
        sizeMB: (file.size / 1024 / 1024).toFixed(2)
      })

      // Validate file type
      if (file.type !== "application/pdf") {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file.",
          variant: "destructive",
        })
        // Reset input
        e.target.value = ""
        return
      }

      // Validate file size (500MB max to prevent abuse, but allow larger files than 10MB)
      if (file.size > 500 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "File size must be less than 500MB.",
          variant: "destructive",
        })
        // Reset input
        e.target.value = ""
        return
      }

      // Check if file size is 0
      if (file.size === 0) {
        toast({
          title: "Invalid File",
          description: "The selected file appears to be empty. Please select a valid PDF file.",
          variant: "destructive",
        })
        // Reset input
        e.target.value = ""
        return
      }

      setPdfFile(file)

      // Create preview URL
      const reader = new FileReader()
      reader.onload = () => {
        setPdfPreviewUrl(reader.result as string)
      }
      reader.onerror = () => {
        console.error("Error reading file")
        toast({
          title: "Error",
          description: "Failed to read file. Please try again.",
          variant: "destructive",
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

      const files = e.dataTransfer.files
      if (files && files[0]) {
        const file = files[0]

        console.log("File dropped:", {
          name: file.name,
          size: file.size,
          type: file.type,
          sizeMB: (file.size / 1024 / 1024).toFixed(2)
        })

        if (file.type !== "application/pdf") {
          toast({
            title: "Invalid File Type",
            description: "Please drop a PDF file.",
            variant: "destructive",
          })
          return
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "File Too Large",
            description: "File size must be less than 10MB.",
            variant: "destructive",
          })
          return
        }

        // Check if file size is 0
        if (file.size === 0) {
          toast({
            title: "Invalid File",
            description: "The dropped file appears to be empty. Please select a valid PDF file.",
            variant: "destructive",
          })
          return
        }

        setPdfFile(file)

        // Create preview URL
        const reader = new FileReader()
        reader.onload = () => {
          setPdfPreviewUrl(reader.result as string)
        }
        reader.onerror = () => {
          console.error("Error reading file")
          toast({
            title: "Error",
            description: "Failed to read file. Please try again.",
            variant: "destructive",
          })
        }
        reader.readAsDataURL(file)
      }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate form
      if (!formData.title.trim()) {
        toast({
          title: "Validation Error",
          description: "Please enter a title",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }
      if (!formData.abstract.trim()) {
        toast({
          title: "Validation Error",
          description: "Please enter an abstract",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }
      if (!formData.department) {
        toast({
          title: "Validation Error",
          description: "Please select a department",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }
      if (formData.department === "Custom" && !formData.customDepartment.trim()) {
        toast({
          title: "Validation Error",
          description: "Please enter a custom department",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }
      if (!formData.researchType) {
        toast({
          title: "Validation Error",
          description: "Please select a research type",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }
      if (formData.researchType === "Custom" && !formData.customResearchType.trim()) {
        toast({
          title: "Validation Error",
          description: "Please enter a custom research type",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }
      if (!pdfFile) {
        toast({
          title: "Validation Error",
          description: "Please upload a PDF file",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Check for userId (from login) or user_id (from API)
      let userId = (user as any)?.userId || (user as any)?.user_id
      let isVerified = (user as any)?.is_verified ?? (user as any)?.isVerified ?? false

      // If userId is missing, try to fetch it from the API using email
      if (!userId && user?.email) {
        try {
          const response = await fetch("http://localhost/repository-api/api/auth.php", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              operation: "get_user_by_email",
              email: user.email,
            }),
          })

          const result = await response.json()
          if (result.status === "success" && result.user) {
            userId = result.user.user_id
            isVerified = result.user.is_verified ?? false
            // Update localStorage with the correct user data
            const updatedUser = {
              ...user,
              userId: result.user.user_id,
              user_id: result.user.user_id,
              is_verified: isVerified,
              isVerified: isVerified,
            }
            localStorage.setItem("user", JSON.stringify(updatedUser))
            setUser(updatedUser)
          }
        } catch (error) {
          console.error("Error fetching user ID:", error)
        }
      }

      if (!user || !userId) {
        console.error("User object:", user)
        console.error("User ID found:", userId)
        toast({
          title: "Error",
          description: "User information not found. Please log out and log in again.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Check if user is verified (unverified users cannot publish)
      if (!isVerified) {
        toast({
          title: "Account Not Verified",
          description: "Your account needs to be verified by an administrator before you can publish repositories. You can still login and download repositories.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Reset progress
      setUploadProgress(0)

      // Determine final department and research type values
      const finalDepartment = formData.department === "Custom"
        ? formData.customDepartment.trim()
        : formData.department
      const finalResearchType = formData.researchType === "Custom"
        ? formData.customResearchType.trim()
        : formData.researchType

      // Create FormData for file upload
      const formDataToSend = new FormData()
      formDataToSend.append("operation", "create_repository")
      formDataToSend.append("title", formData.title.trim())
      formDataToSend.append("abstract", formData.abstract.trim())
      formDataToSend.append("publisher", userId.toString())
      formDataToSend.append("department", finalDepartment)
      formDataToSend.append("researchType", finalResearchType)
      formDataToSend.append("tags", JSON.stringify(formData.keywords))
      formDataToSend.append("pdfFile", pdfFile)

      // Call API with progress tracking using XMLHttpRequest
      const response = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        // Track upload progress
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100
            setUploadProgress(percentComplete)
          }
        })

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            // Create a Response-like object
            const response = new Response(xhr.responseText, {
              status: xhr.status,
              statusText: xhr.statusText,
              headers: new Headers({ "Content-Type": "application/json" }),
            })
            resolve(response)
          } else {
            reject(new Error(`HTTP error! status: ${xhr.status}`))
          }
        })

        xhr.addEventListener("error", () => {
          reject(new Error("Network error"))
        })

        xhr.addEventListener("abort", () => {
          reject(new Error("Upload aborted"))
        })

        xhr.open("POST", "http://localhost/repository-api/api/publisher.php")
        xhr.send(formDataToSend)
      })

      // Check if response is OK
      if (!response.ok) {
        const errorText = await response.text()
        console.error("API Error Response:", errorText)
        toast({
          title: "Server Error",
          description: `Server returned error ${response.status}. ${errorText.substring(0, 100)}`,
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Try to parse JSON response
      let result
      try {
        const responseText = await response.text()
        console.log("API Response:", responseText)
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError)
        toast({
          title: "Response Error",
          description: "Server returned invalid response. Please check console for details.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      if (result.status === "success") {
        // Show toast notification
        toast({
          title: "Repository Created Successfully",
          description: "Your repository has been created and is waiting for admin approval to be published.",
        })

        setSuccess(true)

        // Reset form
        setFormData({
          title: "",
          abstract: "",
          department: "",
          customDepartment: "",
          researchType: "",
          customResearchType: "",
          keywords: [],
          keywordInput: "",
        })
        setPdfFile(null)
        setPdfPreviewUrl(null)
        setUploadProgress(0)

        // Redirect after 1.5 seconds
        setTimeout(() => {
          router.push("/publisher/my-repository")
        }, 1500)
      } else {
        // Show error message from API
        const errorMessage = result.message || "Failed to create repository. Please try again."
        console.error("API Error:", errorMessage)
        toast({
          title: "Error Creating Repository",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating repository:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      toast({
        title: "Network Error",
        description: `Failed to connect to server: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
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
              <BreadcrumbPage>Publish Research</BreadcrumbPage>
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

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Publish Research</h1>
          <p className="text-sm text-muted-foreground">
            Share your research with the global academic community
          </p>
        </div>

        {/* Verification Status Alert */}
        {!isCheckingVerification && !isVerified && (
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <FileText className="text-yellow-600 dark:text-yellow-400" size={20} />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
                  You are not yet verified
                </h3>
                <p className="text-yellow-800 dark:text-yellow-300 mb-3">
                  Please wait, we're still reviewing your credentials. Your account is currently under review by our administrators.
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  While your account is being verified, you can still log in, browse repositories, and download research papers.
                  Once your account is verified, you'll be able to publish your own research.
                </p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="text-green-600 dark:text-green-400" size={20} />
            <p className="text-green-800 dark:text-green-200">
              Repository created successfully! Waiting for admin approval. Redirecting...
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-foreground font-medium">
              Research Title *
            </Label>
            <Input
              id="title"
              type="text"
              placeholder="Enter the title of your research"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-input border-border"
            />
          </div>

          {/* Abstract */}
          <div className="space-y-2">
            <Label htmlFor="abstract" className="text-foreground font-medium">
              Abstract *
            </Label>
            <Textarea
              id="abstract"
              placeholder="Provide a comprehensive abstract of your research"
              value={formData.abstract}
              onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
              className="bg-input border-border min-h-[150px]"
            />
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label htmlFor="department" className="text-foreground font-medium">Department *</Label>
            <Select
              value={formData.department}
              onValueChange={(value) => setFormData({ ...formData, department: value, customDepartment: "" })}
              disabled={isSubmitting || isLoadingDepartments}
            >
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Select a department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.name}>
                    {dept.name}
                  </SelectItem>
                ))}
                <SelectSeparator />
                <SelectItem value="Custom">
                  Custom +
                </SelectItem>
              </SelectContent>
            </Select>
            {formData.department === "Custom" && (
              <Input
                type="text"
                placeholder="Enter custom department"
                value={formData.customDepartment}
                onChange={(e) => setFormData({ ...formData, customDepartment: e.target.value })}
                className="bg-input border-border mt-2"
                disabled={isSubmitting}
              />
            )}
            {!formData.department && (
              <p className="text-sm text-muted-foreground">Select a department</p>
            )}
          </div>

          {/* Research Type */}
          <div className="space-y-2">
            <Label htmlFor="researchType" className="text-foreground font-medium">Research Type *</Label>
            <Select
              value={formData.researchType}
              onValueChange={(value) => setFormData({ ...formData, researchType: value, customResearchType: "" })}
              disabled={isSubmitting || isLoadingResearchTypes}
            >
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Select research type" />
              </SelectTrigger>
              <SelectContent>
                {researchTypes
                  .filter((type) => type.name !== "Custom")
                  .map((type) => (
                    <SelectItem key={type.id} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))}
                <SelectSeparator />
                <SelectItem value="Custom">
                  Custom +
                </SelectItem>
              </SelectContent>
            </Select>
            {formData.researchType === "Custom" && (
              <Input
                type="text"
                placeholder="Enter custom research type"
                value={formData.customResearchType}
                onChange={(e) => setFormData({ ...formData, customResearchType: e.target.value })}
                className="bg-input border-border mt-2"
                disabled={isSubmitting}
              />
            )}
            {!formData.researchType && (
              <p className="text-sm text-muted-foreground">Select a research type</p>
            )}
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <Label htmlFor="keywords" className="text-foreground font-medium">
              Keywords
            </Label>
            <div className="flex gap-2">
              <Input
                id="keywords"
                type="text"
                placeholder="Enter a keyword and press Enter"
                value={formData.keywordInput}
                onChange={(e) => setFormData({ ...formData, keywordInput: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleKeywordAdd()
                  }
                }}
                className="bg-input border-border"
              />
              <Button type="button" onClick={handleKeywordAdd} variant="outline">
                <Plus size={16} />
              </Button>
            </div>
            {formData.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-accent text-accent-foreground rounded text-sm"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => handleKeywordRemove(keyword)}
                      className="hover:text-destructive"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* PDF Upload */}
          <div className="space-y-2">
            <Label htmlFor="pdf" className="text-foreground font-medium">
              Research Paper (PDF) *
            </Label>

            {pdfFile && pdfPreviewUrl ? (
              // PDF Preview Card
              <div className="border border-border rounded-lg p-4 bg-card">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-16 h-20 bg-red-50 dark:bg-red-900/20 rounded flex items-center justify-center">
                    <FileText size={32} className="text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{pdfFile.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {pdfFile.size > 0
                            ? pdfFile.size < 1024 * 1024
                              ? `${(pdfFile.size / 1024).toFixed(2)} KB`
                              : `${(pdfFile.size / 1024 / 1024).toFixed(2)} MB`
                            : "File size unavailable"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => document.getElementById("pdf")?.click()}
                          className="h-8 px-3 text-xs"
                          disabled={isSubmitting}
                        >
                          Change
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setPdfFile(null)
                            setPdfPreviewUrl(null)
                            // Reset file input
                            const input = document.getElementById("pdf") as HTMLInputElement
                            if (input) input.value = ""
                          }}
                          className="h-8 w-8 p-0"
                          disabled={isSubmitting}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    </div>
                    {isSubmitting && (
                      <div className="space-y-2 mt-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Uploading...</span>
                          <span className="text-foreground font-medium">{Math.round(uploadProgress)}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // Drag and Drop Area
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById("pdf")?.click()}
                className={`
                  relative w-full min-h-[150px] py-12
                  border-2 border-dashed rounded-lg
                  flex flex-col items-center justify-center gap-3
                  cursor-pointer transition-colors
                  ${isDragging
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 hover:bg-accent/50"
                  }
                `}
              >
                <input
                  id="pdf"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload size={48} className="text-muted-foreground" />
                <div className="text-center px-4">
                  <p className="text-sm font-medium text-foreground">Drag file (PDF) here</p>
                  <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-2">Maximum file size: 10MB</p>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || !isVerified || isCheckingVerification}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? "Publishing..." : "Publish Research"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/publisher")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
          {!isVerified && !isCheckingVerification && (
            <p className="text-sm text-muted-foreground text-center pt-2">
              Publishing is disabled until your account is verified
            </p>
          )}
        </form>
      </div>
    </main>
  )
}
