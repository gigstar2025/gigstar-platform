"use client"

import { useCallback, useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { cn } from "cn"
import type { MediaItem } from "@/lib/profiles/showcase/types"

export function GalleryGrid({ items }: { items: MediaItem[] }) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)

  const show = useCallback((i: number) => {
    setIndex(i)
    setOpen(true)
  }, [])

  const step = useCallback(
    (dir: number) => setIndex((i) => (i + dir + items.length) % items.length),
    [items.length],
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
      if (e.key === "ArrowRight") step(1)
      if (e.key === "ArrowLeft") step(-1)
    }
    window.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open, step])

  const current = items[index]

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => show(i)}
            className={cn(
              "group relative aspect-square overflow-hidden rounded-lg ring-1 ring-foreground/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              i === 0 && items.length > 4 && "col-span-2 row-span-2 aspect-auto",
            )}
          >
            <img
              src={item.src || "/placeholder.svg"}
              alt={item.alt}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {item.caption ? (
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-2 text-left text-xs text-foreground/90">
                {item.caption}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {open && current ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full bg-muted/80 p-2 text-foreground hover:bg-muted"
          >
            <X className="size-5" />
          </button>
          {items.length > 1 ? (
            <button
              type="button"
              aria-label="Previous image"
              onClick={(e) => {
                e.stopPropagation()
                step(-1)
              }}
              className="absolute left-4 rounded-full bg-muted/80 p-2 hover:bg-muted"
            >
              <ChevronLeft className="size-6" />
            </button>
          ) : null}
          <figure
            className="max-h-[85vh] max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={current.src || "/placeholder.svg"}
              alt={current.alt}
              className="mx-auto max-h-[80vh] w-auto rounded-lg object-contain"
            />
            {current.caption ? (
              <figcaption className="mt-3 text-center text-sm text-muted-foreground">
                {current.caption}
              </figcaption>
            ) : null}
          </figure>
          {items.length > 1 ? (
            <button
              type="button"
              aria-label="Next image"
              onClick={(e) => {
                e.stopPropagation()
                step(1)
              }}
              className="absolute right-4 rounded-full bg-muted/80 p-2 hover:bg-muted"
            >
              <ChevronRight className="size-6" />
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  )
}
