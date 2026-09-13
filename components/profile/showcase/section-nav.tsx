"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "cn"
import { SECTION_LABELS } from "./section-config"
import type { SectionKey } from "@/lib/profiles/showcase/types"

export function SectionNav({ sections }: { sections: SectionKey[] }) {
  const [active, setActive] = useState<string>(sections[0])
  const clickedRef = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (clickedRef.current) return
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    )
    sections.forEach((key) => {
      const el = document.getElementById(key)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [sections])

  const handleClick = (key: string) => {
    clickedRef.current = true
    setActive(key)
    document.getElementById(key)?.scrollIntoView({ behavior: "smooth", block: "start" })
    window.setTimeout(() => {
      clickedRef.current = false
    }, 700)
  }

  return (
    <nav
      aria-label="Profile sections"
      className="sticky top-14 z-30 -mx-4 border-b border-border/60 bg-background/85 px-4 backdrop-blur-md sm:top-16"
    >
      <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {sections.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => handleClick(key)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              active === key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {SECTION_LABELS[key]}
          </button>
        ))}
      </div>
    </nav>
  )
}
