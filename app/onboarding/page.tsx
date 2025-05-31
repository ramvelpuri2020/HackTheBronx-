"use client"

import { useState, useEffect } from "react"
import { Heart, ArrowRight, ArrowLeft, Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { getCurrentUser, getUserProfile, updateUserProfile } from "@/lib/auth"

const questions = [
  {
    id: 1,
    title: "What's your current living situation?",
    subtitle: "This helps us understand your housing stability",
    type: "radio",
    options: [
      { value: "stable", label: "I have stable housing", emoji: "🏠" },
      { value: "temporary", label: "I'm staying temporarily with friends/family", emoji: "🛏️" },
      { value: "shelter", label: "I'm in a shelter or transitional housing", emoji: "🏢" },
      { value: "homeless", label: "I don't have a place to stay", emoji: "⛺" },
      { value: "risk", label: "I'm at risk of losing my housing", emoji: "⚠️" },
    ],
  },
  {
    id: 2,
    title: "What type of help are you looking for?",
    subtitle: "Select all that apply - we'll find resources for everything you need",
    type: "checkbox",
    options: [
      { value: "food", label: "Food assistance", emoji: "🥫" },
      { value: "housing", label: "Housing support", emoji: "🏠" },
      { value: "jobs", label: "Job training or employment", emoji: "💼" },
      { value: "education", label: "Education or GED programs", emoji: "📚" },
      { value: "mental-health", label: "Mental health support", emoji: "🧠" },
      { value: "healthcare", label: "Healthcare services", emoji: "🏥" },
      { value: "childcare", label: "Childcare or family support", emoji: "👶" },
      { value: "legal", label: "Legal assistance", emoji: "⚖️" },
    ],
  },
  {
    id: 3,
    title: "How urgent is your situation?",
    subtitle: "This helps us prioritize the most important resources for you",
    type: "radio",
    options: [
      { value: "immediate", label: "I need help today or this week", emoji: "🚨" },
      { value: "soon", label: "I need help within the next month", emoji: "⏰" },
      { value: "planning", label: "I'm planning ahead for future needs", emoji: "📅" },
      { value: "exploring", label: "I'm just exploring what's available", emoji: "🔍" },
    ],
  },
  {
    id: 4,
    title: "Do you have any of these situations?",
    subtitle: "This helps us find specialized programs you might qualify for",
    type: "checkbox",
    options: [
      { value: "children", label: "I have children under 18", emoji: "👨‍👩‍👧‍👦" },
      { value: "elderly", label: "I care for elderly family members", emoji: "👴" },
      { value: "disability", label: "I or a family member has a disability", emoji: "♿" },
      { value: "veteran", label: "I'm a veteran", emoji: "🎖️" },
      { value: "student", label: "I'm currently a student", emoji: "🎓" },
      { value: "pregnant", label: "I'm pregnant or recently gave birth", emoji: "🤱" },
      { value: "immigrant", label: "I'm new to the US or need immigration help", emoji: "🌍" },
    ],
  },
  {
    id: 5,
    title: "What area of the Bronx are you in or prefer?",
    subtitle: "We'll prioritize resources that are convenient for you",
    type: "radio",
    options: [
      { value: "south", label: "South Bronx (Mott Haven, Melrose, Port Morris)", emoji: "🗺️" },
      { value: "central", label: "Central Bronx (Concourse, Highbridge, Morris Heights)", emoji: "🗺️" },
      { value: "west", label: "West Bronx (Kingsbridge, Riverdale, Fordham)", emoji: "🗺️" },
      { value: "east", label: "East Bronx (Soundview, Castle Hill, Parkchester)", emoji: "🗺️" },
      { value: "north", label: "North Bronx (Norwood, Wakefield, Williamsbridge)", emoji: "🗺️" },
      { value: "any", label: "I can travel anywhere in the Bronx", emoji: "🚌" },
    ],
  },
  {
    id: 6,
    title: "Is there anything specific you'd like us to know?",
    subtitle: "Optional - share any details that might help us find better resources for you",
    type: "textarea",
    placeholder: "Tell us about your situation, any specific needs, or questions you have...",
  },
]

export default function OnboardingPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, any>>({})
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push("/auth")
        return
      }

      const profile = await getUserProfile(currentUser.id)
      setUser(currentUser)
      setUserProfile(profile)

      // If onboarding is already completed, redirect to dashboard
      if (profile.onboarding_completed) {
        router.push("/dashboard")
        return
      }

      // Load existing answers if any
      const { data: existingAnswers } = await supabase
        .from("onboarding_answers")
        .select("*")
        .eq("user_id", currentUser.id)

      if (existingAnswers) {
        const answersMap: Record<number, any> = {}
        existingAnswers.forEach((answer) => {
          answersMap[answer.question_id] = answer.answer
        })
        setAnswers(answersMap)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswer = (questionId: number, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const saveAnswer = async (questionId: number, answer: any) => {
    if (!user) return

    try {
      // Upsert the answer
      const { error } = await supabase.from("onboarding_answers").upsert(
        {
          user_id: user.id,
          question_id: questionId,
          answer: answer,
        },
        {
          onConflict: "user_id,question_id",
        },
      )

      if (error) throw error
    } catch (error: any) {
      console.error("Failed to save answer:", error)
    }
  }

  const handleNext = async () => {
    const currentAnswer = answers[questions[currentQuestion].id]
    if (currentAnswer !== undefined) {
      await saveAnswer(questions[currentQuestion].id, currentAnswer)
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = async () => {
    if (!user) return

    setIsSubmitting(true)

    try {
      // Save final answer if exists
      const currentAnswer = answers[questions[currentQuestion].id]
      if (currentAnswer !== undefined) {
        await saveAnswer(questions[currentQuestion].id, currentAnswer)
      }

      // Mark onboarding as completed
      await updateUserProfile(user.id, { onboarding_completed: true })

      // Log activity
      await supabase.from("user_activity").insert({
        user_id: user.id,
        action: "onboarding_completed",
        details: { total_questions: questions.length },
      })

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error: any) {
      setError(error.message)
      setIsSubmitting(false)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
    }
  }

  const isAnswered = () => {
    const answer = answers[questions[currentQuestion].id]
    if (questions[currentQuestion].type === "checkbox") {
      return answer && answer.length > 0
    }
    if (questions[currentQuestion].type === "textarea") {
      return true // Optional question
    }
    return answer && answer.length > 0
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your onboarding...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push("/auth")}>Return to Sign In</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Processing Your Responses...</h2>
          <p className="text-gray-600 mb-6">
            Our AI is analyzing your needs to find the perfect resources for your unique situation.
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-gradient-to-r from-blue-600 to-green-600 h-2 rounded-full animate-pulse"
              style={{ width: "75%" }}
            ></div>
          </div>
          <p className="text-sm text-gray-500">This will just take a moment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              LiftLoop
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Hi {userProfile?.name}! 👋</h1>
          <p className="text-gray-600">Let's understand your needs so we can help you better</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        {/* Question Card */}
        <Card className="shadow-xl border-0 mb-8">
          <CardHeader>
            <CardTitle className="text-xl flex items-center space-x-2">
              <span>{questions[currentQuestion].title}</span>
            </CardTitle>
            {questions[currentQuestion].subtitle && (
              <CardDescription className="text-base">{questions[currentQuestion].subtitle}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {questions[currentQuestion].type === "radio" && (
              <RadioGroup
                value={answers[questions[currentQuestion].id] || ""}
                onValueChange={(value) => handleAnswer(questions[currentQuestion].id, value)}
              >
                {questions[currentQuestion].options?.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-3 p-4 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="flex-1 cursor-pointer flex items-center space-x-3">
                      <span className="text-xl">{option.emoji}</span>
                      <span>{option.label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {questions[currentQuestion].type === "checkbox" && (
              <div className="space-y-3">
                {questions[currentQuestion].options?.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-3 p-4 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
                  >
                    <Checkbox
                      id={option.value}
                      checked={(answers[questions[currentQuestion].id] || []).includes(option.value)}
                      onCheckedChange={(checked) => {
                        const currentAnswers = answers[questions[currentQuestion].id] || []
                        if (checked) {
                          handleAnswer(questions[currentQuestion].id, [...currentAnswers, option.value])
                        } else {
                          handleAnswer(
                            questions[currentQuestion].id,
                            currentAnswers.filter((a: string) => a !== option.value),
                          )
                        }
                      }}
                    />
                    <Label htmlFor={option.value} className="flex-1 cursor-pointer flex items-center space-x-3">
                      <span className="text-xl">{option.emoji}</span>
                      <span>{option.label}</span>
                    </Label>
                  </div>
                ))}
              </div>
            )}

            {questions[currentQuestion].type === "textarea" && (
              <Textarea
                placeholder={questions[currentQuestion].placeholder}
                value={answers[questions[currentQuestion].id] || ""}
                onChange={(e) => handleAnswer(questions[currentQuestion].id, e.target.value)}
                className="min-h-[120px] text-base"
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <Button
            onClick={handleNext}
            disabled={!isAnswered() && questions[currentQuestion].type !== "textarea"}
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
          >
            {currentQuestion === questions.length - 1 ? (
              <>
                Find My Resources
                <Sparkles className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Need immediate help? <span className="font-medium">Call 911 (Emergency) or 311 (City Services)</span>
          </p>
        </div>
      </div>
    </div>
  )
}
