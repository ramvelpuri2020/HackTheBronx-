"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <h2 className="text-3xl font-bold text-center">Sign In</h2>
        <p className="text-center text-gray-600">Authentication will be implemented here</p>
      </div>
    </div>
  )
}
