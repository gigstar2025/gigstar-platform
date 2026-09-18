import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"

// Interim handoff surface shown after onboarding creates a real profile.
// The full editor is still bound to showcase/demo data (wired to the database
// in a later PR), so instead of 404-ing the happy path we confirm the profile
// was created and point the user to their public page and the editor entry.
export function ProfileCreatedLanding({
  displayName,
  slug,
  typeLabel,
}: {
  displayName: string
  slug: string
  typeLabel: string
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col justify-center px-4 py-12">
      <span className="text-sm font-medium text-primary">Profile created</span>
      <h1 className="mt-2 text-2xl font-semibold text-balance">
        {displayName} is ready
      </h1>
      <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">
        Your {typeLabel.toLowerCase()} profile was created as a private draft. Only you can see it
        until you publish. Full editing lands soon — for now you can view your page.
      </p>

      <dl className="mt-6 rounded-lg border border-border bg-card px-4 py-3">
        <dt className="text-xs uppercase tracking-wide text-muted-foreground">Your handle</dt>
        <dd className="text-card-foreground">gigstar.com/{slug}</dd>
      </dl>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link href={`/profile/${slug}`} className={buttonVariants()}>
          View profile
        </Link>
        <Link href="/" className={buttonVariants({ variant: "ghost" })}>
          Back home
        </Link>
      </div>
    </div>
  )
}
