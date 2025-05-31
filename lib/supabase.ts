import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client for edge functions
export const createServerClient = () => {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
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
