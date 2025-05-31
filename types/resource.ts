export interface Resource {
  id: number
  title: string
  category: "food" | "housing" | "jobs" | "education" | "mental-health"
  address: string
  phone?: string
  hours?: string
  tags: string[]
  link?: string | null
  description: string
}
