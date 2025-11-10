"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Lock, ArrowRight, RefreshCw } from "lucide-react"
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
        }

        localStorage.setItem("user", JSON.stringify(user))

        // Redirect based on role (default to publisher)
        const userRole = userData.user_role || "publisher"
        if (userRole === "admin") {
          router.push("/admin/dashboard")
        } else {
          router.push("/publisher")
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
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
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
      </main>
    </div>
  )
}
