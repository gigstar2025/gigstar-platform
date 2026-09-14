"use client"

import { useEffect, useRef, useState } from "react"
import { Bookmark, Check, Heart, Link2, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "cn"

// Frontend-only demonstration of follow / save / share.
// State is local to the device — no account, network or storage.
export function ProfileActions({ displayName }: { displayName: string }) {
  const [following, setFollowing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedHint, setSavedHint] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const shareRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!shareOpen) return
    const onDown = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShareOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setShareOpen(false)
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [shareOpen])

  function toggleSave() {
    setSaved((prev) => {
      const next = !prev
      if (next) {
        setSavedHint(true)
        window.setTimeout(() => setSavedHint(false), 4500)
      }
      return next
    })
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable — no-op in this prototype.
    }
  }

  async function nativeOrPanel() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: `${displayName} on GigStar`, url: window.location.href })
        return
      } catch {
        // User cancelled or share failed — fall back to the panel.
      }
    }
    setShareOpen((o) => !o)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={following ? "outline" : "default"}
          onClick={() => setFollowing((f) => !f)}
          aria-pressed={following}
        >
          <Heart className={cn("size-4", following && "fill-current")} />
          {following ? "Following" : "Follow"}
        </Button>

        <Button variant="outline" onClick={toggleSave} aria-pressed={saved}>
          <Bookmark className={cn("size-4", saved && "fill-current")} />
          {saved ? "Saved" : "Save"}
        </Button>

        <div className="relative" ref={shareRef}>
          <Button variant="outline" onClick={nativeOrPanel} aria-expanded={shareOpen} aria-haspopup="menu">
            <Share2 className="size-4" />
            Share
          </Button>
          {shareOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-full z-40 mt-2 w-60 rounded-xl border border-border bg-popover p-2 shadow-xl"
            >
              <button
                type="button"
                role="menuitem"
                onClick={copyLink}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
              >
                {copied ? <Check className="size-4 text-primary" /> : <Link2 className="size-4" />}
                {copied ? "Link copied" : "Copy link"}
              </button>
              {["Share to X", "Share to WhatsApp", "Share to Facebook"].map((label) => (
                <button
                  key={label}
                  type="button"
                  role="menuitem"
                  onClick={() => setShareOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                >
                  <Share2 className="size-4 text-muted-foreground" />
                  {label}
                </button>
              ))}
              <p className="px-3 pb-1 pt-2 text-xs text-muted-foreground">Prototype sharing — nothing is posted.</p>
            </div>
          ) : null}
        </div>
      </div>

      <p
        role="status"
        aria-live="polite"
        className={cn(
          "text-xs text-muted-foreground transition-opacity",
          savedHint ? "opacity-100" : "h-0 select-none overflow-hidden opacity-0",
        )}
      >
        Saved on this device. Create a free account to keep it across devices.
      </p>
    </div>
  )
}
