import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// Sample resources data for seeding
const sampleResources = [
  {
    title: "Bronx Works Food Pantry",
    category: "food",
    address: "60 E Tremont Ave, Bronx, NY 10453",
    phone: "(718) 731-3114",
    hours: "Mon-Fri: 9am-5pm",
    tags: ["food pantry", "emergency food", "snap assistance"],
    description: "BronxWorks operates food pantries that provide emergency food to individuals and families in need.",
    verified: true,
  },
  {
    title: "NYCHA Housing Application Center",
    category: "housing",
    address: "478 E. Fordham Rd., 2nd Floor, Bronx, NY 10458",
    phone: "(718) 707-7771",
    hours: "Mon-Fri: 8am-5pm",
    tags: ["public housing", "section 8", "housing assistance"],
    description:
      "Apply for NYCHA public housing and Section 8 vouchers. Bring ID, proof of income, and household information.",
    verified: true,
  },
  {
    title: "Workforce1 Career Center",
    category: "employment",
    address: "400 E Fordham Rd, Bronx, NY 10458",
    phone: "(718) 960-7099",
    hours: "Mon-Fri: 8:30am-5pm",
    tags: ["job search", "resume help", "career counseling", "training"],
    description:
      "Free job search assistance, career counseling, and connection to training opportunities for job seekers.",
    verified: true,
  },
]

export async function GET() {
  try {
    const supabase = createServerClient()

    // Check if resources already exist
    const { data: existingResources, error: checkError } = await supabase.from("resources").select("id").limit(1)

    if (checkError) {
      throw new Error(`Failed to check existing resources: ${checkError.message}`)
    }

    // Only seed if no resources exist
    if (existingResources && existingResources.length === 0) {
      const { error: insertError } = await supabase.from("resources").insert(sampleResources)

      if (insertError) {
        throw new Error(`Failed to seed resources: ${insertError.message}`)
      }

      return NextResponse.json({
        success: true,
        message: "Resources seeded successfully",
        count: sampleResources.length,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Resources already exist, skipping seed",
      count: existingResources.length,
    })
  } catch (error: any) {
    console.error("Error seeding resources:", error)
    return NextResponse.json({ error: error.message || "Failed to seed resources" }, { status: 500 })
  }
}
