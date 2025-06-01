import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { userProfile, resources } = await req.json()

    console.log("🤖 Starting AI personalization with Hack Club API...")
    console.log("📊 User profile:", { name: userProfile.name, answersCount: Object.keys(userProfile.answers).length })

    // Create comprehensive prompt
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

    // Call Hack Club AI API
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

      // Save to database
      const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "")

      // Save AI recommendations to database
      const { error: saveError } = await supabase.from("ai_recommendations").upsert({
        user_id: userProfile.userId,
        recommendations: parsed,
        insights: { insights: parsed.insights },
        opportunities: parsed.opportunities,
      })

      if (saveError) {
        console.error("Failed to save recommendations:", saveError)
      }

      return new Response(JSON.stringify(parsed), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      })
    } catch (parseError) {
      console.error("❌ Failed to parse AI response:", parseError)
      console.error("📄 Raw AI response:", aiResponse.substring(0, 500) + "...")
      throw new Error("Failed to parse AI response")
    }
  } catch (error) {
    console.error("❌ Edge function error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    })
  }
})
