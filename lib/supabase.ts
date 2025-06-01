import { createClient } from "@supabase/supabase-js"

// Hardcoded Supabase credentials for v0 environment
const supabaseUrl = "https://mxfkubexfqmrqudqusib.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14Zmt1YmV4ZnFtcnF1ZHF1c2liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3MTUwNDMsImV4cCI6MjA2NDI5MTA0M30.xyGPK0fDI5lQGVXeLBdkCkdeOjXJbHD1CfkbxU2wnNk"

// Create a single supabase client for interacting with your database
let supabaseInstance: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (supabaseInstance) return supabaseInstance

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase URL or Anon Key is missing")
    throw new Error("Supabase configuration is missing")
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  return supabaseInstance
}

// Export for convenience
export const supabase = getSupabase()

// Server-side client for edge functions
export const createServerClient = () => {
  // For v0 environment, use the same credentials
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Database types
export interface UserProfile {
  id: string
  email: string
  name: string
  created_at: string
  updated_at: string
  onboarding_completed: boolean
  preferred_language: string
}

export interface OnboardingAnswer {
  id: string
  user_id: string
  question_id: number
  answer: any
  created_at: string
  updated_at: string
}

export interface AIRecommendation {
  id: string
  user_id: string
  recommendations: any
  insights: any
  opportunities: any
  created_at: string
  expires_at: string
}

export interface MajorSupportRequest {
  id: string
  user_id: string
  urgency: "immediate" | "this-week" | "this-month"
  situation: string
  assistance: string
  contact: string
  status: "pending" | "in-progress" | "completed" | "closed"
  assigned_to?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Resource {
  id: string
  title: string
  category: string
  address: string
  phone?: string
  hours?: string
  tags: string[]
  link?: string
  description: string
  verified: boolean
  created_at: string
  updated_at: string
  created_by?: string
}
