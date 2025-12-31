"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Lock, ArrowRight, RefreshCw, ArrowLeft } from "lucide-react"
import { login } from "@/app/config/api"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [captchaAnswer, setCaptchaAnswer] = useState("")
  const [captchaQuestion, setCaptchaQuestion] = useState({ num1: 0, num2: 0 })
  const [captchaCorrect, setCaptchaCorrect] = useState(false)
  const [captchaTouched, setCaptchaTouched] = useState(false)

  // Check if user is already logged in
  useEffect(() => {
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

  // Generate captcha question on mount
  useEffect(() => {
    generateCaptcha()
  }, [])

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1
    const num2 = Math.floor(Math.random() * 10) + 1
    setCaptchaQuestion({ num1, num2 })
    setCaptchaAnswer("")
    setCaptchaCorrect(false)
    setCaptchaTouched(false)
  }

  const handleCaptchaChange = (value: string) => {
    setCaptchaAnswer(value)
    setCaptchaTouched(true)
    const answer = parseInt(value)
    const correctAnswer = captchaQuestion.num1 + captchaQuestion.num2
    setCaptchaCorrect(!isNaN(answer) && answer === correctAnswer)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Basic validation
      if (!email || !password) {
        setError("Please fill in all fields")
        setIsLoading(false)
        return
      }

      // Validate captcha
      const answer = parseInt(captchaAnswer)
      const correctAnswer = captchaQuestion.num1 + captchaQuestion.num2
      if (isNaN(answer) || answer !== correctAnswer) {
        setError("Please solve the captcha correctly")
        setIsLoading(false)
        return
      }

      // Call backend API for login
      const result = await login({
        email: email,
        password: password,
      })

      if (result.status === "success" && result.user) {
        // Store user data
        const userData = result.user
        const user = {
          name: userData.user_name || email.split("@")[0],
          email: userData.user_email,
          avatar: (userData.user_name || email.split("@")[0]).charAt(0).toUpperCase(),
          role: userData.user_role || "publisher",
          userId: userData.user_id,
          uniqueId: userData.user_unique_id,
        }

        // Store extended profile data from database
        const extendedProfile = {
          institution: userData.user_school || "",
          department: userData.user_department || "",
          position: userData.user_type || "",
          contactNumber: userData.user_contact || "",
          address: userData.user_address || "",
        }

        localStorage.setItem("user", JSON.stringify(user))
        localStorage.setItem(`userProfile_${userData.user_email}`, JSON.stringify(extendedProfile))

        // Redirect based on role (default to publisher) - use replace to prevent back navigation
        const userRole = userData.user_role || "publisher"
        if (userRole === "admin") {
          window.history.replaceState(null, "", "/admin/dashboard")
          router.replace("/admin/dashboard")
        } else {
          window.history.replaceState(null, "", "/publisher")
          router.replace("/publisher")
        }
      } else {
        setError(result.message || "Login failed. Please try again.")
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Dark Teal/Cyan Background with Logo, Details, and Quote */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1a3a3f] p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="relative z-10">
          {/* Back Button */}
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to home
            </Button>
          </div>

          {/* Logo Section */}
          <div className="mb-12">
            <Link href="/" className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-[#1a3a3f] text-xl font-bold">BT</span>
              </div>
              <span className="text-white text-2xl font-bold">Breakthrough</span>
            </Link>
          </div>

          {/* Details Section */}
          <div className="mb-12 space-y-6">
            <h2 className="text-white text-4xl font-bold leading-tight">
              Welcome to Breakthrough
            </h2>
            <p className="text-teal-50 text-lg leading-relaxed">
              Your gateway to academic research repositories. Discover, manage, and share knowledge with ease.
            </p>
            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                </div>
                <p className="text-teal-50">Access thousands of research repositories</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                </div>
                <p className="text-teal-50">Manage your publications and research</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                </div>
                <p className="text-teal-50">Connect with researchers worldwide</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quote Section */}
        <div className="relative z-10 mt-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <p className="text-white text-lg italic leading-relaxed mb-4">
              "Knowledge shared is knowledge multiplied. Breakthrough makes it possible for researchers to connect, collaborate, and create impact."
            </p>
            <p className="text-teal-100 text-sm font-medium">
              — Research Community
            </p>
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4 lg:hidden">
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                <span className="text-accent-foreground text-lg font-bold">BT</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
            <p className="text-muted-foreground">Sign in to your Breakthrough account</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-input border-border"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-foreground font-medium">
                  Password
                </Label>
                <Link href="#" className="text-sm text-accent hover:text-accent/80 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-input border-border"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Math Captcha */}
            <div className="bg-muted/50 rounded-lg border border-border p-4 space-y-4">
              {/* Header with text and reset button */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-foreground">Please solve this simple math problem:</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={generateCaptcha}
                  disabled={isLoading}
                  className="h-8 gap-2"
                  aria-label="Reset captcha"
                >
                  <RefreshCw size={14} />
                  Reset
                </Button>
              </div>

              {/* Math problem display */}
              <div className="flex items-center justify-center gap-2">
                {/* First number box */}
                <div className="w-16 h-12 bg-background border border-border rounded flex items-center justify-center">
                  <span className="text-lg font-semibold text-foreground">
                    {captchaQuestion.num1}
                  </span>
                </div>

                {/* Plus sign */}
                <span className="text-lg font-semibold text-foreground">+</span>

                {/* Second number box */}
                <div className="w-16 h-12 bg-background border border-border rounded flex items-center justify-center">
                  <span className="text-lg font-semibold text-foreground">
                    {captchaQuestion.num2}
                  </span>
                </div>

                {/* Equals sign */}
                <span className="text-lg font-semibold text-foreground">=</span>

                {/* Answer input box */}
                <Input
                  id="captcha"
                  type="number"
                  value={captchaAnswer}
                  onChange={(e) => handleCaptchaChange(e.target.value)}
                  className={`w-16 h-12 text-center text-lg font-semibold bg-background ${
                    captchaTouched && captchaAnswer !== ""
                      ? captchaCorrect
                        ? "border-green-500 dark:border-green-400 ring-2 ring-green-500/20 dark:ring-green-400/20"
                        : "border-red-500 dark:border-red-400 ring-2 ring-red-500/20 dark:ring-red-400/20"
                      : "border-border"
                  }`}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 font-medium gap-2"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
              {!isLoading && <ArrowRight size={16} />}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-sm text-muted-foreground">New to Breakthrough?</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>

          {/* Sign Up Link */}
          <Link href="/auth/signup">
            <Button variant="outline" className="w-full bg-transparent border-border">
              Create an Account
            </Button>
          </Link>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            By signing in, you agree to our{" "}
            <Link href="#" className="text-accent hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" className="text-accent hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
