"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Heart,
  Search,
  MapPin,
  Phone,
  Clock,
  ExternalLink,
  Plus,
  Lightbulb,
  Target,
  TrendingUp,
  Sparkles,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getAIPersonalizedRecommendations, getAIOpportunityAnalysis } from "@/utils/aiPersonalization"
import { getCurrentUser, getUserProfile, updateUserProfile } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

export default function DashboardPage() {
  const [userName, setUserName] = useState("")
  const [userAnswers, setUserAnswers] = useState<any>({})
  const [aiRecommendations, setAiRecommendations] = useState<any>(null)
  const [opportunities, setOpportunities] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredResources, setFilteredResources] = useState<any[]>([])
  const [showMajorSupportForm, setShowMajorSupportForm] = useState(false)
  const [isLoadingAI, setIsLoadingAI] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isClient, setIsClient] = useState(false)
  const [aiStatus, setAiStatus] = useState<string>("Initializing...")
  const router = useRouter()

  useEffect(() => {
    setIsClient(true)
    checkUserData()
  }, [])

  const checkUserData = async () => {
    try {
      console.log("🔐 Checking user authentication...")
      setAiStatus("Checking authentication...")

      // First check if user is authenticated
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        console.log("❌ No authenticated user found, redirecting to auth")
        router.push("/auth")
        return
      }

      console.log("✅ User authenticated:", currentUser.id)
      setAiStatus("Loading user profile...")

      // Get user profile
      const profile = await getUserProfile(currentUser.id)
      if (!profile) {
        console.log("❌ No user profile found, redirecting to auth")
        router.push("/auth")
        return
      }

      console.log("✅ User profile loaded:", profile.name)

      // Check if onboarding is completed
      if (!profile.onboarding_completed) {
        console.log("⚠️ Onboarding not completed, checking for answers...")
        // Check if they have answers in the database
        const { data: answers } = await supabase.from("onboarding_answers").select("*").eq("user_id", currentUser.id)

        if (!answers || answers.length === 0) {
          console.log("❌ No onboarding answers found, redirecting to onboarding")
          router.push("/onboarding")
          return
        }

        console.log("✅ Found answers, marking onboarding as complete")
        // If they have answers but onboarding not marked complete, update it
        await updateUserProfile(currentUser.id, { onboarding_completed: true })
      }

      // Set user data
      setUserName(profile.name)
      setAiStatus("Loading your responses...")

      // Get answers from database
      const { data: answersData } = await supabase
        .from("onboarding_answers")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("question_id")

      if (answersData && answersData.length > 0) {
        const answersMap: Record<number, any> = {}
        answersData.forEach((answer) => {
          answersMap[answer.question_id] = answer.answer
        })
        setUserAnswers(answersMap)

        console.log("✅ User answers loaded:", Object.keys(answersMap).length, "questions")

        // Get AI-powered recommendations
        loadAIRecommendations({ id: currentUser.id, name: profile.name, email: profile.email }, answersMap)
      } else {
        console.log("❌ No answers found, redirecting to onboarding")
        // No answers found, redirect to onboarding
        router.push("/onboarding")
      }
    } catch (error) {
      console.error("❌ Error loading user data:", error)
      setAiStatus("Error loading data, redirecting to onboarding...")

      // No fallback to localStorage - redirect to onboarding instead
      setTimeout(() => {
        router.push("/onboarding")
      }, 2000)
    }
  }

  const loadAIRecommendations = async (userData: any, answersData: any) => {
    setIsLoadingAI(true)
    setLoadingProgress(0)
    setAiStatus("Preparing your profile for AI analysis...")

    try {
      const userProfile = {
        answers: answersData,
        name: userData.name,
        email: userData.email,
      }

      console.log("🤖 Starting AI recommendation process...")
      setAiStatus("Connecting to Hack Club AI...")

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 300)

      setAiStatus("Analyzing your needs with AI...")

      // Get resources from database first
      const { data: dbResources, error: resourcesError } = await supabase
        .from("resources")
        .select("*")
        .eq("verified", true)

      let resources = []
      if (resourcesError || !dbResources || dbResources.length === 0) {
        console.log("⚠️ Using fallback resources from static data")
        // Fallback to static resources if database is empty
        const { resources: staticResources } = await import("@/data/resources")
        resources = staticResources
      } else {
        console.log("✅ Using resources from database:", dbResources.length)
        resources = dbResources
      }

      setAiStatus("Getting AI recommendations...")

      // Get AI recommendations and opportunities in parallel
      const [recommendations, opportunityAnalysis] = await Promise.all([
        getAIPersonalizedRecommendations(userProfile, resources),
        getAIOpportunityAnalysis(userProfile),
      ])

      clearInterval(progressInterval)
      setLoadingProgress(100)
      setAiStatus("Finalizing your personalized dashboard...")

      console.log("✅ AI analysis complete!")
      setAiRecommendations(recommendations)
      setOpportunities(opportunityAnalysis)

      // Set filtered resources based on AI recommendations
      const recommendedResourceIds = recommendations.recommendations.map((r: any) => r.resourceId)
      const recommendedResources = resources
        .filter((resource) => recommendedResourceIds.includes(resource.id))
        .map((resource) => {
          const aiRec = recommendations.recommendations.find((r: any) => r.resourceId === resource.id)
          return {
            ...resource,
            aiRecommendation: aiRec,
          }
        })
        .sort((a, b) => (b.aiRecommendation?.relevanceScore || 0) - (a.aiRecommendation?.relevanceScore || 0))

      setFilteredResources(recommendedResources)
      console.log("🎯 Dashboard ready with", recommendedResources.length, "personalized recommendations")
    } catch (error) {
      console.error("❌ Failed to load AI recommendations:", error)
      setAiStatus("AI unavailable, using smart matching...")

      // Fallback to basic filtering
      const { resources: fallbackResources } = await import("@/data/resources")
      setFilteredResources(fallbackResources.slice(0, 8))
    } finally {
      setTimeout(() => {
        setIsLoadingAI(false)
      }, 1000)
    }
  }

  useEffect(() => {
    if (searchQuery.trim() && filteredResources.length > 0) {
      const filtered = filteredResources.filter(
        (resource) =>
          resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          resource.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
      )
      setFilteredResources(filtered)
    } else if (aiRecommendations && !searchQuery.trim()) {
      // Reset to AI recommendations when search is cleared
      const recommendedResourceIds = aiRecommendations.recommendations.map((r: any) => r.resourceId)

      // Get resources from database or current filtered resources
      const { data: dbResources } = supabase
        .from("resources")
        .select("*")
        .eq("verified", true)
        .then(({ data }) => {
          if (data && data.length > 0) {
            const recommendedResources = data
              .filter((resource: any) => recommendedResourceIds.includes(resource.id))
              .map((resource: any) => {
                const aiRec = aiRecommendations.recommendations.find((r: any) => r.resourceId === resource.id)
                return {
                  ...resource,
                  aiRecommendation: aiRec,
                }
              })
              .sort(
                (a: any, b: any) =>
                  (b.aiRecommendation?.relevanceScore || 0) - (a.aiRecommendation?.relevanceScore || 0),
              )

            setFilteredResources(recommendedResources)
          }
        })
    }
  }, [searchQuery, aiRecommendations])

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      food: "🥫",
      housing: "🏠",
      jobs: "💼",
      education: "📚",
      "mental-health": "🧠",
    }
    return emojis[category] || "📍"
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (!isClient) {
    return null
  }

  if (!userName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                LiftLoop
              </span>
              <Badge variant="outline" className="ml-2">
                <Sparkles className="w-3 h-3 mr-1" />
                AI-Powered
              </Badge>
            </Link>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">Welcome back, {userName}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await supabase.auth.signOut()
                    router.push("/")
                  } catch (error) {
                    console.error("Sign out error:", error)
                  }
                }}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Loading State */}
        {isLoadingAI && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🤖 AI Analysis in Progress</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">{aiStatus}</p>
            <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-3 mb-4">
              <div
                className="bg-gradient-to-r from-blue-600 to-green-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500">{loadingProgress}% complete</p>
            <div className="mt-4 text-xs text-gray-400">
              <p>🔗 Using Hack Club AI API for personalized recommendations</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!isLoadingAI && (
          <Tabs defaultValue="recommendations" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
              <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
              <TabsTrigger value="insights">Personal Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="recommendations" className="space-y-6">
              {/* Welcome Section */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Your AI-Powered Recommendations</h1>
                <p className="text-gray-600">
                  Based on your unique situation, we've found {filteredResources.length} highly relevant resources.
                </p>
                <div className="mt-2 text-sm text-green-600 flex items-center">
                  <Sparkles className="w-4 h-4 mr-1" />
                  Powered by Hack Club AI API
                </div>
              </div>

              {/* AI Insights Alert */}
              {aiRecommendations?.insights && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Lightbulb className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>AI Insight:</strong> {aiRecommendations.insights[0]}
                  </AlertDescription>
                </Alert>
              )}

              {/* Major Support CTA */}
              <Card className="mb-6 border-2 border-dashed border-blue-300 bg-blue-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">Need Major Support?</h3>
                      <p className="text-blue-800 text-sm">
                        Facing eviction, can't pay rent, or need intensive case management? Request personalized
                        assistance from our support team.
                      </p>
                    </div>
                    <Dialog open={showMajorSupportForm} onOpenChange={setShowMajorSupportForm}>
                      <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap">
                          <Plus className="w-4 h-4 mr-2" />
                          Request Major Support
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Request Major Support</DialogTitle>
                          <DialogDescription>
                            Our support team will review your case and connect you with specialized assistance.
                          </DialogDescription>
                        </DialogHeader>
                        <MajorSupportForm onClose={() => setShowMajorSupportForm(false)} userAnswers={userAnswers} />
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              {/* Search */}
              <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search your AI-recommended resources..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* AI-Recommended Resources */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {filteredResources.length > 0
                      ? `${filteredResources.length} AI-Recommended Resource${filteredResources.length === 1 ? "" : "s"}`
                      : "No resources found"}
                  </h2>
                </div>

                {filteredResources.map((resource) => (
                  <Card key={resource.id} className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-lg">{getCategoryEmoji(resource.category)}</span>
                            <CardTitle className="text-lg">{resource.title}</CardTitle>
                            {resource.aiRecommendation && (
                              <Badge className={getUrgencyColor(resource.aiRecommendation.urgencyLevel)}>
                                {resource.aiRecommendation.urgencyLevel} priority
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">
                              {resource.category.replace("-", " ")}
                            </Badge>
                            {resource.aiRecommendation && (
                              <Badge variant="outline" className="text-xs">
                                {resource.aiRecommendation.relevanceScore}% match
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="mb-4 text-sm leading-relaxed">{resource.description}</CardDescription>

                      {/* AI Reasoning */}
                      {resource.aiRecommendation?.reasoning && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-start space-x-2">
                            <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-blue-900 mb-1">Why this is perfect for you:</p>
                              <p className="text-sm text-blue-800">{resource.aiRecommendation.reasoning}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action Items */}
                      {resource.aiRecommendation?.actionItems && resource.aiRecommendation.actionItems.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-900 mb-2">Recommended actions:</p>
                          <ul className="text-sm text-gray-700 space-y-1">
                            {resource.aiRecommendation.actionItems.map((item: string, index: number) => (
                              <li key={index} className="flex items-start space-x-2">
                                <span className="text-green-600 mt-1">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span>{resource.address}</span>
                        </div>

                        {resource.phone && (
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <a href={`tel:${resource.phone}`} className="text-blue-600 hover:underline">
                              {resource.phone}
                            </a>
                          </div>
                        )}

                        {resource.hours && (
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span>{resource.hours}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mt-4">
                        {resource.phone && (
                          <Button size="sm" asChild>
                            <a href={`tel:${resource.phone}`}>
                              <Phone className="w-3 h-3 mr-1" />
                              Call Now
                            </a>
                          </Button>
                        )}

                        <Button size="sm" variant="outline" asChild>
                          <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(resource.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MapPin className="w-3 h-3 mr-1" />
                            Directions
                          </a>
                        </Button>

                        {resource.link && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={resource.link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Website
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredResources.length === 0 && (
                  <Card className="border-dashed border-2 border-gray-300">
                    <CardContent className="text-center py-8">
                      <div className="text-4xl mb-2">🔍</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
                      <p className="text-gray-600 mb-4">
                        Try different search terms or request major support for personalized assistance.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="opportunities" className="space-y-6">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Hidden Opportunities</h1>
                <p className="text-gray-600">
                  Discover programs and benefits you might not know about, tailored to your situation.
                </p>
                <div className="mt-2 text-sm text-green-600 flex items-center">
                  <Sparkles className="w-4 h-4 mr-1" />
                  AI-powered opportunity analysis
                </div>
              </div>

              {opportunities && (
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="border-l-4 border-l-green-500">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Target className="w-5 h-5 text-green-600" />
                        <span>Hidden Opportunities</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {opportunities.hiddenOpportunities?.map((opportunity: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-green-600 mt-1">•</span>
                            <span className="text-sm">{opportunity}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        <span>You Likely Qualify For</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {opportunities.qualifications?.map((qualification: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-blue-600 mt-1">•</span>
                            <span className="text-sm">{qualification}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-purple-500">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Lightbulb className="w-5 h-5 text-purple-600" />
                        <span>Strategic Advice</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {opportunities.strategicAdvice?.map((advice: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-purple-600 mt-1">•</span>
                            <span className="text-sm">{advice}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-orange-500">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5 text-orange-600" />
                        <span>Long-Term Path</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {opportunities.longTermPath?.map((step: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-orange-600 font-bold">{index + 1}.</span>
                            <span className="text-sm">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Personal Insights & Next Steps</h1>
                <p className="text-gray-600">AI-powered analysis of your situation with actionable recommendations.</p>
                <div className="mt-2 text-sm text-green-600 flex items-center">
                  <Sparkles className="w-4 h-4 mr-1" />
                  Personalized insights from Hack Club AI
                </div>
              </div>

              {aiRecommendations && (
                <div className="space-y-6">
                  {/* Personal Insights */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Lightbulb className="w-5 h-5 text-blue-600" />
                        <span>Personal Insights</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {aiRecommendations.insights?.map((insight: string, index: number) => (
                          <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-800">{insight}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Next Steps */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Target className="w-5 h-5 text-green-600" />
                        <span>Immediate Next Steps</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {aiRecommendations.nextSteps?.map((step: string, index: number) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-bold text-green-600">{index + 1}</span>
                            </div>
                            <p className="text-sm text-gray-700">{step}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Additional Opportunities */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        <span>Additional Opportunities</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {aiRecommendations.opportunities?.map((opportunity: string, index: number) => (
                          <div key={index} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <p className="text-sm text-purple-800">{opportunity}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
}

function MajorSupportForm({ onClose, userAnswers }: { onClose: () => void; userAnswers: any }) {
  const [formData, setFormData] = useState({
    urgency: "",
    situation: "",
    assistance: "",
    contact: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Submit to support team
    try {
      const response = await fetch("https://formsubmit.co/ajax/support@liftloop.org", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          ...formData,
          userAnswers,
          _subject: "LiftLoop Major Support Request",
          _template: "table",
        }),
      })

      if (response.ok) {
        alert("Your request has been submitted! Our support team will contact you within 24 hours.")
        onClose()
      }
    } catch (error) {
      alert("There was an error submitting your request. Please call 311 for immediate assistance.")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">How urgent is your situation?</label>
        <select
          value={formData.urgency}
          onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
          className="w-full p-2 border rounded-md"
          required
        >
          <option value="">Select urgency level</option>
          <option value="immediate">Immediate (today/tomorrow)</option>
          <option value="this-week">This week</option>
          <option value="this-month">This month</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Describe your situation</label>
        <textarea
          value={formData.situation}
          onChange={(e) => setFormData({ ...formData, situation: e.target.value })}
          className="w-full p-2 border rounded-md h-24"
          placeholder="Tell us what's happening and what kind of help you need..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">What assistance would help most?</label>
        <textarea
          value={formData.assistance}
          onChange={(e) => setFormData({ ...formData, assistance: e.target.value })}
          className="w-full p-2 border rounded-md h-20"
          placeholder="e.g., help paying rent, finding emergency shelter, job placement assistance..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Best way to contact you</label>
        <input
          type="text"
          value={formData.contact}
          onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
          className="w-full p-2 border rounded-md"
          placeholder="Phone number or email"
          required
        />
      </div>

      <div className="flex space-x-2">
        <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
          Submit Request
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
