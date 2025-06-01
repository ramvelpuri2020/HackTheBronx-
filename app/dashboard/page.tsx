"use client"

import { useState, useEffect } from "react"
import {
  Heart,
  Search,
  MapPin,
  Phone,
  Clock,
  ExternalLink,
  Lightbulb,
  Target,
  TrendingUp,
  Sparkles,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  const [allResources, setAllResources] = useState<any[]>([])
  const [isLoadingAI, setIsLoadingAI] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isClient, setIsClient] = useState(false)
  const [aiStatus, setAiStatus] = useState<string>("Initializing...")
  const [aiError, setAiError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    setIsClient(true)
    checkUserData()
  }, [])

  // Filter resources based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredResources(allResources)
      return
    }

    const filtered = allResources.filter((resource) => {
      const searchableText = [
        resource.title,
        resource.description,
        resource.category,
        ...(resource.tags || []),
        resource.address,
      ]
        .join(" ")
        .toLowerCase()

      return searchableText.includes(searchQuery.toLowerCase())
    })

    setFilteredResources(filtered)
  }, [searchQuery, allResources])

  const checkUserData = async () => {
    try {
      setAiStatus("Checking authentication...")

      // First check if user is authenticated
      const user = await getCurrentUser()
      if (!user) {
        router.push("/auth")
        return
      }

      setCurrentUser(user)
      setAiStatus("Loading user profile...")

      // Get user profile
      const profile = await getUserProfile(user.id)
      if (!profile) {
        router.push("/auth")
        return
      }

      // Check if onboarding is completed
      if (!profile.onboarding_completed) {
        // Check if they have answers in the database
        const { data: answers } = await supabase.from("onboarding_answers").select("*").eq("user_id", user.id)

        if (!answers || answers.length === 0) {
          router.push("/onboarding")
          return
        }

        // If they have answers but onboarding not marked complete, update it
        await updateUserProfile(user.id, { onboarding_completed: true })
      }

      // Set user data
      setUserName(profile.name)
      setAiStatus("Loading your responses...")

      // Get answers from database
      const { data: answersData } = await supabase
        .from("onboarding_answers")
        .select("*")
        .eq("user_id", user.id)
        .order("question_id")

      if (answersData && answersData.length > 0) {
        const answersMap: Record<number, any> = {}
        answersData.forEach((answer) => {
          answersMap[answer.question_id] = answer.answer
        })
        setUserAnswers(answersMap)

        // Get AI-powered recommendations
        loadAIRecommendations({ id: user.id, name: profile.name, email: profile.email }, answersMap)
      } else {
        // No answers found, redirect to onboarding
        router.push("/onboarding")
      }
    } catch (error) {
      setAiStatus("Error loading data, redirecting to onboarding...")
      setAiError("Failed to load user data")

      setTimeout(() => {
        router.push("/onboarding")
      }, 2000)
    }
  }

  const loadAIRecommendations = async (userData: any, answersData: any) => {
    setIsLoadingAI(true)
    setLoadingProgress(0)
    setAiError(null)
    setAiStatus("Preparing your profile for AI analysis...")

    try {
      const userProfile = {
        answers: answersData,
        name: userData.name,
        email: userData.email,
        userId: userData.id,
      }

      setAiStatus("Loading resources from database...")
      setLoadingProgress(20)

      // Get resources from database first
      const { data: dbResources, error: resourcesError } = await supabase
        .from("resources")
        .select("*")
        .eq("verified", true)

      let resources = []
      if (resourcesError || !dbResources || dbResources.length === 0) {
        setAiStatus("Setting up resource database...")

        // Use default resources if database is empty
        resources = await getDefaultResources()
      } else {
        resources = dbResources
      }

      if (resources.length === 0) {
        throw new Error("No resources available")
      }

      setLoadingProgress(40)
      setAiStatus("Analyzing your responses...")

      // Get AI recommendations using direct API calls
      const recommendations = await getAIPersonalizedRecommendations(userProfile, resources)

      setLoadingProgress(70)
      setAiStatus("Getting opportunity analysis...")

      // Get opportunity analysis
      const opportunityAnalysis = await getAIOpportunityAnalysis(userProfile)

      setLoadingProgress(100)
      setAiStatus("Finalizing your personalized dashboard...")

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

      setAllResources(recommendedResources)
      setFilteredResources(recommendedResources)
    } catch (error: any) {
      setAiError(error.message || "Failed to get AI recommendations")
      setAiStatus("AI analysis failed")

      // Show fallback resources
      try {
        const fallbackResources = await getDefaultResources()
        setAllResources(fallbackResources)
        setFilteredResources(fallbackResources)
      } catch (fallbackError) {
        console.error("❌ Failed to load fallback resources:", fallbackError)
      }
    } finally {
      setTimeout(() => {
        setIsLoadingAI(false)
      }, 1000)
    }
  }

  const getDefaultResources = async () => {
    // Return hardcoded resources as fallback
    return [
      {
        id: 1,
        title: "BronxWorks Food Pantry",
        category: "food",
        address: "60 E Tremont Ave, Bronx, NY 10453",
        phone: "718-731-3931",
        hours: "Mon-Fri, 9am-5pm",
        tags: ["food pantry", "emergency food", "groceries", "families"],
        link: "https://bronxworks.org",
        description:
          "Free groceries and emergency food assistance for Bronx families. No documentation required. Serves over 1,000 families monthly.",
      },
      {
        id: 2,
        title: "BronxWorks Emergency Shelter",
        category: "housing",
        address: "1130 Grand Concourse, Bronx, NY 10456",
        phone: "718-731-3931",
        hours: "24/7",
        tags: ["emergency shelter", "families", "temporary housing", "case management"],
        link: "https://bronxworks.org",
        description:
          "Emergency shelter for families experiencing homelessness. Case management, job placement, and permanent housing assistance available.",
      },
      {
        id: 3,
        title: "SoBRO Workforce Development",
        category: "jobs",
        address: "555 Bergen Ave, Bronx, NY 10455",
        phone: "718-292-3113",
        hours: "Mon-Fri, 9am-5pm",
        tags: ["job training", "career services", "resume help", "interview prep"],
        link: "https://sobro.org",
        description:
          "Free job training programs, career counseling, resume writing, and interview preparation. Partnerships with local employers.",
      },
      {
        id: 4,
        title: "Bronx Library Center",
        category: "education",
        address: "310 E Kingsbridge Rd, Bronx, NY 10458",
        phone: "718-579-4244",
        hours: "Mon-Thu 9am-8pm, Fri-Sat 10am-5pm",
        tags: ["library", "computer access", "wifi", "study space", "programs"],
        link: "https://nypl.org",
        description:
          "Free computer and internet access, study spaces, educational programs, and job search assistance. ESL and GED prep classes available.",
      },
      {
        id: 5,
        title: "BronxCare Behavioral Health",
        category: "mental-health",
        address: "1276 Fulton Ave, Bronx, NY 10456",
        phone: "718-960-1234",
        hours: "Mon-Fri, 8am-5pm",
        tags: ["mental health", "counseling", "therapy", "crisis intervention"],
        link: "https://bronxcare.org",
        description:
          "Comprehensive mental health services including individual therapy, group counseling, and crisis intervention. Sliding scale fees available.",
      },
    ]
  }

  const retryAIAnalysis = () => {
    if (currentUser && userAnswers) {
      loadAIRecommendations({ id: currentUser.id, name: userName, email: currentUser.email }, userAnswers)
    }
  }

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      food: "🥫",
      housing: "🏠",
      jobs: "💼",
      education: "📚",
      "mental-health": "🧠",
      legal: "⚖️",
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
            <Link href="/auth" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                LiftLoop
              </span>
              <Badge variant="outline" className="ml-2">
                <Sparkles className="w-3 h-3 mr-1" />
                Smart Matching
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
                    router.push("/auth")
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🤖 Smart Analysis in Progress</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">{aiStatus}</p>
            <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-3 mb-4">
              <div
                className="bg-gradient-to-r from-blue-600 to-green-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500">{loadingProgress}% complete</p>
            <div className="mt-4 text-xs text-gray-400">
              <p>🔗 Analyzing your unique situation</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {!isLoadingAI && aiError && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">AI Analysis Failed</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">{aiError}</p>
            <div className="space-y-3">
              <Button onClick={retryAIAnalysis} className="bg-blue-600 hover:bg-blue-700">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry AI Analysis
              </Button>
              <p className="text-sm text-gray-500">Don't worry - we've loaded some basic resources for you below</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!isLoadingAI && (
          <Tabs defaultValue="recommendations" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="recommendations">
                {aiRecommendations ? "AI Recommendations" : "Available Resources"}
              </TabsTrigger>
              <TabsTrigger value="opportunities" disabled={!opportunities}>
                Opportunities
              </TabsTrigger>
              <TabsTrigger value="insights" disabled={!aiRecommendations}>
                Personal Insights
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recommendations" className="space-y-6">
              {/* Welcome Section */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {aiRecommendations ? "Your AI-Powered Recommendations" : "Available Resources"}
                </h1>
                <p className="text-gray-600">
                  {aiRecommendations
                    ? `Based on your unique situation, we've found ${filteredResources.length} highly relevant resources.`
                    : `Here are ${filteredResources.length} resources available in the Bronx.`}
                </p>
                {aiRecommendations && (
                  <div className="mt-2 text-sm text-green-600 flex items-center">
                    <Sparkles className="w-4 h-4 mr-1" />
                    Powered by smart matching
                  </div>
                )}
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

              {/* Search */}
              <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search resources..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Resources */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {filteredResources.length > 0
                      ? `${filteredResources.length} Resource${filteredResources.length === 1 ? "" : "s"}`
                      : "No resources found"}
                  </h2>
                  {aiError && (
                    <Button onClick={retryAIAnalysis} variant="outline" size="sm">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry AI Analysis
                    </Button>
                  )}
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
                      <p className="text-gray-600 mb-4">Try different search terms or clear your search.</p>
                      <Button onClick={() => setSearchQuery("")} variant="outline">
                        Clear Search
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Opportunities Tab */}
            {opportunities && (
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
                            <span className="text-orange-600 mt-1">•</span>
                            <span className="text-sm">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}

            {/* Insights Tab */}
            {aiRecommendations && (
              <TabsContent value="insights" className="space-y-6">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Personal Insights & Next Steps</h1>
                  <p className="text-gray-600">Smart analysis of your situation with actionable recommendations.</p>
                  <div className="mt-2 text-sm text-green-600 flex items-center">
                    <Sparkles className="w-4 h-4 mr-1" />
                    Personalized insights from smart matching
                  </div>
                </div>

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
              </TabsContent>
            )}
          </Tabs>
        )}
      </main>
    </div>
  )
}
