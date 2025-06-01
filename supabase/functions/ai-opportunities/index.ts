import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const { userProfile } = await req.json()

    console.log("🔍 Starting AI opportunity analysis with Hack Club API...")

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

    return new Response(JSON.stringify(parsed), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    })
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
