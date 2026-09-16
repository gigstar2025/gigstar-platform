"use server"

import { notFound } from "next/navigation"
import { revalidatePath } from "next/cache"

import { IS_PRODUCTION } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import { runSeed } from "@/lib/db/seed"

export type SeedActionState = { status: "idle" | "success" | "error"; message: string }

// Server action to run the idempotent seed. Requires an authenticated user so
// the service-role seed can never be triggered anonymously.
export async function seedAction(): Promise<SeedActionState> {
  // Hard server-side block in Production: even a hand-crafted invocation of
  // this action gets a generic 404 and never reaches the seed. This is the
  // authoritative guard — hiding the button is only cosmetic.
  if (IS_PRODUCTION) {
    notFound()
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { status: "error", message: "You must be signed in to run the seed." }
  }

  try {
    const result = await runSeed()
    revalidatePath("/dev/foundation")
    const total = result.profiles.reduce((sum, p) => sum + p.modules, 0)
    return {
      status: "success",
      message: `Seeded ${result.profiles.length} profiles with ${total} published modules.`,
    }
  } catch (error) {
    // Log full technical detail server-side; return a generic message so no
    // database/table/SQL detail is surfaced to the client.
    console.error("[dev/foundation] seed failed:", error)
    return { status: "error", message: "The seed could not be completed. Check the server logs for details." }
  }
}
