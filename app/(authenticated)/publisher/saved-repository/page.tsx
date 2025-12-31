"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import RepositoryCard from "@/components/repository-card"
import RepositoryViewModal from "@/components/repository-view-modal"
import FilterPanel, { type FilterState } from "@/components/filter-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Menu, Search, Bookmark, BookmarkCheck, ArrowLeft } from "lucide-react"
import { getAllRepositories, getSavedRepositories } from "@/app/config/api"
import RepositoryCardSkeleton from "@/components/repository-card-skeleton"

// Static repositories from home page (for reference)
const STATIC_REPOSITORIES = [
  {
    id: "1",
    title: "Deep Learning for Medical Image Analysis: A Comprehensive Survey",
    abstract:
      "This paper presents a comprehensive survey of deep learning techniques applied to medical image analysis, covering architectures, datasets, and clinical applications across multiple imaging modalities.",
    publisher: { name: "Dr. Sarah Chen", avatar: "SC" },
    category: ["Artificial Intelligence", "Machine Learning"],
    keywords: ["deep-learning", "medical-imaging", "neural-networks"],
    publishedDate: "2024-01-15",
    publishedStatus: "published" as const,
    pdfUrl: "/mock/Document1.pdf",
  },
  {
    id: "2",
    title: "Quantum Computing Applications in Drug Discovery",
    abstract:
      "An exploration of how quantum computing can revolutionize pharmaceutical research by accelerating molecular simulations and drug-protein interactions.",
    publisher: { name: "Prof. James Wilson", avatar: "JW" },
    category: ["Quantum Computing", "Biotechnology"],
    tags: ["quantum-computing", "drug-discovery", "molecular-simulation"],
    publishedDate: "2024-02-20",
    publishedStatus: "published" as const,
    pdfUrl: "/mock/Document1.pdf",
  },
  {
    id: "3",
    title: "Climate Change Impact on Biodiversity: Global Perspective",
    abstract:
      "A multi-continental study analyzing the effects of climate change on species distribution, ecosystem services, and conservation strategies.",
    publisher: { name: "Dr. Maria Rodriguez", avatar: "MR" },
    category: ["Climate Science", "Biotechnology"],
    tags: ["climate-change", "biodiversity", "conservation"],
    publishedDate: "2023-11-10",
    publishedStatus: "published" as const,
    pdfUrl: "/mock/Document1.pdf",
  },
  {
    id: "4",
    title: "Nanotechnology in Water Purification Systems",
    abstract:
      "Novel approach to water treatment using nanoparticles and nanofiltration membranes for removal of contaminants and pathogenic microorganisms.",
    publisher: { name: "Prof. Hassan Al-Rashid", avatar: "HA" },
    category: ["Nanotechnology", "Climate Science"],
    tags: ["nanotechnology", "water-purification", "environmental-technology"],
    publishedDate: "2023-09-05",
    publishedStatus: "published" as const,
    pdfUrl: "/mock/Document1.pdf",
  },
  {
    id: "5",
    title: "Advanced Materials for Renewable Energy Storage",
    abstract:
      "Investigation of graphene and other 2D materials for battery and supercapacitor applications with superior energy density and charge rates.",
    publisher: { name: "Dr. Emily Zhang", avatar: "EZ" },
    category: ["Nanotechnology", "Engineering"],
    tags: ["materials-science", "renewable-energy", "battery-technology"],
    publishedDate: "2024-03-12",
    publishedStatus: "published" as const,
    pdfUrl: "/mock/Document1.pdf",
  },
  {
    id: "6",
    title: "Machine Learning for Predictive Maintenance in Industrial Systems",
    abstract:
      "Framework for implementing ML algorithms to predict equipment failures and optimize maintenance schedules in manufacturing environments.",
    publisher: { name: "Dr. Robert Thompson", avatar: "RT" },
    category: ["Machine Learning", "Engineering"],
    tags: ["machine-learning", "predictive-maintenance", "iot"],
    publishedDate: "2024-01-28",
    publishedStatus: "published" as const,
    pdfUrl: "/mock/Document1.pdf",
  },
  {
    id: "7",
    title: "Artificial Intelligence Ethics and Governance Framework",
    abstract:
      "Comprehensive framework addressing ethical considerations, bias detection, and governance models for responsible AI deployment across sectors.",
    publisher: { name: "Prof. Alexandra Morris", avatar: "AM" },
    category: ["Artificial Intelligence"],
    tags: ["ai-ethics", "governance", "responsible-ai"],
    publishedDate: "2024-02-14",
    publishedStatus: "published" as const,
    pdfUrl: "/mock/Document1.pdf",
  },
  {
    id: "8",
    title: "Synthetic Biology: Designing Life for Sustainable Solutions",
    abstract:
      "Overview of synthetic biology applications in producing biofuels, biodegradable plastics, and pharmaceuticals through engineered microorganisms.",
    publisher: { name: "Dr. Michael Peterson", avatar: "MP" },
    category: ["Biotechnology", "Climate Science"],
    tags: ["synthetic-biology", "bioengineering", "sustainability"],
    publishedDate: "2023-12-20",
    publishedStatus: "published" as const,
    pdfUrl: "/mock/Document1.pdf",
  },
]

interface Repository {
  id: string
  title: string
  abstract: string
  publisher: {
    name: string
    avatar: string
  }
  category: string[]
  keywords: string[]
  publishedDate: string
  publishedStatus: "published" | "draft" | "unpublished"
  pdfUrl?: string
  pdfData?: string // Base64 data URL for uploaded PDFs
  userId?: string
}

export default function SavedRepositoriesPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; email: string; role?: string } | null>(null)
  const [savedRepositoryIds, setSavedRepositoryIds] = useState<string[]>([])
  const [allRepositories, setAllRepositories] = useState<Repository[]>([])
  const [savedRepositories, setSavedRepositories] = useState<Repository[]>([])
  const [filters, setFilters] = useState<FilterState>({
    departments: [],
    researchTypes: [],
    yearFrom: "",
    yearTo: "",
    keywords: "",
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load user and saved repositories from localStorage and API
  useEffect(() => {
    const loadData = async () => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("user")
        if (stored) {
          const userData = JSON.parse(stored)
          setUser(userData)

          // Load saved repository IDs for this user
          const savedKey = `savedRepositories_${userData.email}`
          const savedIds = localStorage.getItem(savedKey)
          if (savedIds) {
            setSavedRepositoryIds(JSON.parse(savedIds))
          }

          try {
            // Fetch saved repositories from API
            // Get userId if user is logged in
            const userId = userData.userId || userData.user_id
            const apiResponse = await getSavedRepositories(userId)

            let savedApiRepos: Repository[] = []
            if (apiResponse.status === "success" && apiResponse.data) {
              // Transform API response to match frontend format
              savedApiRepos = apiResponse.data
                .map((repo: any) => {
                  const avatar = repo.publisher_name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)

                  return {
                    id: String(repo.id),
                    title: repo.title,
                    abstract: repo.abstract,
                    publisher: {
                      name: repo.publisher_name,
                      avatar: avatar,
                      isVerified: repo.publisher_is_verified ?? false,
                    },
                    category: Array.isArray(repo.category) ? repo.category : [],
                    keywords: Array.isArray(repo.tags) ? repo.tags : [],
                    publishedDate: repo.publishedDate || new Date().toISOString().split("T")[0],
                    publishedStatus: repo.publishedStatus as "published" | "draft" | "unpublished",
                    pdfUrl: repo.pdfUrl || undefined,
                    views: repo.views ?? 0,
                    likes: repo.likes ?? 0,
                    isLiked: repo.isLiked ?? false,
                    rating: repo.rating ?? 0,
                    ratingCount: repo.rating_count ?? 0,
                  }
                })
            }

            // Set only the saved repositories (not all repositories)
            setAllRepositories(savedApiRepos)
          } catch (error) {
            console.error("Error fetching saved repositories:", error)
            // Fallback to empty array
            setAllRepositories([])
          }
        } else {
          // No user found, redirect to login
          router.push("/auth/login")
        }
        setIsLoading(false)
      }
    }

    loadData()
  }, [router])

  // Update saved repositories when IDs or all repositories change
  useEffect(() => {
    if (savedRepositoryIds.length > 0 && allRepositories.length > 0) {
      const saved = allRepositories.filter((repo) => savedRepositoryIds.includes(repo.id))
      setSavedRepositories(saved)
    } else {
      setSavedRepositories([])
    }
  }, [savedRepositoryIds, allRepositories])

  // Listen for storage changes (when repositories are saved/unsaved)
  useEffect(() => {
    if (typeof window !== "undefined" && user) {
      const handleStorageChange = async () => {
        const userData = JSON.parse(localStorage.getItem("user") || "{}")
        if (userData.email) {
          // Reload saved repository IDs
          const savedKey = `savedRepositories_${userData.email}`
          const savedIds = localStorage.getItem(savedKey)
          if (savedIds) {
            setSavedRepositoryIds(JSON.parse(savedIds))
          } else {
            setSavedRepositoryIds([])
          }

          try {
            // Fetch saved repositories from API
            // Get userId if user is logged in
            const userId = userData.userId || userData.user_id
            const apiResponse = await getSavedRepositories(userId)

            let savedApiRepos: Repository[] = []
            if (apiResponse.status === "success" && apiResponse.data) {
              // Transform API response to match frontend format
              savedApiRepos = apiResponse.data
                .map((repo: any) => {
                  const avatar = repo.publisher_name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)

                  return {
                    id: String(repo.id),
                    title: repo.title,
                    abstract: repo.abstract,
                    publisher: {
                      name: repo.publisher_name,
                      avatar: avatar,
                      isVerified: repo.publisher_is_verified ?? false,
                    },
                    category: Array.isArray(repo.category) ? repo.category : [],
                    keywords: Array.isArray(repo.tags) ? repo.tags : [],
                    publishedDate: repo.publishedDate || new Date().toISOString().split("T")[0],
                    publishedStatus: repo.publishedStatus as "published" | "draft" | "unpublished",
                    pdfUrl: repo.pdfUrl || undefined,
                    views: repo.views ?? 0,
                    likes: repo.likes ?? 0,
                    isLiked: repo.isLiked ?? false,
                    rating: repo.rating ?? 0,
                    ratingCount: repo.rating_count ?? 0,
                  }
                })
            }

            // Set only the saved repositories (not all repositories)
            setAllRepositories(savedApiRepos)
          } catch (error) {
            console.error("Error fetching saved repositories:", error)
            // Fallback to empty array
            setAllRepositories([])
          }
        }
      }

      // Listen for custom events when repository is saved/unsaved
      window.addEventListener("repositorySaved", handleStorageChange)
      window.addEventListener("repositoryUnsaved", handleStorageChange)
      window.addEventListener("repositoryAdded", handleStorageChange)
      window.addEventListener("storage", handleStorageChange)

      return () => {
        window.removeEventListener("repositorySaved", handleStorageChange)
        window.removeEventListener("repositoryUnsaved", handleStorageChange)
        window.removeEventListener("repositoryAdded", handleStorageChange)
        window.removeEventListener("storage", handleStorageChange)
      }
    }
  }, [user])

  const filteredRepositories = useMemo(() => {
    return savedRepositories.filter((repo) => {
      // Filter by keywords
      if (filters.keywords) {
        const query = filters.keywords.toLowerCase()
        const matches =
          repo.title.toLowerCase().includes(query) ||
          repo.abstract.toLowerCase().includes(query) ||
          repo.keywords.some((keyword) => keyword.toLowerCase().includes(query)) ||
          repo.category.some((cat) => cat.toLowerCase().includes(query))
        if (!matches) return false
      }


      // Filter by year range
      if (filters.yearFrom || filters.yearTo) {
        const repoYear = parseInt(repo.publishedDate.split("-")[0])
        const yearFrom = filters.yearFrom ? parseInt(filters.yearFrom) : null
        const yearTo = filters.yearTo ? parseInt(filters.yearTo) : null

        if (yearFrom && repoYear < yearFrom) return false
        if (yearTo && repoYear > yearTo) return false
      }

      return true
    })
  }, [savedRepositories, filters])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="h-8 bg-muted rounded w-64 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]"></div>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row gap-6">
            <aside className="hidden lg:block w-full lg:w-64 shrink-0">
              <div className="border border-border rounded-lg p-6 bg-card space-y-6">
                <div className="space-y-4">
                  <div className="h-4 bg-muted rounded w-24 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]"></div>
                  </div>
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-8 bg-muted rounded w-full overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]" style={{ animationDelay: `${i * 100}ms` }}></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
            <div className="flex-1 min-w-0">
              <div className="mb-6">
                <div className="h-4 bg-muted rounded w-64 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]"></div>
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <RepositoryCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!user) {
    return null
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
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
              <BreadcrumbPage>Saved Repositories</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header Section */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
              <BookmarkCheck size={24} className="text-primary" />
              Saved Repositories
            </h1>
            <p className="text-sm text-muted-foreground">
              View and manage your saved research repositories
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filter Panel */}
          <aside className="hidden lg:block w-full lg:w-64 shrink-0">
            <FilterPanel
              onFilterChange={setFilters}
              onSearch={setSearchQuery}
              isOpen={true}
            />
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search and Filter Toggle */}
            <div className="flex gap-4 mb-8 flex-col sm:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search saved repositories..."
                  value={filters.keywords}
                  onChange={(e) => {
                    const value = e.target.value
                    setFilters((prev) => ({ ...prev, keywords: value }))
                    setSearchQuery(value)
                  }}
                  className="pl-10 bg-background border-border"
                  aria-label="Search saved repositories"
                />
              </div>
              <Button
                variant="outline"
                className="lg:hidden gap-2 bg-transparent"
                onClick={() => setIsFilterOpen(true)}
              >
                <Menu size={20} />
                Filters
              </Button>
            </div>

            {/* Mobile Filter Panel */}
            {isFilterOpen && (
              <FilterPanel
                onFilterChange={setFilters}
                onSearch={setSearchQuery}
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
              />
            )}

            {/* Results Count */}
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{filteredRepositories.length}</span> of{" "}
                <span className="font-semibold text-foreground">{savedRepositories.length}</span> saved repositories
              </p>
            </div>

            {/* Repository Grid or Empty State */}
            {filteredRepositories.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {filteredRepositories.map((repo) => (
                  <RepositoryCard
                    key={repo.id}
                    id={repo.id}
                    title={repo.title}
                    abstract={repo.abstract}
                    publisher={repo.publisher}
                    category={repo.category}
                    tags={repo.keywords}
                    publishedDate={repo.publishedDate}
                    publishedStatus={repo.publishedStatus}
                    pdfUrl={repo.pdfUrl}
                    views={repo.views}
                    likes={repo.likes}
                    isLiked={repo.isLiked}
                    rating={repo.rating}
                    ratingCount={repo.ratingCount}
                    user={user}
                    detailPath="/research"
                    onViewClick={() => {
                      setSelectedRepository(repo)
                      setIsModalOpen(true)
                    }}
                  />
                ))}
              </div>
            ) : savedRepositories.length === 0 ? (
              <div className="text-center py-16">
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                    <Bookmark size={40} className="text-muted-foreground" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No saved repositories yet
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  You haven't saved any repositories yet. Browse the research repository and save interesting papers to view them here later.
                </p>
                <Button
                  onClick={() => router.push("/")}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                >
                  <Search size={20} />
                  Browse Repositories
                </Button>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground mb-2">No repositories found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters or search terms
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Repository View Modal */}
      <RepositoryViewModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open)
          if (!open) {
            setSelectedRepository(null)
          }
        }}
        repository={selectedRepository}
        user={user}
      />
    </main>
  )
}
