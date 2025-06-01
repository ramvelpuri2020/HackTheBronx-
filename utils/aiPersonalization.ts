interface UserProfile {
  answers: Record<number, any>
  name: string
  email: string
}

interface AIRecommendation {
  resourceId: number
  relevanceScore: number
  reasoning: string
  urgencyLevel: "low" | "medium" | "high" | "critical"
  actionItems: string[]
  opportunities: string[]
}

export async function getAIPersonalizedRecommendations(
  userProfile: UserProfile,
  resources: any[],
): Promise<{
  recommendations: AIRecommendation[]
  insights: string[]
  nextSteps: string[]
  opportunities: string[]
}> {
  console.log("🤖 Starting AI personalization with Hack Club API...")
  console.log("📊 User profile:", { name: userProfile.name, answersCount: Object.keys(userProfile.answers).length })

  try {
    // Create a comprehensive prompt with all user data
    const livingSituation = userProfile.answers[1] || "Not specified"
    const helpNeeded = Array.isArray(userProfile.answers[2]) ? userProfile.answers[2].join(", ") : "Not specified"
    const urgency = userProfile.answers[3] || "Not specified"
    const specialSituations = Array.isArray(userProfile.answers[4]) ? userProfile.answers[4].join(", ") : "None"
    const preferredArea = userProfile.answers[5] || "Any area"
    const additionalDetails = userProfile.answers[6] || "None provided"

    const prompt = `
You are an expert social services coordinator for the Bronx, NY with deep knowledge of local resources and community needs. Analyze this user's complete situation and provide highly personalized, actionable recommendations.

USER PROFILE:
Name: ${userProfile.name}
Email: ${userProfile.email}

DETAILED RESPONSES:
1. Living Situation: ${livingSituation}
2. Types of Help Needed: ${helpNeeded}
3. Urgency Level: ${urgency}
4. Special Circumstances: ${specialSituations}
5. Preferred Bronx Area: ${preferredArea}
6. Additional Details: ${additionalDetails}

AVAILABLE BRONX RESOURCES:
${resources
  .map(
    (r, index) => `
${index + 1}. ID: ${r.id}
   Name: ${r.title}
   Category: ${r.category}
   Address: ${r.address}
   Phone: ${r.phone || "Not listed"}
   Hours: ${r.hours || "Call for hours"}
   Services: ${r.tags?.join(", ") || "General services"}
   Description: ${r.description}
`,
  )
  .join("")}

ANALYSIS REQUIREMENTS:
Based on the user's specific situation, provide:

1. TOP RESOURCE MATCHES (5-8 resources):
   - Prioritize by urgency and relevance
   - Consider geographic preferences
   - Match special circumstances (children, veterans, etc.)
   - Include both immediate needs and supportive services

2. PERSONALIZED INSIGHTS:
   - Analyze their unique situation
   - Identify patterns and priorities
   - Highlight critical needs vs. supportive services

3. ACTIONABLE NEXT STEPS:
   - Immediate actions they should take today
   - Order of priority for contacting resources
   - What to prepare/bring when contacting services

4. HIDDEN OPPORTUNITIES:
   - Programs they might not know about
   - Benefits they likely qualify for
   - Connections between services (e.g., job training + childcare)

RESPONSE FORMAT (JSON):
{
  "recommendations": [
    {
      "resourceId": [resource ID number],
      "relevanceScore": [0-100 based on how well it matches their needs],
      "reasoning": "[Detailed explanation of why this resource is perfect for their specific situation]",
      "urgencyLevel": "[critical/high/medium/low based on their urgency and this resource's importance]",
      "actionItems": ["[Specific step 1]", "[Specific step 2]", "[etc.]"],
      "opportunities": ["[Additional benefit 1]", "[Additional benefit 2]"]
    }
  ],
  "insights": [
    "[Personal insight about their situation]",
    "[Analysis of their priorities]",
    "[Strategic observation]"
  ],
  "nextSteps": [
    "[Immediate action 1]",
    "[Immediate action 2]",
    "[Follow-up action]"
  ],
  "opportunities": [
    "[Hidden opportunity 1]",
    "[Program they might qualify for]",
    "[Strategic advantage they have]"
  ]
}

IMPORTANT CONSIDERATIONS:
- If urgency is "immediate", prioritize emergency services and crisis intervention
- Consider family situations (children, elderly care) when recommending resources
- Factor in transportation and accessibility
- Look for comprehensive service providers that offer multiple types of help
- Consider the user's specific Bronx area for proximity
- Identify resources that work well together (complementary services)
- Be specific about what documents or information they should prepare
- Consider both short-term relief and long-term stability
`

    console.log("🚀 Calling Hack Club AI API...")
    const startTime = Date.now()

    const response = await fetch("https://ai.hackclub.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    })

    const responseTime = Date.now() - startTime
    console.log(`⏱️ Hack Club API response time: ${responseTime}ms`)

    if (!response.ok) {
      console.error("❌ Hack Club API error:", response.status, response.statusText)
      throw new Error(`AI service error: ${response.status}`)
    }

    const data = await response.json()
    console.log("✅ Hack Club API response received:", {
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length,
      hasMessage: !!data.choices?.[0]?.message,
      contentLength: data.choices?.[0]?.message?.content?.length,
    })

    // Check if the response has the expected structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("❌ Unexpected AI response structure:", data)
      throw new Error("Invalid AI response structure")
    }

    const aiResponse = data.choices[0].message.content
    console.log("📝 Raw AI response length:", aiResponse.length)

    // Parse the AI response
    try {
      // Clean the response in case there's extra text
      const jsonStart = aiResponse.indexOf("{")
      const jsonEnd = aiResponse.lastIndexOf("}") + 1
      const jsonString = aiResponse.slice(jsonStart, jsonEnd)

      console.log("🔍 Parsing AI JSON response...")
      const parsed = JSON.parse(jsonString)

      // Validate the response structure
      if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
        console.error("❌ Invalid AI response structure - missing recommendations array")
        throw new Error("Invalid AI response structure")
      }

      console.log("🎯 AI recommendations parsed successfully:", {
        recommendationsCount: parsed.recommendations.length,
        insightsCount: parsed.insights?.length || 0,
        nextStepsCount: parsed.nextSteps?.length || 0,
        opportunitiesCount: parsed.opportunities?.length || 0,
      })

      return parsed
    } catch (parseError) {
      console.error("❌ Failed to parse AI response:", parseError)
      console.error("📄 Raw AI response:", aiResponse.substring(0, 500) + "...")
      console.log("🔄 Falling back to rule-based recommendations...")
      return getFallbackRecommendations(userProfile, resources)
    }
  } catch (error) {
    console.error("❌ AI personalization error:", error)
    console.log("🔄 Using fallback recommendations due to API error")
    return getFallbackRecommendations(userProfile, resources)
  }
}

function getFallbackRecommendations(userProfile: UserProfile, resources: any[]) {
  console.log("🔧 Generating dynamic fallback recommendations based on user profile...")

  // Enhanced fallback logic based on user answers
  const helpTypes = userProfile.answers[2] || []
  const urgency = userProfile.answers[3]
  const specialSituations = userProfile.answers[4] || []
  const livingSituation = userProfile.answers[1]
  const preferredArea = userProfile.answers[5]

  console.log("📋 Fallback analysis:", { helpTypes, urgency, specialSituations, livingSituation, preferredArea })

  // Filter and score resources with more variety
  const scoredResources = resources.map((resource) => {
    let score = 0
    let reasoning = ""
    let urgencyLevel = "medium"

    // More varied scoring based on multiple factors
    // Category matching with varied weights
    if (helpTypes.includes(resource.category)) {
      score += 30 + Math.floor(Math.random() * 10) // Add randomness
      reasoning = `Matches your ${resource.category} needs`
    }

    // Special situation matching with more variety
    if (specialSituations.includes("children") && resource.tags.includes("families")) {
      score += 15 + Math.floor(Math.random() * 10)
      reasoning += " • Family-friendly services"
    }
    if (specialSituations.includes("veteran") && resource.tags.includes("veterans")) {
      score += 25 + Math.floor(Math.random() * 10)
      reasoning += " • Veteran-specific services"
    }
    if (specialSituations.includes("disability") && resource.tags.includes("disability")) {
      score += 20 + Math.floor(Math.random() * 10)
      reasoning += " • Disability-accessible services"
    }
    if (specialSituations.includes("immigrant") && resource.tags.includes("immigrant")) {
      score += 22 + Math.floor(Math.random() * 10)
      reasoning += " • Immigrant-friendly services"
    }

    // Urgency-based prioritization with more variety
    if (urgency === "immediate") {
      if (resource.category === "housing" && helpTypes.includes("housing")) {
        score += 25 + Math.floor(Math.random() * 10)
        urgencyLevel = "critical"
        reasoning += " • Critical for immediate housing needs"
      }
      if (resource.category === "food" && helpTypes.includes("food")) {
        score += 20 + Math.floor(Math.random() * 10)
        urgencyLevel = "high"
        reasoning += " • Immediate food assistance available"
      }
      if (resource.category === "mental-health" && helpTypes.includes("mental-health")) {
        score += 22 + Math.floor(Math.random() * 10)
        urgencyLevel = "high"
        reasoning += " • Urgent mental health support"
      }
    } else if (urgency === "soon") {
      if (helpTypes.includes(resource.category)) {
        score += 15 + Math.floor(Math.random() * 10)
        urgencyLevel = "medium"
      }
    }

    // Living situation considerations with more variety
    if (livingSituation === "homeless" && resource.tags.includes("emergency shelter")) {
      score += 30 + Math.floor(Math.random() * 10)
      urgencyLevel = "critical"
      reasoning += " • Emergency shelter for immediate housing"
    } else if (livingSituation === "risk" && resource.tags.includes("eviction prevention")) {
      score += 28 + Math.floor(Math.random() * 10)
      urgencyLevel = "high"
      reasoning += " • Eviction prevention services"
    } else if (livingSituation === "temporary" && resource.tags.includes("housing assistance")) {
      score += 25 + Math.floor(Math.random() * 10)
      urgencyLevel = "high"
      reasoning += " • Housing stability assistance"
    }

    // Area preference matching
    if (preferredArea && preferredArea !== "any") {
      // Simple check if address contains area name
      if (resource.address.toLowerCase().includes(preferredArea.toLowerCase())) {
        score += 15 + Math.floor(Math.random() * 10)
        reasoning += ` • Located in your preferred ${preferredArea} area`
      }
    }

    // Generate varied action items
    const actionItems = []

    // Add varied action items based on resource type
    if (resource.phone) {
      actionItems.push(`Call ${resource.title} at ${resource.phone} to inquire about ${resource.category} services`)
    } else {
      actionItems.push(`Visit ${resource.title} in person to learn about their ${resource.category} services`)
    }

    if (resource.category === "housing") {
      actionItems.push("Bring ID and any housing documentation you have")
      actionItems.push("Ask about emergency housing vouchers and rental assistance programs")
    } else if (resource.category === "food") {
      actionItems.push("No documentation required for emergency food assistance")
      actionItems.push("Ask about weekly food distribution schedule")
    } else if (resource.category === "jobs") {
      actionItems.push("Bring your resume if you have one")
      actionItems.push("Ask about job training and placement services")
    } else if (resource.category === "education") {
      actionItems.push("Ask about free educational programs and eligibility requirements")
      actionItems.push("Inquire about computer access and internet services")
    } else if (resource.category === "mental-health") {
      actionItems.push("Ask about walk-in hours for immediate assistance")
      actionItems.push("Inquire about sliding scale payment options")
    }

    // Add a random third action item for variety
    const extraActions = [
      "Ask if they offer transportation assistance",
      "Inquire about additional services not listed on their website",
      "Ask about evening or weekend availability",
      "Check if they have language translation services",
      "Ask about childcare options during appointments",
    ]
    actionItems.push(extraActions[Math.floor(Math.random() * extraActions.length)])

    // Generate varied opportunities
    const opportunityOptions = [
      "Ask about other programs they offer",
      "Request referrals to partner organizations",
      "Inquire about support groups and community events",
      "Ask about volunteer opportunities that might lead to employment",
      "Check if they offer case management services",
      "Inquire about advocacy services for your specific situation",
      "Ask about financial literacy or budgeting workshops",
    ]

    // Select 2-3 random opportunities
    const numOpportunities = 2 + Math.floor(Math.random() * 2)
    const opportunities = []
    for (let i = 0; i < numOpportunities; i++) {
      const randomIndex = Math.floor(Math.random() * opportunityOptions.length)
      opportunities.push(opportunityOptions[randomIndex])
      opportunityOptions.splice(randomIndex, 1) // Remove to avoid duplicates
    }

    return {
      resourceId: resource.id,
      relevanceScore: Math.min(score, 100),
      reasoning: reasoning || `Relevant ${resource.category} resource for your situation`,
      urgencyLevel,
      actionItems,
      opportunities,
    }
  })

  // Sort by score and take top results with some randomness
  scoredResources.sort((a, b) => b.relevanceScore - a.relevanceScore)

  // Add some randomness to selection to increase variety
  const topRecommendations = []
  const topCount = Math.min(8, scoredResources.length)

  // Always include top 3 if available
  for (let i = 0; i < Math.min(3, scoredResources.length); i++) {
    if (scoredResources[i].relevanceScore > 0) {
      topRecommendations.push(scoredResources[i])
    }
  }

  // Randomly select from next 10 resources to add variety
  const remainingPool = scoredResources.slice(3, 13).filter((r) => r.relevanceScore > 0)
  while (topRecommendations.length < topCount && remainingPool.length > 0) {
    const randomIndex = Math.floor(Math.random() * remainingPool.length)
    topRecommendations.push(remainingPool[randomIndex])
    remainingPool.splice(randomIndex, 1)
  }

  console.log("✅ Dynamic fallback recommendations generated:", topRecommendations.length)

  // Generate varied insights based on user profile
  const insights = []

  if (urgency === "immediate") {
    insights.push(`Based on your immediate needs, we've prioritized critical resources that can help you right away.`)
  } else if (urgency === "soon") {
    insights.push(`We've identified resources that can address your needs within the next few weeks.`)
  } else {
    insights.push(`We've found resources that align with your longer-term planning needs.`)
  }

  if (helpTypes.length > 1) {
    insights.push(
      `You're looking for multiple types of support (${helpTypes.join(", ")}). Many of these organizations offer comprehensive services or can refer you to partner agencies.`,
    )
  } else if (helpTypes.length === 1) {
    insights.push(`We've focused specifically on ${helpTypes[0]} resources based on your needs.`)
  }

  if (specialSituations.length > 0) {
    insights.push(
      `Your specific circumstances (${specialSituations.join(", ")}) qualify you for specialized programs and services that we've highlighted.`,
    )
  } else {
    insights.push(`We've matched you with general community resources that serve all Bronx residents.`)
  }

  // Generate varied next steps based on user profile
  const nextSteps = []

  if (urgency === "immediate") {
    nextSteps.push("Contact the highest priority resources today - many offer same-day assistance")
  } else {
    nextSteps.push("Start with the top 2-3 recommended resources that best match your situation")
  }

  nextSteps.push("Prepare basic information before contacting: ID, proof of address, and any relevant documentation")

  if (helpTypes.includes("housing")) {
    nextSteps.push("For housing assistance, bring any eviction notices, lease agreements, or housing applications")
  } else if (helpTypes.includes("food")) {
    nextSteps.push("For food assistance, ask about weekly distribution schedules and emergency food options")
  } else if (helpTypes.includes("jobs")) {
    nextSteps.push("For employment help, bring your resume and work history if available")
  }

  // Generate varied opportunities
  const generalOpportunities = [
    "Many organizations offer multiple services beyond what's listed - always ask what else is available",
    "Some programs have waiting lists - apply early even if not immediately needed",
    "Building relationships with case workers can lead to additional opportunities and personalized support",
    "Ask about peer support groups related to your specific situation",
    "Many organizations offer volunteer opportunities that can build skills and community connections",
    "Check if the organization offers transportation assistance or MetroCards",
    "Ask about evening or weekend hours if you're working during the day",
  ]

  // Randomly select 3 opportunities
  const shuffledOpportunities = [...generalOpportunities].sort(() => 0.5 - Math.random())

  return {
    recommendations: topRecommendations,
    insights,
    nextSteps,
    opportunities: shuffledOpportunities.slice(0, 3),
  }
}

export async function getAIOpportunityAnalysis(userProfile: UserProfile): Promise<{
  hiddenOpportunities: string[]
  qualifications: string[]
  strategicAdvice: string[]
  longTermPath: string[]
}> {
  console.log("🔍 Starting AI opportunity analysis with Hack Club API...")

  try {
    const prompt = `
As a Bronx community resource expert, analyze this user's profile for hidden opportunities and strategic advice.

USER SITUATION:
Living Situation: ${userProfile.answers[1] || "Not specified"}
Help Needed: ${JSON.stringify(userProfile.answers[2] || [])}
Urgency: ${userProfile.answers[3] || "Not specified"}
Special Circumstances: ${JSON.stringify(userProfile.answers[4] || [])}
Preferred Area: ${userProfile.answers[5] || "Not specified"}
Additional Details: ${userProfile.answers[6] || "None"}

Identify:
1. Hidden opportunities they might not know about (grants, programs, benefits)
2. What they likely qualify for based on their situation
3. Strategic advice for their specific circumstances
4. Long-term pathway recommendations

Focus on Bronx-specific programs, NYC benefits, federal programs, and community opportunities.

Respond in JSON format:
{
  "hiddenOpportunities": ["Specific programs or opportunities"],
  "qualifications": ["What they likely qualify for"],
  "strategicAdvice": ["Strategic recommendations"],
  "longTermPath": ["Steps for long-term improvement"]
}
`

    console.log("🚀 Calling Hack Club AI API for opportunity analysis...")
    const startTime = Date.now()

    const response = await fetch("https://ai.hackclub.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 1500,
      }),
    })

    const responseTime = Date.now() - startTime
    console.log(`⏱️ Opportunity analysis API response time: ${responseTime}ms`)

    if (!response.ok) {
      console.error("❌ Hack Club API error for opportunities:", response.status, response.statusText)
      throw new Error(`AI service error: ${response.status}`)
    }

    const data = await response.json()
    console.log("✅ Opportunity analysis response received")

    // Check if the response has the expected structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("❌ Unexpected AI response structure for opportunities:", data)
      throw new Error("Invalid AI response structure")
    }

    const aiResponse = data.choices[0].message.content

    // Parse JSON response
    const jsonStart = aiResponse.indexOf("{")
    const jsonEnd = aiResponse.lastIndexOf("}") + 1
    const jsonString = aiResponse.slice(jsonStart, jsonEnd)

    const parsed = JSON.parse(jsonString)
    console.log("🎯 Opportunity analysis parsed successfully")

    return parsed
  } catch (error) {
    console.error("❌ AI opportunity analysis error:", error)
    console.log("🔄 Using fallback opportunity analysis")
    return getFallbackOpportunities(userProfile)
  }
}

function getFallbackOpportunities(userProfile: UserProfile): {
  hiddenOpportunities: string[]
  qualifications: string[]
  strategicAdvice: string[]
  longTermPath: string[]
} {
  console.log("🔧 Generating dynamic fallback opportunities based on user profile...")

  const helpTypes = userProfile.answers[2] || []
  const specialSituations = userProfile.answers[4] || []
  const urgency = userProfile.answers[3]
  const livingSituation = userProfile.answers[1]

  // Create pools of varied responses
  const hiddenOpportunitiesPool = [
    "Emergency rental assistance programs through NYC Human Resources Administration",
    "Free tax preparation services at Bronx Volunteer Income Tax Assistance (VITA) sites",
    "Utility assistance programs through HEAP (Home Energy Assistance Program)",
    "Food stamp benefits enrollment with expedited processing for urgent cases",
    "Medicaid application assistance with same-day enrollment for emergencies",
    "Free legal aid services through Bronx Legal Services for housing issues",
    "NYC Family Homelessness & Eviction Prevention Supplement (FHEPS) vouchers",
    "One Shot Deal emergency assistance through HRA for rent arrears",
    "Workforce1 Career Centers for job placement and training",
    "NYCHA emergency housing applications",
    "Homebase homelessness prevention program",
    "Emergency food delivery for seniors and disabled individuals",
    "Free mental health crisis counseling through NYC Well",
    "Reduced-fare MetroCards for low-income New Yorkers",
    "Free childcare vouchers for working parents",
    "Free immigration legal services through ActionNYC",
    "Free financial counseling through NYC Financial Empowerment Centers",
  ]

  const qualificationsPool = [
    "Emergency assistance programs with same-day processing",
    "Standard assistance programs with weekly enrollment",
    "SNAP benefits and emergency food assistance",
    "WIC for pregnant women and families with young children",
    "Emergency housing vouchers for those facing eviction",
    "Medicaid and emergency medical coverage",
    "Free mental health services through community health centers",
    "Job training programs for unemployed residents",
    "Adult education and GED programs",
    "ESL classes for non-native English speakers",
    "Legal representation for housing court",
    "Childcare assistance for working parents",
    "Senior services for those over 60",
    "Disability services and accommodations",
    "Veteran-specific housing and employment programs",
    "Substance abuse treatment and recovery support",
    "Domestic violence shelter and services",
  ]

  const strategicAdvicePool = [
    "Apply for multiple programs simultaneously to maximize support",
    "Build relationships with case workers who can provide ongoing guidance",
    "Keep all documentation organized and make copies for multiple applications",
    "Ask every organization about additional services they offer",
    "Focus on crisis intervention first, then stability planning",
    "Consider long-term stability planning alongside immediate needs",
    "Connect with peer support groups in your community",
    "Create a weekly schedule for visiting different service providers",
    "Prioritize services that offer multiple types of assistance",
    "Follow up regularly on applications and waitlists",
    "Document all interactions with service providers",
    "Ask for written confirmation of appointments and services",
    "Identify one main case manager to coordinate your services",
    "Use 311 as a central resource for finding additional services",
    "Consider relocating to areas with better service access if possible",
    "Focus on one urgent need at a time to avoid feeling overwhelmed",
  ]

  const longTermPathPool = [
    "Address immediate crisis needs (housing, food, safety)",
    "Secure stable housing and consistent food access",
    "Focus on income stability through employment or benefits",
    "Build emergency savings, even if just $25-50 per month",
    "Develop career goals and access job training programs",
    "Build community connections and consider giving back when stable",
    "Improve educational qualifications through free programs",
    "Address health needs through preventive care",
    "Establish credit or repair damaged credit",
    "Develop a long-term housing stability plan",
    "Create a personal development plan with achievable goals",
    "Build a professional network in your field of interest",
    "Explore entrepreneurship opportunities in your community",
    "Develop digital literacy skills for better job opportunities",
    "Consider certification programs for career advancement",
  ]

  // Select items based on user profile to ensure relevance
  const hiddenOpportunities: string[] = []
  const qualifications: string[] = []
  const strategicAdvice: string[] = []
  const longTermPath: string[] = []

  // Add targeted opportunities based on user profile
  if (helpTypes.includes("housing")) {
    hiddenOpportunities.push(hiddenOpportunitiesPool[0]) // Emergency rental assistance
    if (livingSituation === "risk") {
      hiddenOpportunities.push(hiddenOpportunitiesPool[6]) // FHEPS vouchers
      qualifications.push(qualificationsPool[4]) // Emergency housing vouchers
    }
    if (livingSituation === "homeless") {
      hiddenOpportunities.push(hiddenOpportunitiesPool[9]) // NYCHA emergency housing
      qualifications.push(qualificationsPool[0]) // Emergency assistance programs
    }
  }

  if (helpTypes.includes("food")) {
    hiddenOpportunities.push(hiddenOpportunitiesPool[3]) // Food stamp benefits
    qualifications.push(qualificationsPool[2]) // SNAP benefits
    if (specialSituations.includes("children")) {
      qualifications.push(qualificationsPool[3]) // WIC
    }
  }

  if (specialSituations.includes("veteran")) {
    qualifications.push(qualificationsPool[14]) // Veteran-specific programs
  }

  if (specialSituations.includes("disability")) {
    hiddenOpportunities.push(hiddenOpportunitiesPool[11]) // Emergency food delivery
    qualifications.push(qualificationsPool[13]) // Disability services
  }

  // Fill remaining slots with randomized selections
  function fillRemainingRandomly(target: string[], pool: string[], count: number) {
    const shuffled = [...pool].filter((item) => !target.includes(item)).sort(() => 0.5 - Math.random())
    while (target.length < count && shuffled.length > 0) {
      target.push(shuffled.pop()!)
    }
  }

  fillRemainingRandomly(hiddenOpportunities, hiddenOpportunitiesPool, 5)
  fillRemainingRandomly(qualifications, qualificationsPool, 5)
  fillRemainingRandomly(strategicAdvice, strategicAdvicePool, 5)
  fillRemainingRandomly(longTermPath, longTermPathPool, 6)

  return {
    hiddenOpportunities,
    qualifications,
    strategicAdvice,
    longTermPath,
  }
}
