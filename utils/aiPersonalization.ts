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
   Services: ${r.tags.join(", ")}
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

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer sk-b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
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

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0].message.content

    // Parse the AI response
    try {
      // Clean the response in case there's extra text
      const jsonStart = aiResponse.indexOf("{")
      const jsonEnd = aiResponse.lastIndexOf("}") + 1
      const jsonString = aiResponse.slice(jsonStart, jsonEnd)

      const parsed = JSON.parse(jsonString)

      // Validate the response structure
      if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
        throw new Error("Invalid AI response structure")
      }

      return parsed
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError)
      console.error("Raw AI response:", aiResponse)
      return getFallbackRecommendations(userProfile, resources)
    }
  } catch (error) {
    console.error("AI personalization error:", error)
    return getFallbackRecommendations(userProfile, resources)
  }
}

function getFallbackRecommendations(userProfile: UserProfile, resources: any[]) {
  // Enhanced fallback logic based on user answers
  const helpTypes = userProfile.answers[2] || []
  const urgency = userProfile.answers[3]
  const specialSituations = userProfile.answers[4] || []
  const livingSituation = userProfile.answers[1]

  // Filter and score resources
  const scoredResources = resources.map((resource) => {
    let score = 0
    let reasoning = ""
    let urgencyLevel = "medium"

    // Category matching
    if (helpTypes.includes(resource.category)) {
      score += 40
      reasoning = `Matches your ${resource.category} needs`
    }

    // Special situation matching
    if (specialSituations.includes("children") && resource.tags.includes("families")) {
      score += 20
      reasoning += " • Family-friendly services"
    }
    if (specialSituations.includes("veteran") && resource.tags.includes("veterans")) {
      score += 30
      reasoning += " • Veteran-specific services"
    }

    // Urgency-based prioritization
    if (urgency === "immediate") {
      if (resource.category === "housing" && helpTypes.includes("housing")) {
        score += 30
        urgencyLevel = "critical"
        reasoning += " • Critical for immediate housing needs"
      }
      if (resource.category === "food" && helpTypes.includes("food")) {
        score += 25
        urgencyLevel = "high"
        reasoning += " • Immediate food assistance available"
      }
    }

    // Living situation considerations
    if (livingSituation === "homeless" && resource.tags.includes("emergency shelter")) {
      score += 35
      urgencyLevel = "critical"
    }

    return {
      resourceId: resource.id,
      relevanceScore: Math.min(score, 100),
      reasoning: reasoning || `Relevant ${resource.category} resource for your situation`,
      urgencyLevel,
      actionItems: [
        `Call ${resource.title} at ${resource.phone || "their main number"}`,
        "Ask about eligibility requirements",
        "Inquire about additional services they offer",
      ],
      opportunities: ["Ask about other programs they offer", "Request referrals to partner organizations"],
    }
  })

  // Sort by score and take top results
  scoredResources.sort((a, b) => b.relevanceScore - a.relevanceScore)
  const topRecommendations = scoredResources.slice(0, 8).filter((r) => r.relevanceScore > 0)

  return {
    recommendations: topRecommendations,
    insights: [
      `Based on your ${urgency} needs, we've prioritized the most relevant resources.`,
      helpTypes.length > 1
        ? "You're looking for multiple types of support - many organizations offer comprehensive services."
        : "Focusing on your specific area of need.",
      specialSituations.length > 0
        ? `Your special circumstances (${specialSituations.join(", ")}) have been considered in these recommendations.`
        : "We've matched you with general community resources.",
    ],
    nextSteps: [
      urgency === "immediate"
        ? "Contact the highest priority resources today"
        : "Start with the top 2-3 recommended resources",
      "Prepare basic information: ID, proof of address, and income documentation",
      "Ask each organization about additional services and referrals",
    ],
    opportunities: [
      "Many organizations offer multiple services - always ask what else is available",
      "Some programs have waiting lists - apply early even if not immediately needed",
      "Building relationships with case workers can lead to additional opportunities",
    ],
  }
}

export async function getAIOpportunityAnalysis(userProfile: UserProfile): Promise<{
  hiddenOpportunities: string[]
  qualifications: string[]
  strategicAdvice: string[]
  longTermPath: string[]
}> {
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

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer sk-b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 1500,
      }),
    })

    const data = await response.json()
    const aiResponse = data.choices[0].message.content

    // Parse JSON response
    const jsonStart = aiResponse.indexOf("{")
    const jsonEnd = aiResponse.lastIndexOf("}") + 1
    const jsonString = aiResponse.slice(jsonStart, jsonEnd)

    return JSON.parse(jsonString)
  } catch (error) {
    console.error("AI opportunity analysis error:", error)

    // Fallback based on user profile
    const helpTypes = userProfile.answers[2] || []
    const specialSituations = userProfile.answers[4] || []
    const urgency = userProfile.answers[3]

    return {
      hiddenOpportunities: [
        "SNAP benefits if not already enrolled",
        helpTypes.includes("housing") ? "Emergency rental assistance programs" : "Utility assistance programs",
        specialSituations.includes("children") ? "WIC program for families with children" : "Senior discount programs",
        "Free tax preparation services",
        "Medicaid enrollment assistance",
      ],
      qualifications: [
        "Emergency assistance programs",
        "Utility assistance programs",
        helpTypes.includes("food") ? "Food stamp benefits" : "Housing voucher programs",
        specialSituations.includes("veteran") ? "VA benefits and services" : "Community health programs",
        "Free legal aid services",
      ],
      strategicAdvice: [
        "Start with immediate needs first, then build toward long-term stability",
        "Build relationships with case workers - they often know about additional resources",
        "Apply for multiple programs simultaneously to maximize support",
        "Keep all documentation organized for faster application processes",
        "Ask every organization about other services and referrals",
      ],
      longTermPath: [
        urgency === "immediate" ? "Stabilize immediate crisis situation" : "Address most urgent needs first",
        "Secure stable housing and food security",
        "Focus on income stability through employment or benefits",
        "Build emergency savings and financial literacy",
        "Develop long-term career or education goals",
        "Give back to the community when stable",
      ],
    }
  }
}
