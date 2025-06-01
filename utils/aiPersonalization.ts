// utils/aiPersonalization.ts

/**
 * This file contains utility functions for AI personalization.
 * It focuses on providing personalized experiences based on user data.
 */

import { getCookie } from "cookies-next"

/**
 * Fetches user data from a hypothetical API endpoint.
 * In a real-world scenario, this would involve authentication and authorization.
 * @returns {Promise<any>} A promise that resolves to the user data.
 */
async function fetchUserData(): Promise<any> {
  const userId = getCookie("userId")

  if (!userId) {
    return null // Or handle the case where the user is not logged in
  }

  try {
    const response = await fetch(`/api/user/${userId}`) // Replace with your actual API endpoint
    if (!response.ok) {
      // Handle HTTP errors appropriately
      console.error(`HTTP error! status: ${response.status}`)
      return null
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching user data:", error)
    return null // Or handle the error more gracefully
  }
}

/**
 * Generates personalized content based on user data.
 * This is a placeholder function and should be replaced with actual AI logic.
 * @param {any} userData The user data to personalize the content with.
 * @returns {string} Personalized content.
 */
function generatePersonalizedContent(userData: any): string {
  if (!userData) {
    return "Welcome! Explore our general content."
  }

  // Example: Personalize based on user's name and preferences
  const name = userData.name || "User"
  const preferences = userData.preferences || []

  let personalizedMessage = `Welcome back, ${name}! `

  if (preferences.length > 0) {
    personalizedMessage += `We've tailored content based on your preferences: ${preferences.join(", ")}.`
  } else {
    personalizedMessage += "Check out our latest recommendations for you."
  }

  return personalizedMessage
}

/**
 * Orchestrates the AI personalization process.
 * @returns {Promise<string>} A promise that resolves to the personalized content.
 */
export async function getPersonalizedContent(): Promise<string> {
  try {
    const userData = await fetchUserData()
    const personalizedContent = generatePersonalizedContent(userData)
    return personalizedContent
  } catch (error) {
    console.error("Error during personalization:", error)
    return "An error occurred while personalizing your experience." // Generic error message
  }
}

export async function getAIPersonalizedRecommendations(userProfile: any, resources: any[]) {
  try {
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
      "resourceId": "[resource ID from database]",
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

    if (!response.ok) {
      console.error(`AI service error: ${response.status}`)
      throw new Error(`AI service error: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0].message.content

    // Parse the AI response
    try {
      const jsonStart = aiResponse.indexOf("{")
      const jsonEnd = aiResponse.lastIndexOf("}") + 1
      const jsonString = aiResponse.slice(jsonStart, jsonEnd)

      const parsed = JSON.parse(jsonString)

      if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
        throw new Error("Invalid AI response structure")
      }

      return parsed
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError)
      return getFallbackRecommendations(userProfile, resources)
    }
  } catch (error) {
    console.error("AI personalization error:", error)
    return getFallbackRecommendations(userProfile, resources)
  }
}

export async function getAIOpportunityAnalysis(userProfile: any) {
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

    const data = await response.json()
    const aiResponse = data.choices[0].message.content

    const jsonStart = aiResponse.indexOf("{")
    const jsonEnd = aiResponse.lastIndexOf("}") + 1
    const jsonString = aiResponse.slice(jsonStart, jsonEnd)

    return JSON.parse(jsonString)
  } catch (error) {
    console.error("AI opportunity analysis error:", error)
    return getFallbackOpportunities(userProfile)
  }
}

function getFallbackRecommendations(userProfile: any, resources: any[]) {
  const helpTypes = userProfile.answers[2] || []
  const urgency = userProfile.answers[3]

  const scoredResources = resources.slice(0, 6).map((resource, index) => ({
    resourceId: resource.id,
    relevanceScore: 85 - index * 5,
    reasoning: `This resource matches your ${resource.category} needs and is highly rated in the Bronx community.`,
    urgencyLevel: urgency === "immediate" ? "high" : "medium",
    actionItems: [
      `Contact ${resource.title} directly`,
      "Ask about eligibility requirements",
      "Inquire about additional services",
    ],
    opportunities: ["Ask about other programs", "Request referrals"],
  }))

  return {
    recommendations: scoredResources,
    insights: [
      "Based on your responses, we've identified several relevant resources.",
      "Your situation qualifies you for multiple support programs.",
      "Consider reaching out to multiple organizations for comprehensive support.",
    ],
    nextSteps: [
      "Contact the highest-rated resources first",
      "Prepare basic documentation",
      "Ask about additional services at each location",
    ],
    opportunities: [
      "Many organizations offer multiple services",
      "Building relationships with case workers opens more opportunities",
      "Some programs have waiting lists - apply early",
    ],
  }
}

function getFallbackOpportunities(userProfile: any) {
  return {
    hiddenOpportunities: [
      "Emergency rental assistance programs",
      "Free tax preparation services",
      "Utility assistance programs",
      "Food stamp benefits enrollment",
      "Medicaid application assistance",
    ],
    qualifications: [
      "Emergency assistance programs",
      "Community health programs",
      "Free legal aid services",
      "Educational support programs",
      "Job training initiatives",
    ],
    strategicAdvice: [
      "Apply for multiple programs simultaneously",
      "Build relationships with case workers",
      "Keep all documentation organized",
      "Ask every organization about additional services",
      "Consider long-term stability planning",
    ],
    longTermPath: [
      "Address immediate crisis needs",
      "Secure stable housing and food",
      "Focus on income stability",
      "Build emergency savings",
      "Develop career goals",
      "Give back to community",
    ],
  }
}
