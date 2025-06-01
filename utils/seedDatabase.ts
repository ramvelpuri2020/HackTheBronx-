import { supabase } from "@/lib/supabase"

// This utility function can be used to seed the database with more varied resources
// Run this from a server action or admin panel

export async function seedAdditionalResources() {
  const additionalResources = [
    {
      title: "Bronx Community Solutions",
      category: "legal",
      address: "215 E 161st St, Bronx, NY 10451",
      phone: "718-618-2490",
      hours: "Mon-Fri, 9am-5pm",
      tags: ["legal aid", "court advocacy", "social services", "community service"],
      link: "https://www.bronxcommunitysolutions.org/",
      description:
        "Alternative sentencing programs, court advocacy, and social services for individuals involved in the criminal justice system.",
      verified: true,
    },
    {
      title: "Bronx Parent Housing Network",
      category: "housing",
      address: "488 E 164th St, Bronx, NY 10456",
      phone: "718-617-6100",
      hours: "Mon-Fri, 9am-5pm",
      tags: ["family housing", "rapid rehousing", "case management", "homeless prevention"],
      link: "https://www.bphn.org/",
      description: "Rapid rehousing, emergency shelter, and homeless prevention services for families in the Bronx.",
      verified: true,
    },
    {
      title: "Workforce1 Career Center - Bronx",
      category: "jobs",
      address: "400 E Fordham Rd, Bronx, NY 10458",
      phone: "718-960-7901",
      hours: "Mon-Fri, 8:30am-5pm",
      tags: ["job placement", "career counseling", "resume help", "training vouchers"],
      link: "https://www1.nyc.gov/site/sbs/careers/careers.page",
      description:
        "Free job placement services, career counseling, and training opportunities. Connects job seekers with employers and training programs.",
      verified: true,
    },
    {
      title: "Bronx Health REACH",
      category: "healthcare",
      address: "16 E 16th St, New York, NY 10003",
      phone: "212-633-0800",
      hours: "Mon-Fri, 9am-5pm",
      tags: ["healthcare access", "nutrition", "diabetes prevention", "community health"],
      link: "https://www.institute.org/bronx-health-reach/",
      description:
        "Coalition working to eliminate racial and ethnic health disparities in the Bronx. Provides access to healthcare, nutrition education, and disease prevention programs.",
      verified: true,
    },
    {
      title: "Bronx Community College Adult Education",
      category: "education",
      address: "2155 University Ave, Bronx, NY 10453",
      phone: "718-289-5100",
      hours: "Mon-Thu, 9am-9pm; Fri-Sat, 9am-5pm",
      tags: ["adult education", "GED", "ESL", "computer literacy"],
      link: "http://www.bcc.cuny.edu/",
      description:
        "Free adult education classes including GED preparation, English as a Second Language, and basic computer skills. Open to all Bronx residents.",
      verified: true,
    },
    {
      title: "Montefiore Medical Center - Behavioral Health",
      category: "mental-health",
      address: "111 E 210th St, Bronx, NY 10467",
      phone: "718-920-4321",
      hours: "Mon-Fri, 8am-6pm; Crisis services 24/7",
      tags: ["mental health", "psychiatry", "therapy", "crisis intervention", "substance abuse"],
      link: "https://www.montefiore.org/psychiatry",
      description:
        "Comprehensive mental health services including psychiatric evaluation, therapy, medication management, and crisis intervention. Accepts most insurance and Medicaid.",
      verified: true,
    },
    {
      title: "Bronx Defenders",
      category: "legal",
      address: "360 E 161st St, Bronx, NY 10451",
      phone: "718-838-7878",
      hours: "Mon-Fri, 9am-6pm",
      tags: ["legal aid", "criminal defense", "family court", "immigration", "housing court"],
      link: "https://www.bronxdefenders.org/",
      description:
        "Holistic legal services for low-income Bronx residents. Handles criminal defense, family court, immigration, and housing cases.",
      verified: true,
    },
    {
      title: "Mercy Center",
      category: "family",
      address: "377 E 145th St, Bronx, NY 10454",
      phone: "718-993-2789",
      hours: "Mon-Fri, 8:30am-5pm",
      tags: ["family services", "women's programs", "immigration", "ESL", "parenting"],
      link: "https://www.mercycenter.org/",
      description:
        "Community center offering programs for women and families including ESL classes, immigration services, parenting programs, and case management.",
      verified: true,
    },
    {
      title: "The Door - Bronx Youth Center",
      category: "youth",
      address: "424 E 147th St, Bronx, NY 10455",
      phone: "212-941-9090",
      hours: "Mon-Fri, 11am-7pm",
      tags: ["youth services", "education", "employment", "health", "legal"],
      link: "https://door.org/",
      description:
        "Comprehensive youth development services for ages 12-24 including education, employment, health, legal services, and recreation.",
      verified: true,
    },
    {
      title: "Neighborhood SHOPP Senior Center",
      category: "seniors",
      address: "953 Southern Blvd, Bronx, NY 10459",
      phone: "718-542-2923",
      hours: "Mon-Fri, 8am-4pm",
      tags: ["senior services", "meals", "activities", "case management", "transportation"],
      link: "https://www.nshopp.org/",
      description:
        "Senior center providing meals, recreational activities, case management, and transportation services for older adults in the Bronx.",
      verified: true,
    },
  ]

  try {
    const { data, error } = await supabase.from("resources").insert(additionalResources).select()

    if (error) {
      console.error("Error seeding additional resources:", error)
      return { success: false, error }
    }

    return { success: true, count: data?.length || 0 }
  } catch (err) {
    console.error("Exception seeding resources:", err)
    return { success: false, error: err }
  }
}
