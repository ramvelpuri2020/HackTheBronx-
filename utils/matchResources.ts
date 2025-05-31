import type { Resource } from "@/types/resource"

export function matchResources(resources: Resource[], query: string, category: string): Resource[] {
  let filtered = resources

  // Filter by category first
  if (category !== "all") {
    filtered = filtered.filter((resource) => resource.category === category)
  }

  // If no search query, return category-filtered results
  if (!query.trim()) {
    return filtered
  }

  const searchTerms = query
    .toLowerCase()
    .split(" ")
    .filter((term) => term.length > 0)

  return filtered.filter((resource) => {
    const searchableText = [
      resource.title,
      resource.description,
      resource.category,
      ...(resource.tags || []),
      resource.address,
    ]
      .join(" ")
      .toLowerCase()

    // Check if any search term matches
    return searchTerms.some((term) => {
      // Direct word match
      if (searchableText.includes(term)) return true

      // Handle common variations and synonyms
      const synonyms: { [key: string]: string[] } = {
        food: ["hungry", "eat", "meal", "grocery", "pantry", "kitchen"],
        housing: ["home", "apartment", "rent", "eviction", "homeless", "shelter"],
        job: ["work", "employment", "career", "training", "resume"],
        education: ["school", "ged", "college", "learn", "study", "class"],
        mental: ["therapy", "counseling", "depression", "anxiety", "stress"],
        help: ["assistance", "support", "aid", "service"],
        emergency: ["urgent", "crisis", "immediate", "now"],
      }

      // Check synonyms
      for (const [key, values] of Object.entries(synonyms)) {
        if (term === key || values.includes(term)) {
          if (searchableText.includes(key) || values.some((syn) => searchableText.includes(syn))) {
            return true
          }
        }
      }

      return false
    })
  })
}
