import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Set up your profile — GigStar",
  description: "Create your first GigStar profile in a few quick steps.",
}

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return children
}
