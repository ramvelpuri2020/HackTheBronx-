"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, MapPin, Phone, Clock, ExternalLink, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { resources } from "@/data/resources"
import { matchResources } from "@/utils/matchResources"

const categories = [
  { id: "all", name: "All Resources", emoji: "🔍" },
  { id: "food", name: "Food", emoji: "🥫" },
  { id: "housing", name: "Housing", emoji: "🏠" },
  { id: "jobs", name: "Jobs", emoji: "💼" },
  { id: "education", name: "Education", emoji: "📚" },
  { id: "mental-health", name: "Mental Health", emoji: "🧠" },
]

export default function LiftLoopApp() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [filteredResources, setFilteredResources] = useState(resources)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    category: "",
    description: "",
    urgent: false,
  })

  useEffect(() => {
    const filtered = matchResources(resources, searchQuery, selectedCategory)
    setFilteredResources(filtered)
  }, [searchQuery, selectedCategory])

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Using FormSubmit.io for form handling
      const response = await fetch("https://formsubmit.co/ajax/help@liftloop.org", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          ...formData,
          _subject: `LiftLoop Help Request - ${formData.category}`,
          _template: "table",
        }),
      })

      if (response.ok) {
        alert("Your request has been submitted! Someone will contact you within 24 hours.")
        setIsFormOpen(false)
        setFormData({
          name: "",
          phone: "",
          email: "",
          category: "",
          description: "",
          urgent: false,
        })
      }
    } catch (error) {
      alert("There was an error submitting your request. Please try calling 311 for immediate assistance.")
    }
  }

  const getCategoryEmoji = (category: string) => {
    const cat = categories.find((c) => c.id === category)
    return cat ? cat.emoji : "📍"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">LiftLoop</h1>
            </div>
            <Badge variant="secondary" className="text-xs">
              Bronx, NY
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mt-1">Find help in the Bronx instantly</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="What do you need help with? (e.g., 'I need food', 'looking for job training')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-base"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="text-sm"
                >
                  <span className="mr-1">{category.emoji}</span>
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {filteredResources.length > 0
                ? `Found ${filteredResources.length} resource${filteredResources.length === 1 ? "" : "s"}`
                : "No resources found"}
            </h2>

            {filteredResources.length === 0 && (
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-red-600 hover:bg-red-700">🆘 Request Help</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Request Help</DialogTitle>
                    <DialogDescription>
                      We'll forward your request to local officials and support staff who can help.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone (optional)</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email (optional)</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">What type of help do you need?</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="food">🥫 Food Assistance</SelectItem>
                          <SelectItem value="housing">🏠 Housing Help</SelectItem>
                          <SelectItem value="jobs">💼 Job Training/Employment</SelectItem>
                          <SelectItem value="education">📚 Education/GED</SelectItem>
                          <SelectItem value="mental-health">🧠 Mental Health Support</SelectItem>
                          <SelectItem value="other">❓ Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="description">Describe what you need</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Please describe your situation and what kind of help you need..."
                        required
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="urgent"
                        checked={formData.urgent}
                        onChange={(e) => setFormData({ ...formData, urgent: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="urgent" className="text-sm">
                        This is urgent (within 24 hours)
                      </Label>
                    </div>
                    <div className="flex space-x-2">
                      <Button type="submit" className="flex-1">
                        Submit Request
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {filteredResources.length === 0 && (
            <Card className="border-dashed border-2 border-gray-300">
              <CardContent className="text-center py-8">
                <div className="text-4xl mb-2">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
                <p className="text-gray-600 mb-4">
                  Try different keywords or use the "Request Help" button above to get personalized assistance.
                </p>
                <div className="text-sm text-gray-500">
                  <p>
                    <strong>Emergency:</strong> Call 911
                  </p>
                  <p>
                    <strong>City Services:</strong> Call 311
                  </p>
                  <p>
                    <strong>Crisis Support:</strong> Call 988
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {filteredResources.map((resource) => (
            <Card key={resource.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">{getCategoryEmoji(resource.category)}</span>
                      <CardTitle className="text-lg">{resource.title}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {resource.category.replace("-", " ")}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="mb-4 text-sm leading-relaxed">{resource.description}</CardDescription>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>{resource.address}</span>
                  </div>

                  {resource.phone && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <a href={`tel:${resource.phone}`} className="text-blue-600 hover:underline">
                        {resource.phone}
                      </a>
                    </div>
                  )}

                  {resource.hours && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>{resource.hours}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {resource.phone && (
                    <Button size="sm" asChild>
                      <a href={`tel:${resource.phone}`}>
                        <Phone className="w-3 h-3 mr-1" />
                        Call
                      </a>
                    </Button>
                  )}

                  <Button size="sm" variant="outline" asChild>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(resource.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MapPin className="w-3 h-3 mr-1" />
                      Directions
                    </a>
                  </Button>

                  {resource.link && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={resource.link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Website
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-gray-600 mb-2">Made with ❤️ for the Bronx community</p>
          <p className="text-xs text-gray-500">Tech should lift people up - that's why we built LiftLoop.</p>
        </div>
      </footer>
    </div>
  )
}
