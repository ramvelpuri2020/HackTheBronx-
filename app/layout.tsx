import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "LiftLoop - Find Help in the Bronx Instantly",
  description:
    "Find local resources for food, housing, jobs, education, and mental health support in the Bronx. Offline-ready web app for instant help.",
  keywords:
    "Bronx, resources, food assistance, housing help, job training, education, mental health, community support",
  authors: [{ name: "LiftLoop Team" }],
  creator: "LiftLoop",
  publisher: "LiftLoop",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  robots: "index, follow",
  openGraph: {
    title: "LiftLoop - Find Help in the Bronx Instantly",
    description: "Find local resources for food, housing, jobs, education, and mental health support in the Bronx.",
    type: "website",
    locale: "en_US",
    siteName: "LiftLoop",
  },
  twitter: {
    card: "summary_large_image",
    title: "LiftLoop - Find Help in the Bronx Instantly",
    description: "Find local resources for food, housing, jobs, education, and mental health support in the Bronx.",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="LiftLoop" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
