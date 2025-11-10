"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { FileText, Plus, X, CheckCircle2, Shield } from "lucide-react"

const CATEGORIES = [
  "Artificial Intelligence",
  "Machine Learning",
  "Quantum Computing",
  "Biotechnology",
  "Climate Science",
  "Nanotechnology",
  "Engineering",
]

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; email: string; role?: string } | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    abstract: "",
    categories: [] as string[],
    tags: [] as string[],
    tagInput: "",
  })
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user")
      if (stored) {
        const userData = JSON.parse(stored)
        setUser(userData)
      }
    }
  }, [])

  const handleCategoryToggle = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }))
  }

  const handleTagAdd = () => {
    if (formData.tagInput.trim() && !formData.tags.includes(formData.tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, prev.tagInput.trim()],
        tagInput: "",
      }))
    }
  }

  const handleTagRemove = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate form
      if (!formData.title.trim()) {
        alert("Please enter a title")
        return
      }
      if (!formData.abstract.trim()) {
        alert("Please enter an abstract")
        return
      }
      if (formData.categories.length === 0) {
        alert("Please select at least one category")
        return
      }
      if (!pdfFile) {
        alert("Please upload a PDF file")
        return
      }

      // In a real app, this would upload to a backend
      // For now, we'll simulate success
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Save repository to localStorage
      if (user && typeof window !== "undefined") {
        // Convert PDF file to base64 for persistent storage
        let pdfData: string | undefined = undefined
        if (pdfFile) {
          pdfData = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
              const result = reader.result as string
              resolve(result)
            }
            reader.onerror = reject
            reader.readAsDataURL(pdfFile)
          })
        }

        const newRepository = {
          id: Date.now().toString(),
          title: formData.title.trim(),
          abstract: formData.abstract.trim(),
          publisher: {
            name: user.name,
            avatar: user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2),
          },
          category: formData.categories,
          tags: formData.tags,
          publishedDate: new Date().toISOString().split("T")[0],
          publishedStatus: "unpublished" as const,
          pdfUrl: pdfData || "/mock/Document1.pdf", // Store base64 data URL or fallback
          pdfData: pdfData, // Store base64 data separately for easier access
          userId: user.email, // Store user email to filter repositories
        }

        // Get existing repositories from localStorage
        const existingRepos = localStorage.getItem("userRepositories")
        const repositories = existingRepos ? JSON.parse(existingRepos) : []

        // Add new repository
        repositories.push(newRepository)

        // Save back to localStorage
        localStorage.setItem("userRepositories", JSON.stringify(repositories))

        // Dispatch custom event to notify other components
        window.dispatchEvent(new Event("repositoryAdded"))
      }

      setSuccess(true)
      // Reset form
      setFormData({
        title: "",
        abstract: "",
        categories: [],
        tags: [],
        tagInput: "",
      })
      setPdfFile(null)

      setTimeout(() => {
        setSuccess(false)
        router.push("/publisher/my-repository")
      }, 2000)
    } catch (error) {
      alert("Failed to publish research. Please try again.")
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
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="text-primary" size={28} />
            <h1 className="text-3xl font-bold text-foreground">Admin: Publish Research</h1>
          </div>
          <div className="flex flex-col gap-2 mb-2">
            <p className="text-lg font-medium text-foreground">{user.name}</p>
            <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium w-fit">
              Admin
            </span>
          </div>
          <p className="text-muted-foreground">
            As an admin, you can publish research on behalf of the repository
          </p>
        </div>

        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="text-green-600 dark:text-green-400" size={20} />
            <p className="text-green-800 dark:text-green-200">
              Research published successfully! Redirecting...
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
              placeholder="Enter the title of the research"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-input border-border"
              required
            />
          </div>

          {/* Abstract */}
          <div className="space-y-2">
            <Label htmlFor="abstract" className="text-foreground font-medium">
              Abstract *
            </Label>
            <Textarea
              id="abstract"
              placeholder="Provide a comprehensive abstract of the research"
              value={formData.abstract}
              onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
              className="bg-input border-border min-h-[150px]"
              required
            />
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <Label className="text-foreground font-medium">Categories *</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <Button
                  key={category}
                  type="button"
                  variant={formData.categories.includes(category) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategoryToggle(category)}
                  className={
                    formData.categories.includes(category)
                      ? "bg-primary text-primary-foreground"
                      : "bg-transparent"
                  }
                >
                  {category}
                </Button>
              ))}
            </div>
            {formData.categories.length === 0 && (
              <p className="text-sm text-muted-foreground">Select at least one category</p>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="text-foreground font-medium">
              Tags
            </Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                type="text"
                placeholder="Enter a tag and press Enter"
                value={formData.tagInput}
                onChange={(e) => setFormData({ ...formData, tagInput: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleTagAdd()
                  }
                }}
                className="bg-input border-border"
              />
              <Button type="button" onClick={handleTagAdd} variant="outline">
                <Plus size={16} />
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-accent text-accent-foreground rounded text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleTagRemove(tag)}
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
            <div className="flex items-center gap-4">
              <Input
                id="pdf"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="bg-input border-border"
                required
              />
              {pdfFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText size={16} />
                  <span>{pdfFile.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? "Publishing..." : "Publish Research"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}
