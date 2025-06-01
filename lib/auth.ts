import { supabase } from "./supabase"

export const signUp = async (email: string, password: string, name: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) throw error

  // Create user profile after successful signup
  if (data.user) {
    try {
      const { error: profileError } = await supabase.from("user_profiles").insert({
        id: data.user.id,
        email: data.user.email!,
        name: name,
        onboarding_completed: false,
        preferred_language: "en",
      })

      if (profileError) {
        console.error("Failed to create user profile:", profileError)
        // Don't throw error here, let the user continue
      }
    } catch (err) {
      console.error("Profile creation error:", err)
    }
  }

  return data
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) throw error
}

export const updatePassword = async (password: string) => {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}

export const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export const getUserProfile = async (userId: string) => {
  // Use maybeSingle() to handle cases where profile might not exist
  const { data, error } = await supabase.from("user_profiles").select("*").eq("id", userId).maybeSingle()

  if (error) throw error

  // If no profile exists, create one
  if (!data) {
    const user = await getCurrentUser()
    if (user) {
      const newProfile = {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || "User",
        onboarding_completed: false,
        preferred_language: "en",
      }

      const { data: createdProfile, error: createError } = await supabase
        .from("user_profiles")
        .insert(newProfile)
        .select()
        .single()

      if (createError) throw createError
      return createdProfile
    }
  }

  return data
}

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  const { data, error } = await supabase
    .from("user_profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export interface UserProfile {
  id: string
  email: string
  name: string
  onboarding_completed: boolean
}
