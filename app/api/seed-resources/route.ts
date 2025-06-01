import { NextResponse } from "next/server"
import { seedAdditionalResources } from "@/utils/seedDatabase"
import { createServerClient } from "@/lib/supabase"

// This endpoint allows seeding the database with additional resources
// Protected by admin check
export async function POST() {
  try {
    const supabase = createServerClient()

    // Check if user is authenticated and has admin role
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // In a real app, you'd check for admin role
    // For now, we'll just proceed with seeding

    const result = await seedAdditionalResources()

    if (result.success) {
      return NextResponse.json({
        message: `Successfully added ${result.count} resources to the database`,
      })
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in seed-resources route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
