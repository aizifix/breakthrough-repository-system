"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X, Filter } from "lucide-react"

interface FilterPanelProps {
  onFilterChange: (filters: FilterState) => void
  onSearch: (query: string) => void
  isOpen?: boolean
  onClose?: () => void
}

export interface FilterState {
  departments: string[]
  researchTypes: string[]
  yearFrom: string
  yearTo: string
  keywords: string
}

interface FilterOption {
  id: number
  name: string
  description?: string
}

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 50 }, (_, i) => CURRENT_YEAR - i)

export default function FilterPanel({ onFilterChange, onSearch, isOpen, onClose }: FilterPanelProps) {
  const [filters, setFilters] = useState<FilterState>({
    departments: [],
    researchTypes: [],
    yearFrom: "",
    yearTo: "",
    keywords: "",
  })
  const [departments, setDepartments] = useState<FilterOption[]>([])
  const [researchTypes, setResearchTypes] = useState<FilterOption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load filter options from API
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const response = await fetch("http://localhost/repository-api/filters.php?operation=get_all_filters")
        const result = await response.json()
        if (result.status === "success") {
          setDepartments(result.data.departments || [])
          setResearchTypes(result.data.researchTypes || [])
        }
      } catch (error) {
        console.error("Failed to load filters:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadFilters()
  }, [])

  // Track if this is the initial mount
  const isInitialMount = useRef(true)

  // Update parent when filters change (deferred to avoid render issues)
  useEffect(() => {
    // Skip the initial mount to avoid calling onFilterChange with empty filters
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    onFilterChange(filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const handleCheckboxChange = (category: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const array = prev[category] as string[]
      const updated = array.includes(value) ? array.filter((item) => item !== value) : [...array, value]
      return { ...prev, [category]: updated }
    })
  }

  const handleKeywordChange = (value: string) => {
    setFilters((prev) => ({ ...prev, keywords: value }))
    onSearch(value)
  }

  const handleReset = () => {
    const emptyFilters = {
      departments: [],
      researchTypes: [],
      yearFrom: "",
      yearTo: "",
      keywords: "",
    }
    setFilters(emptyFilters)
    onFilterChange(emptyFilters)
    onSearch("")
  }

  const activeFilterCount =
    filters.departments.length +
    filters.researchTypes.length +
    (filters.yearFrom || filters.yearTo ? 1 : 0) +
    (filters.keywords ? 1 : 0)

  return (
    <div
      className={`fixed inset-0 z-40 bg-black/50 lg:static lg:bg-transparent lg:z-auto transition-all ${
        isOpen ? "visible" : "hidden lg:visible"
      }`}
      onClick={onClose}
    >
      <div
        className="fixed left-0 top-0 h-full w-full max-w-sm lg:static lg:w-auto bg-card border-r border-border overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6 lg:block">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-accent" />
            <h2 className="text-xl font-bold text-foreground">Filters</h2>
          </div>
          <button onClick={onClose} className="lg:hidden" aria-label="Close filters">
            <X size={24} />
          </button>
        </div>

        {/* Keyword Search */}
        <div className="mb-6">
          <Label htmlFor="keywords" className="mb-2 block">
            Search Keywords
          </Label>
          <Input
            id="keywords"
            type="text"
            placeholder="Search..."
            value={filters.keywords}
            onChange={(e) => handleKeywordChange(e.target.value)}
            className="bg-background border-border"
          />
        </div>

        {/* Departments */}
        <div className="mb-6">
          <h3 className="font-semibold text-foreground mb-3 text-sm">Department</h3>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <div className="space-y-2">
              {departments.map((dept) => (
                <label key={dept.id} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.departments.includes(dept.name)}
                    onChange={() => handleCheckboxChange("departments", dept.name)}
                    className="rounded border-border"
                    aria-label={`Filter by department: ${dept.name}`}
                  />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    {dept.name}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Research Types */}
        <div className="mb-6">
          <h3 className="font-semibold text-foreground mb-3 text-sm">Research Type</h3>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <div className="space-y-2">
              {researchTypes.map((type) => (
                <label key={type.id} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.researchTypes.includes(type.name)}
                    onChange={() => handleCheckboxChange("researchTypes", type.name)}
                    className="rounded border-border"
                    aria-label={`Filter by research type: ${type.name}`}
                  />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    {type.name}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Publication Year Range */}
        <div className="mb-6">
          <h3 className="font-semibold text-foreground mb-3 text-sm">Publication Year Range</h3>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="yearFrom" className="text-xs text-muted-foreground">From Year</Label>
              <Select
                value={filters.yearFrom || undefined}
                onValueChange={(value) => {
                  setFilters((prev) => ({ ...prev, yearFrom: value }))
                }}
              >
                <SelectTrigger className="bg-background border-border h-9 text-sm">
                  <SelectValue placeholder="Select start year" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {YEARS.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearTo" className="text-xs text-muted-foreground">To Year</Label>
              <Select
                value={filters.yearTo || undefined}
                onValueChange={(value) => {
                  setFilters((prev) => ({ ...prev, yearTo: value }))
                }}
              >
                <SelectTrigger className="bg-background border-border h-9 text-sm">
                  <SelectValue placeholder="Select end year" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {YEARS.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(filters.yearFrom || filters.yearTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters((prev) => ({ ...prev, yearFrom: "", yearTo: "" }))}
                className="w-full text-xs h-7"
              >
                Clear Year Filter
              </Button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-6 border-t border-border">
          <Button
            variant="outline"
            className="flex-1 bg-transparent"
            onClick={handleReset}
            disabled={activeFilterCount === 0}
          >
            Reset
          </Button>
          <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
            Apply {activeFilterCount > 0 && `(${activeFilterCount})`}
          </Button>
        </div>
      </div>
    </div>
  )
}
