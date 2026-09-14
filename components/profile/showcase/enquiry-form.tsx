"use client"

import { useState } from "react"
import { CheckCircle2, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PRIMARY_CTA, type ShowcaseType } from "@/lib/profiles/showcase/types"
import { cn } from "cn"

type FieldType = "text" | "email" | "date" | "number" | "textarea" | "select"

interface Field {
  name: string
  label: string
  type: FieldType
  options?: string[]
  required?: boolean
  placeholder?: string
  full?: boolean
}

// Type-specific enquiry fields. Frontend-only — nothing is sent or stored.
const FIELD_SETS: Record<ShowcaseType, Field[]> = {
  artist: [
    { name: "date", label: "Event date", type: "date" },
    { name: "eventType", label: "Event type", type: "text", placeholder: "Festival, private party…" },
    { name: "venue", label: "Venue", type: "text" },
    { name: "location", label: "Location", type: "text", placeholder: "Town or city" },
    { name: "format", label: "Performance format", type: "select", options: ["Full live band", "Stripped-back trio", "DJ / hybrid set", "Acoustic set"] },
    { name: "setLength", label: "Proposed set length", type: "text", placeholder: "e.g. 60 minutes" },
    { name: "audience", label: "Expected audience", type: "number", placeholder: "e.g. 400" },
    { name: "budget", label: "Budget", type: "text", placeholder: "£" },
    { name: "production", label: "Production information", type: "textarea", full: true, placeholder: "Stage, PA, backline provided?" },
    { name: "name", label: "Contact name", type: "text", required: true },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "message", label: "Message", type: "textarea", full: true, required: true },
  ],
  venue: [
    { name: "date", label: "Proposed date", type: "date" },
    { name: "eventType", label: "Event type", type: "text", placeholder: "Gig, club night, launch…" },
    { name: "guests", label: "Number of guests", type: "number", placeholder: "e.g. 150" },
    { name: "space", label: "Preferred space", type: "select", options: ["No preference", "The Main Hall", "The Mezzanine", "The Cellar"] },
    { name: "layout", label: "Layout", type: "select", options: ["Standing", "Seated", "Mixed"] },
    { name: "food", label: "Food requirements", type: "text", placeholder: "Catering, none, drinks only…" },
    { name: "bar", label: "Bar requirements", type: "text", placeholder: "Cash bar, tab, package…" },
    { name: "production", label: "Production requirements", type: "textarea", full: true, placeholder: "PA, lighting, AV…" },
    { name: "access", label: "Access times", type: "text", placeholder: "Load-in / soundcheck" },
    { name: "budget", label: "Estimated budget", type: "text", placeholder: "£" },
    { name: "name", label: "Contact name", type: "text", required: true },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "message", label: "Message", type: "textarea", full: true, required: true },
  ],
  organiser: [
    { name: "enquiryType", label: "Enquiry type", type: "select", required: true, options: ["Artist or agent", "Venue", "Sponsor or partner", "Trader", "Press", "Customer", "General enquiry"] },
    { name: "name", label: "Name", type: "text", required: true },
    { name: "organisation", label: "Organisation", type: "text" },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "event", label: "Related event (if applicable)", type: "text", full: true },
    { name: "message", label: "Message", type: "textarea", full: true, required: true },
  ],
  dj: [
    { name: "date", label: "Event date", type: "date" },
    { name: "eventType", label: "Event type", type: "text", placeholder: "Club night, wedding, festival…" },
    { name: "venue", label: "Venue", type: "text" },
    { name: "location", label: "Location", type: "text", placeholder: "Town or city" },
    { name: "setLength", label: "Set length", type: "text", placeholder: "e.g. 90 minutes" },
    { name: "budget", label: "Budget", type: "text", placeholder: "£" },
    { name: "name", label: "Contact name", type: "text", required: true },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "message", label: "Message", type: "textarea", full: true, required: true },
  ],
}

export function EnquiryForm({
  type,
  displayName,
  contactEmail,
}: {
  type: ShowcaseType
  displayName: string
  contactEmail: string
}) {
  const [sent, setSent] = useState(false)
  const fields = FIELD_SETS[type]

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-card p-8 text-center ring-1 ring-primary/30">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
          <CheckCircle2 className="size-7" />
        </span>
        <div className="space-y-1">
          <h3 className="text-xl font-semibold">Enquiry sent</h3>
          <p className="mx-auto max-w-md text-pretty text-sm text-muted-foreground">
            This is a demonstration — nothing was sent or stored. In the live product, {displayName} would
            normally reply within a couple of working days.
          </p>
        </div>
        <Button variant="outline" onClick={() => setSent(false)}>
          Send another enquiry
        </Button>
      </div>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        setSent(true)
      }}
      className="rounded-2xl bg-card p-6 ring-1 ring-foreground/10 md:p-8"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Prototype form — or email{" "}
          <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">
            {contactEmail}
          </a>
        </p>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Mail className="size-3.5" /> No account needed
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.name} className={cn("flex flex-col gap-1.5", f.full && "sm:col-span-2")}>
            <Label htmlFor={`enq-${f.name}`}>
              {f.label}
              {f.required ? <span className="text-primary"> *</span> : null}
            </Label>
            {f.type === "textarea" ? (
              <Textarea id={`enq-${f.name}`} name={f.name} required={f.required} placeholder={f.placeholder} rows={4} />
            ) : f.type === "select" ? (
              <select
                id={`enq-${f.name}`}
                name={f.name}
                required={f.required}
                defaultValue=""
                className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="" disabled>
                  Select…
                </option>
                {f.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id={`enq-${f.name}`}
                name={f.name}
                type={f.type}
                required={f.required}
                placeholder={f.placeholder}
                className="h-9"
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg">
          {PRIMARY_CTA[type]}
        </Button>
        <span className="text-xs text-muted-foreground">You&apos;ll see a confirmation on screen.</span>
      </div>
    </form>
  )
}
