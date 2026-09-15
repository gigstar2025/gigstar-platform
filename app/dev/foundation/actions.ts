"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { runSeed } from "@/lib/db/seed"

export type SeedActionState = { status: "idle" | "success" | "error"; message: string }

// Server action to run the idempotent seed. Requires an authenticated user so
// the service-role seed can never be triggered anonymously.
export async function seedAction(): Promise<SeedActionState> {
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
    return { status: "error", message: (error as Error).message }
  }
}
