"use client"
import { Heart, Users, Search, Shield, ArrowRight, CheckCircle, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function LandingPage() {
  const [isClient, setIsClient] = useState(false)

  // This ensures hydration issues are avoided
  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null // Return nothing during SSR to avoid hydration mismatch
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  LiftLoop
                </h1>
                <p className="text-xs text-gray-600">Bronx Community Support</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/official-login">
                <Button variant="outline" size="sm">
                  Official Portal
                </Button>
              </Link>
              <Link href="/auth">
                <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-800 border-blue-200">🏠 Serving the Bronx Community</Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Find Help in the Bronx
            <span className="block bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Instantly
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            LiftLoop connects Bronx residents with personalized local resources for food, housing, jobs, education, and
            mental health support. Get matched with the right help based on your specific needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-lg px-8 py-6"
              >
                Start Finding Help
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <div className="text-sm text-gray-500">
              <span className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                Free • Private • No Documentation Required
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How LiftLoop Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We understand that every situation is unique. Our personalized approach ensures you get the right help for
              your specific needs.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Tell Us About You</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Answer a few simple questions about your situation, needs, and preferences. This helps us understand
                  how to best support you.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">Get Personalized Matches</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Our system matches you with the most relevant local resources based on your specific needs, location,
                  and circumstances.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Get Connected & Supported</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Connect directly with resources or request additional support. Our team ensures you get the help you
                  need.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Resources We Connect You With</h2>
            <p className="text-gray-600">Real, verified, and up-to-date resources across the Bronx</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                emoji: "🥫",
                title: "Food Assistance",
                desc: "Food pantries, soup kitchens, emergency food programs",
                count: "15+ locations",
              },
              {
                emoji: "🏠",
                title: "Housing Support",
                desc: "Emergency shelters, rental assistance, legal aid",
                count: "12+ services",
              },
              {
                emoji: "💼",
                title: "Job Training",
                desc: "Career services, job placement, skills training",
                count: "10+ programs",
              },
              {
                emoji: "📚",
                title: "Education",
                desc: "GED programs, libraries, computer access, ESL classes",
                count: "8+ centers",
              },
              {
                emoji: "🧠",
                title: "Mental Health",
                desc: "Counseling, therapy, crisis intervention, support groups",
                count: "6+ providers",
              },
              {
                emoji: "👨‍👩‍👧‍👦",
                title: "Family Services",
                desc: "Childcare, family support, youth programs",
                count: "5+ organizations",
              },
            ].map((category, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow border-0 shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{category.emoji}</span>
                    <div>
                      <CardTitle className="text-lg">{category.title}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {category.count}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription>{category.desc}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Section */}
      <section className="py-16 px-4 bg-red-50 border-y border-red-100">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <Phone className="w-8 h-8 text-red-600 mr-3" />
            <h2 className="text-2xl font-bold text-red-900">Need Immediate Help?</h2>
          </div>
          <p className="text-red-800 mb-6">If you're in crisis or need immediate assistance, please contact:</p>
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div className="bg-white p-4 rounded-lg border border-red-200">
              <h3 className="font-bold text-red-900">Emergency</h3>
              <p className="text-2xl font-bold text-red-600">911</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-red-200">
              <h3 className="font-bold text-red-900">City Services</h3>
              <p className="text-2xl font-bold text-red-600">311</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-red-200">
              <h3 className="font-bold text-red-900">Crisis Support</h3>
              <p className="text-2xl font-bold text-red-600">988</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-6">Ready to Find the Help You Need?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of Bronx residents who have found support through LiftLoop
          </p>
          <Link href="/auth">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6">
              Get Started Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Heart className="w-6 h-6" />
                <span className="text-xl font-bold">LiftLoop</span>
              </div>
              <p className="text-gray-400 text-sm">Connecting Bronx residents with the support they need to thrive.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Resources</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Food Assistance</li>
                <li>Housing Support</li>
                <li>Job Training</li>
                <li>Education</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Support</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>How It Works</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Contact Us</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Emergency</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Emergency: 911</li>
                <li>City Services: 311</li>
                <li>Crisis Support: 988</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 LiftLoop. Made with ❤️ for the Bronx community.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
