"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Mail, Lock, User, ArrowRight, ArrowLeft, Check, Building2, Shield, XIcon } from "lucide-react"
import { register } from "@/app/config/api"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const TOTAL_STEPS = 4

export default function SignupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Account Info
    firstName: "",
    lastName: "",
    suffix: "",
    email: "",
    password: "",
    confirmPassword: "",
    // Institution Info
    institution: "",
    department: "",
    position: "",
    studentIdNumber: "",
    studentIdImage: "",
    // Contact Info
    contactNumber: "",
    // Address Info
    city: "",
    province: "",
    zipCode: "",
    country: "",
    // System
    accountType: "Publisher",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [captchaAnswer, setCaptchaAnswer] = useState("")
  const [captchaQuestion, setCaptchaQuestion] = useState({ num1: 0, num2: 0 })
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [consentModalOpen, setConsentModalOpen] = useState(false)
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false)

  // Check if user is already logged in
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user")
      if (stored) {
        const userData = JSON.parse(stored)
        const userRole = userData.role || "publisher"
        // Redirect to appropriate dashboard and prevent back navigation
        if (userRole === "admin") {
          window.history.replaceState(null, "", "/admin/dashboard")
          router.replace("/admin/dashboard")
        } else {
          window.history.replaceState(null, "", "/publisher")
          router.replace("/publisher")
        }
      }
    }
  }, [router])

  // Generate captcha question on mount and when needed
  React.useEffect(() => {
    if (currentStep === 4) {
      const num1 = Math.floor(Math.random() * 10) + 1
      const num2 = Math.floor(Math.random() * 10) + 1
      setCaptchaQuestion({ num1, num2 })
      setCaptchaAnswer("")
    }
  }, [currentStep])

  // Password validation
  const passwordRequirements = {
    minLength: formData.password.length >= 8,
    hasUpperCase: /[A-Z]/.test(formData.password),
    hasLowerCase: /[a-z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
  }

  const isPasswordValid = Object.values(passwordRequirements).every(Boolean)

  // Capitalize first letter helper
  const capitalizeFirst = (str: string) => {
    if (!str) return str
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }

  // Handle name input with auto-capitalization
  const handleNameChange = (field: 'firstName' | 'lastName', value: string) => {
    // Only allow letters and spaces
    const cleaned = value.replace(/[^a-zA-Z\s]/g, '')
    // Capitalize first letter of each word
    const capitalized = cleaned.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
    setFormData({ ...formData, [field]: capitalized })
  }

  // Handle phone number with +63 prefix and 10-digit limit
  const handlePhoneChange = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')

    // If starts with 63, remove it (we'll add +63 prefix)
    let phoneDigits = digits.startsWith('63') ? digits.slice(2) : digits

    // Limit to 10 digits
    phoneDigits = phoneDigits.slice(0, 10)

    // Format: +63 XXXX XXX XXX
    let formatted = ''
    if (phoneDigits.length > 0) {
      formatted = '+63'
      if (phoneDigits.length > 0) formatted += ' ' + phoneDigits.slice(0, 4)
      if (phoneDigits.length > 4) formatted += ' ' + phoneDigits.slice(4, 7)
      if (phoneDigits.length > 7) formatted += ' ' + phoneDigits.slice(7, 10)
    }

    setFormData({ ...formData, contactNumber: formatted })
  }

  const validateStep = (step: number): boolean => {
    setError("")

    switch (step) {
      case 1: // Account Info
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
          setError("Please fill in all required fields")
          return false
        }
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match")
          return false
        }
        if (!isPasswordValid) {
          setError("Password does not meet all requirements")
          return false
        }
        return true

      case 2: // Institution Info
        if (!formData.institution || !formData.department || !formData.position || !formData.studentIdNumber || !formData.studentIdImage) {
          setError("Please fill in all required fields")
          return false
        }
        return true

      case 3: // Address Info
        if (!formData.city || !formData.province || !formData.zipCode || !formData.country) {
          setError("Please fill in all required address fields")
          return false
        }
        return true

      case 4: // Final step
        const correctAnswer = captchaQuestion.num1 + captchaQuestion.num2
        if (captchaAnswer !== correctAnswer.toString()) {
          setError("Captcha answer is incorrect")
          return false
        }
        if (!acceptedTerms) {
          setError("Please accept the terms and conditions")
          return false
        }
        return true

      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < TOTAL_STEPS) {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (!validateStep(TOTAL_STEPS)) {
        setIsLoading(false)
        return
      }

      // Combine name with suffix
      const fullName = formData.suffix && formData.suffix !== "none"
        ? `${formData.firstName} ${formData.lastName} ${formData.suffix}`
        : `${formData.firstName} ${formData.lastName}`

      // Combine address
      const fullAddress = `${formData.city}, ${formData.province} ${formData.zipCode}, ${formData.country}`

      // Call backend API for registration
      const result = await register({
        user_name: fullName,
        user_email: formData.email,
        user_pwd: formData.password,
        user_school: formData.institution,
        user_department: formData.department,
        user_type: formData.position,
        user_contact: formData.contactNumber || "",
        user_address: fullAddress,
        captcha: captchaAnswer,
        student_id_number: formData.studentIdNumber,
        student_id_image: formData.studentIdImage,
      })

      if (result.status === "success") {
        // Store user data
        const user = {
          name: fullName,
          email: formData.email,
          avatar: formData.firstName.charAt(0).toUpperCase(),
          role: "publisher",
          userId: result.user_id,
          uniqueId: result.user_unique_id,
        }

        // Store extended profile data
        const extendedProfile = {
          institution: formData.institution,
          department: formData.department,
          position: formData.position,
          contactNumber: formData.contactNumber,
          address: fullAddress,
          studentIdNumber: formData.studentIdNumber,
          studentIdImage: formData.studentIdImage,
        }

        localStorage.setItem("user", JSON.stringify(user))
        localStorage.setItem(`userProfile_${formData.email}`, JSON.stringify(extendedProfile))

        // Show success message with unique ID
        alert(`Registration successful!\n\nYour unique identifier is:\n${result.user_unique_id}\n\nPlease save this ID for future reference.`)

        router.push("/auth/login")
      } else {
        setError(result.message || "Registration failed. Please try again.")
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const passwordMatch = formData.password === formData.confirmPassword && formData.confirmPassword !== ""

  const steps = [
    { number: 1, title: "Account Info", icon: User },
    { number: 2, title: "Institution", icon: Building2 },
    { number: 3, title: "Address", icon: Building2 },
    { number: 4, title: "Review", icon: Shield },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col px-4 py-4 sm:py-8 md:py-12">
        <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col">
          {/* Header - Mobile: Just logo and step title */}
          <div className="text-center mb-6 md:mb-8">
            {/* Mobile: Simple logo and step title */}
            <div className="md:hidden">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                  <span className="text-accent-foreground text-lg font-bold">BT</span>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-foreground">{steps[currentStep - 1].title}</h2>
            </div>

            {/* Desktop: Full header with progress */}
            <div className="hidden md:block">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                  <span className="text-accent-foreground text-lg font-bold">BT</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Join Breakthrough</h1>
              <p className="text-muted-foreground">Create your account to access research publications</p>
            </div>
          </div>

          {/* Progress Indicator - Desktop only */}
          <div className="hidden md:block mb-8">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isActive = currentStep === step.number
                const isCompleted = currentStep > step.number

                return (
                  <React.Fragment key={step.number}>
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                          isActive
                            ? "bg-primary border-primary text-primary-foreground"
                            : isCompleted
                            ? "bg-green-600 border-green-600 text-white"
                            : "bg-background border-border text-muted-foreground"
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </div>
                      <span className={`text-xs mt-2 text-center ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {step.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-2 transition-colors ${
                          isCompleted ? "bg-green-600" : "bg-border"
                        }`}
                      />
                    )}
                  </React.Fragment>
                )
              })}
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Step {currentStep} of {TOTAL_STEPS}
              </p>
            </div>
          </div>

          {/* Form - Takes full height on mobile */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-4 sm:space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Step 1: Account Info */}
            {currentStep === 1 && (
              <div className="flex-1 flex flex-col space-y-4 sm:space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-foreground font-medium">
                      First Name <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) => handleNameChange('firstName', e.target.value)}
                        className="pl-10 bg-input border-border"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-foreground font-medium">
                      Last Name <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) => handleNameChange('lastName', e.target.value)}
                        className="pl-10 bg-input border-border"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="suffix" className="text-foreground font-medium">
                    Suffix <span className="text-muted-foreground text-xs">(optional)</span>
                  </Label>
                  <Select
                    value={formData.suffix || undefined}
                    onValueChange={(value) => setFormData({ ...formData, suffix: value === "none" ? "" : value })}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-full bg-input border-border">
                      <SelectValue placeholder="Select suffix (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="Jr.">Jr.</SelectItem>
                      <SelectItem value="Sr.">Sr.</SelectItem>
                      <SelectItem value="II">II</SelectItem>
                      <SelectItem value="III">III</SelectItem>
                      <SelectItem value="IV">IV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-medium">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10 bg-input border-border"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-medium">
                    Password <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-10 bg-input border-border"
                      disabled={isLoading}
                    />
                  </div>
                  {/* Password Requirements Checklist */}
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2 mt-2">
                    <p className="text-xs font-medium text-foreground mb-2">Password Requirements:</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        {passwordRequirements.minLength ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
                        )}
                        <span className={`text-xs ${passwordRequirements.minLength ? 'text-green-600' : 'text-muted-foreground'}`}>
                          At least 8 characters
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {passwordRequirements.hasUpperCase ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
                        )}
                        <span className={`text-xs ${passwordRequirements.hasUpperCase ? 'text-green-600' : 'text-muted-foreground'}`}>
                          One uppercase letter
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {passwordRequirements.hasLowerCase ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
                        )}
                        <span className={`text-xs ${passwordRequirements.hasLowerCase ? 'text-green-600' : 'text-muted-foreground'}`}>
                          One lowercase letter
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {passwordRequirements.hasNumber ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
                        )}
                        <span className={`text-xs ${passwordRequirements.hasNumber ? 'text-green-600' : 'text-muted-foreground'}`}>
                          One number
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {passwordRequirements.hasSpecialChar ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
                        )}
                        <span className={`text-xs ${passwordRequirements.hasSpecialChar ? 'text-green-600' : 'text-muted-foreground'}`}>
                          One special character
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-foreground font-medium">
                    Confirm Password <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="pl-10 bg-input border-border"
                      disabled={isLoading}
                    />
                  </div>
                  {formData.confirmPassword && (
                    <div className="flex items-center gap-2">
                      {passwordMatch ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-green-600">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <div className="w-4 h-4 rounded-full bg-destructive/30" />
                          <span className="text-xs text-destructive">Passwords do not match</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Institution & Contact Info */}
            {currentStep === 2 && (
              <div className="flex-1 flex flex-col space-y-4 sm:space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="institution" className="text-foreground font-medium">
                    School / Institution <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="institution"
                    type="text"
                    placeholder="University of Example"
                    value={formData.institution}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    className="bg-input border-border"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department" className="text-foreground font-medium">
                    Department / College / Unit <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="department"
                    type="text"
                    placeholder="Computer Science Department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="bg-input border-border"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position" className="text-foreground font-medium">
                    Position / Role <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.position}
                    onValueChange={(value) => setFormData({ ...formData, position: value })}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-full bg-input border-border">
                      <SelectValue placeholder="Select your position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Student">Student</SelectItem>
                      <SelectItem value="Faculty">Faculty</SelectItem>
                      <SelectItem value="Researcher">Researcher</SelectItem>
                      <SelectItem value="Librarian">Librarian</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactNumber" className="text-foreground font-medium">
                    Contact Number <span className="text-muted-foreground text-xs">(optional)</span>
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      <span className="text-lg">🇵🇭</span>
                      <span className="text-sm text-muted-foreground">+63</span>
                    </div>
                    <Input
                      id="contactNumber"
                      type="tel"
                      placeholder="9123 456 789"
                      value={formData.contactNumber}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className="pl-20 bg-input border-border"
                      disabled={isLoading}
                      maxLength={17} // +63 XXXX XXX XXX = 17 chars
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Philippines (+63) - 10 digits</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentIdNumber" className="text-foreground font-medium">
                    Student ID Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="studentIdNumber"
                    type="text"
                    placeholder="e.g., 2021-12345"
                    value={formData.studentIdNumber}
                    onChange={(e) => setFormData({ ...formData, studentIdNumber: e.target.value })}
                    className="bg-input border-border"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="studentIdImage" className="text-foreground font-medium">
                    Student ID Photo <span className="text-destructive">*</span>
                  </Label>
                  {formData.studentIdImage ? (
                    <div className="rounded-lg border border-border bg-muted/30 p-4 flex flex-col gap-4">
                      <div className="w-full overflow-hidden rounded-md border border-border bg-background">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={formData.studentIdImage}
                          alt="Student ID preview"
                          className="w-full h-48 object-contain bg-background"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="bg-transparent border-border"
                          onClick={() => {
                            setFormData({ ...formData, studentIdImage: "" })
                          }}
                          disabled={isLoading}
                        >
                          Remove Photo
                        </Button>
                        <label className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null
                              if (!file) {
                                setFormData({ ...formData, studentIdImage: "" })
                                return
                              }
                              if (!file.type.startsWith("image/")) {
                                setError("Please upload a valid image file for your student ID.")
                                return
                              }
                              const maxSizeMB = 5
                              if (file.size > maxSizeMB * 1024 * 1024) {
                                setError(`Image size should not exceed ${maxSizeMB}MB.`)
                                return
                              }
                              const reader = new FileReader()
                              reader.onloadend = () => {
                                setFormData({ ...formData, studentIdImage: reader.result as string })
                              }
                              reader.readAsDataURL(file)
                            }}
                            disabled={isLoading}
                          />
                          <span className="inline-flex h-10 w-full items-center justify-center rounded-md border border-border bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
                            Replace Photo
                          </span>
                        </label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Please upload a clear photo of the front side of your valid student ID. Supported formats: JPG, PNG. Max size 5MB.
                      </p>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
                      <input
                        id="studentIdImage"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          if (!file) {
                            setFormData({ ...formData, studentIdImage: "" })
                            return
                          }
                          if (!file.type.startsWith("image/")) {
                            setError("Please upload a valid image file for your student ID.")
                            return
                          }
                          const maxSizeMB = 5
                          if (file.size > maxSizeMB * 1024 * 1024) {
                            setError(`Image size should not exceed ${maxSizeMB}MB.`)
                            return
                          }
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            setFormData({ ...formData, studentIdImage: reader.result as string })
                          }
                          reader.readAsDataURL(file)
                        }}
                        disabled={isLoading}
                      />
                      <div className="flex flex-col items-center gap-2 text-center">
                        <Building2 className="w-8 h-8 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Upload Student ID</p>
                          <p className="text-xs text-muted-foreground">JPG or PNG (max 5MB)</p>
                        </div>
                      </div>
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Address Info */}
            {currentStep === 3 && (
              <div className="flex-1 flex flex-col space-y-4 sm:space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-foreground font-medium">
                      City <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="city"
                      type="text"
                      placeholder="City"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="bg-input border-border"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="province" className="text-foreground font-medium">
                      Province <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="province"
                      type="text"
                      placeholder="Province"
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      className="bg-input border-border"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zipCode" className="text-foreground font-medium">
                      ZIP Code <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="zipCode"
                      type="text"
                      placeholder="1234"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      className="bg-input border-border"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-foreground font-medium">
                      Country <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.country}
                      onValueChange={(value) => setFormData({ ...formData, country: value })}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="w-full bg-input border-border">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Philippines">Philippines</SelectItem>
                        <SelectItem value="United States">United States</SelectItem>
                        <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                        <SelectItem value="Canada">Canada</SelectItem>
                        <SelectItem value="Australia">Australia</SelectItem>
                        <SelectItem value="Japan">Japan</SelectItem>
                        <SelectItem value="South Korea">South Korea</SelectItem>
                        <SelectItem value="Singapore">Singapore</SelectItem>
                        <SelectItem value="Malaysia">Malaysia</SelectItem>
                        <SelectItem value="Indonesia">Indonesia</SelectItem>
                        <SelectItem value="Thailand">Thailand</SelectItem>
                        <SelectItem value="Vietnam">Vietnam</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review & Submit */}
            {currentStep === 4 && (
              <div className="flex-1 flex flex-col space-y-4 sm:space-y-5">
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-foreground mb-4">Review Your Information</h3>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>{" "}
                      <span className="text-foreground font-medium">
                        {formData.firstName} {formData.lastName} {formData.suffix && formData.suffix !== "none" ? formData.suffix : ""}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>{" "}
                      <span className="text-foreground font-medium">{formData.email}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Institution:</span>{" "}
                      <span className="text-foreground font-medium">{formData.institution}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Department:</span>{" "}
                      <span className="text-foreground font-medium">{formData.department}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Position:</span>{" "}
                      <span className="text-foreground font-medium">{formData.position}</span>
                    </div>
                    {formData.contactNumber && (
                      <div>
                        <span className="text-muted-foreground">Contact:</span>{" "}
                        <span className="text-foreground font-medium">{formData.contactNumber}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Student ID No.:</span>{" "}
                      <span className="text-foreground font-medium">{formData.studentIdNumber}</span>
                    </div>
                    <div className="space-y-2">
                      <span className="text-muted-foreground block">Student ID Photo:</span>
                      {formData.studentIdImage ? (
                        <div className="rounded-md border border-border bg-background p-2 w-full md:w-1/2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={formData.studentIdImage}
                            alt="Student ID preview"
                            className="w-full h-40 object-contain"
                          />
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No photo uploaded</p>
                      )}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Address:</span>{" "}
                      <span className="text-foreground font-medium">
                        {formData.city}, {formData.province} {formData.zipCode}, {formData.country}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Captcha - Improved Layout */}
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">
                    Security Verification <span className="text-destructive">*</span>
                  </Label>
                  <div className="bg-muted/50 rounded-lg border border-border p-4">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <div className="w-16 h-12 bg-background border border-border rounded flex items-center justify-center">
                        <span className="text-lg font-semibold text-foreground">
                          {captchaQuestion.num1}
                        </span>
                      </div>
                      <span className="text-lg font-semibold text-foreground">+</span>
                      <div className="w-16 h-12 bg-background border border-border rounded flex items-center justify-center">
                        <span className="text-lg font-semibold text-foreground">
                          {captchaQuestion.num2}
                        </span>
                      </div>
                      <span className="text-lg font-semibold text-foreground">=</span>
                      <Input
                        type="number"
                        placeholder="?"
                        value={captchaAnswer}
                        onChange={(e) => setCaptchaAnswer(e.target.value)}
                        className="w-16 h-12 text-center text-lg font-semibold bg-background border-border"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor="terms"
                    className="text-sm text-foreground cursor-pointer leading-relaxed"
                  >
                    I agree to the{" "}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        setConsentModalOpen(true)
                      }}
                      className="text-accent hover:underline"
                    >
                      Consent to Data Processing
                    </button>{" "}
                    and{" "}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        setPrivacyModalOpen(true)
                      }}
                      className="text-accent hover:underline"
                    >
                      Privacy Policy
                    </button>
                    <span className="text-destructive"> *</span>
                  </Label>
                </div>
              </div>
            )}

            {/* Navigation Buttons - Sticky on mobile */}
            <div className="flex gap-3 pt-4 mt-auto pb-4 sm:pb-0">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  className="flex-1 sm:flex-initial bg-transparent border-border min-w-[100px]"
                  disabled={isLoading}
                >
                  <ArrowLeft size={16} className="mr-2" />
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              )}
              {currentStep < TOTAL_STEPS ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-10 sm:h-10 font-medium gap-2"
                  disabled={isLoading}
                >
                  <span>Next</span>
                  <ArrowRight size={16} />
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-10 font-medium gap-2"
                  disabled={isLoading || !acceptedTerms}
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                  {!isLoading && <ArrowRight size={16} />}
                </Button>
              )}
            </div>
          </form>

          {/* Divider - Hidden on mobile, shown on desktop */}
          <div className="hidden sm:flex my-4 sm:my-6 items-center gap-4">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-sm text-muted-foreground">Already have an account?</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>

          {/* Login Link - Hidden on mobile, shown on desktop */}
          <div className="hidden sm:block">
            <Link href="/auth/login">
              <Button variant="outline" className="w-full bg-transparent border-border">
                Sign In Instead
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Consent Modal */}
      <Dialog open={consentModalOpen} onOpenChange={setConsentModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] p-0 flex flex-col" showCloseButton={false}>
          <div className="sticky top-0 z-10 bg-background border-b px-6 pt-6 pb-4">
            <div className="flex items-start justify-between gap-4">
              <DialogHeader className="flex-1">
                <DialogTitle>Consent to Data Processing</DialogTitle>
                <DialogDescription>
                  Please read and understand our data processing consent agreement.
                </DialogDescription>
              </DialogHeader>
              <DialogClose className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none flex-shrink-0 mt-1">
                <XIcon className="size-4" />
                <span className="sr-only">Close</span>
              </DialogClose>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 px-6 pb-6">
            <div className="space-y-4 text-sm text-foreground pt-4">
            <p>
              By creating an account, you consent to the processing of your personal data as described in this consent agreement.
            </p>
            <div>
              <h4 className="font-semibold mb-2">1. Data Collection</h4>
              <p>
                We collect personal information including your name, email address, institution details, and contact information to provide you with access to our research repository system.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">2. Purpose of Processing</h4>
              <p>
                Your data will be processed for the following purposes:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Account creation and management</li>
                <li>Access to research publications and repository features</li>
                <li>Communication regarding your account and platform updates</li>
                <li>Compliance with legal and regulatory requirements</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">3. Data Storage and Security</h4>
              <p>
                We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">4. Your Rights</h4>
              <p>
                You have the right to access, rectify, or delete your personal data at any time. You may also withdraw your consent, though this may affect your ability to use our services.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">5. Contact Information</h4>
              <p>
                If you have any questions about this consent agreement or wish to exercise your rights, please contact us through the provided channels.
              </p>
            </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Modal */}
      <Dialog open={privacyModalOpen} onOpenChange={setPrivacyModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] p-0 flex flex-col" showCloseButton={false}>
          <div className="sticky top-0 z-10 bg-background border-b px-6 pt-6 pb-4">
            <div className="flex items-start justify-between gap-4">
              <DialogHeader className="flex-1">
                <DialogTitle>Privacy Policy</DialogTitle>
                <DialogDescription>
                  Our commitment to protecting your privacy and personal information.
                </DialogDescription>
              </DialogHeader>
              <DialogClose className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none flex-shrink-0 mt-1">
                <XIcon className="size-4" />
                <span className="sr-only">Close</span>
              </DialogClose>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 px-6 pb-6">
            <div className="space-y-4 text-sm text-foreground pt-4">
            <p>
              This Privacy Policy describes how we collect, use, and protect your personal information when you use our research repository system.
            </p>
            <div>
              <h4 className="font-semibold mb-2">Information We Collect</h4>
              <p>
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Personal identification information (name, email address)</li>
                <li>Institutional affiliation and position</li>
                <li>Contact information</li>
                <li>Account credentials and usage data</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">How We Use Your Information</h4>
              <p>
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Process your account registration and manage your account</li>
                <li>Send you technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Monitor and analyze trends and usage</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Information Sharing</h4>
              <p>
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in limited circumstances, such as when required by law or to protect our rights.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Data Security</h4>
              <p>
                We implement industry-standard security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Changes to This Policy</h4>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Contact Us</h4>
              <p>
                If you have any questions about this Privacy Policy, please contact us through the provided support channels.
              </p>
            </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
