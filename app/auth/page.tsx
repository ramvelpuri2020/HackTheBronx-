"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Heart, ArrowRight, Shield, Mail, Lock, User, Eye, EyeOff, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signUp, signIn, getUserProfile } from "@/lib/auth"

export default function AuthPage() {
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const router = useRouter()

  // This ensures hydration issues are avoided
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Sign Up Form
  const [signUpData, setSignUpData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  // Sign In Form
  const [signInData, setSignInData] = useState({
    email: "",
    password: "",
  })

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreedToTerms) {
      setMessage({ type: "error", text: "Please agree to the terms and privacy policy to continue." })
      return
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." })
      return
    }

    if (signUpData.password.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters long." })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      await signUp(signUpData.email, signUpData.password, signUpData.name)
      setEmailSent(true)
      setMessage({
        type: "success",
        text: "Welcome to LiftLoop! Please check your email and click the verification link to complete your account setup.",
      })
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to create account" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const { user } = await signIn(signInData.email, signInData.password)

      if (user) {
        // Check if user has completed onboarding
        const profile = await getUserProfile(user.id)

        if (profile.onboarding_completed) {
          router.push("/dashboard")
        } else {
          router.push("/onboarding")
        }
      }
    } catch (error: any) {
      if (error.message.includes("Email not confirmed")) {
        setMessage({
          type: "error",
          text: "Please check your email and click the verification link before signing in.",
        })
      } else if (error.message.includes("Invalid login credentials")) {
        setMessage({
          type: "error",
          text: "Invalid email or password. Please check your credentials and try again.",
        })
      } else {
        setMessage({ type: "error", text: error.message || "Failed to sign in" })
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isClient) {
    return null // Return nothing during SSR to avoid hydration mismatch
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-green-600">Welcome to LiftLoop!</CardTitle>
              <CardDescription>Your account has been created successfully</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-2">Check Your Email</h3>
                <p className="text-sm text-green-700">
                  We've sent a verification link to <strong>{signUpData.email}</strong>
                </p>
                <p className="text-sm text-green-700 mt-2">
                  Click the link in your email to verify your account and start finding resources!
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  After verifying your email, you can sign in to complete your profile.
                </p>
                <Button variant="outline" onClick={() => setEmailSent(false)} className="w-full">
                  Back to Sign In
                </Button>
              </div>

              <div className="text-xs text-gray-500">
                <p>Didn't receive the email? Check your spam folder or try signing up again.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              LiftLoop
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to LiftLoop</h1>
          <p className="text-gray-600">Create your account to get personalized resource recommendations</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Get Started</CardTitle>
            <CardDescription>Join thousands of Bronx residents finding the help they need</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signup" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                <TabsTrigger value="signin">Sign In</TabsTrigger>
              </TabsList>

              {message && (
                <Alert
                  className={message.type === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}
                >
                  <AlertDescription className={message.type === "error" ? "text-red-800" : "text-green-800"}>
                    {message.text}
                  </AlertDescription>
                </Alert>
              )}

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={signUpData.name}
                        onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="signup-email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={signUpData.email}
                        onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password (min 6 characters)"
                        value={signUpData.password}
                        onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                        required
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirm-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={signUpData.confirmPassword}
                        onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 pt-2">
                    <Checkbox
                      id="terms"
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                    />
                    <Label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                      I agree to the{" "}
                      <Link href="/terms" className="text-blue-600 hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-blue-600 hover:underline">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                    disabled={isLoading || !agreedToTerms}
                  >
                    {isLoading ? (
                      "Creating Account..."
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="signin-email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email"
                        value={signInData.email}
                        onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={signInData.password}
                        onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                        required
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                      Forgot your password?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      "Signing In..."
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 text-blue-800">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Your Privacy Matters</span>
              </div>
              <p className="text-xs text-blue-700 mt-1">
                Your information is encrypted and secure. We never share your data with third parties.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Need immediate help? <span className="font-medium">Call 911 (Emergency) or 311 (City Services)</span>
          </p>
        </div>
      </div>
    </div>
  )
}
