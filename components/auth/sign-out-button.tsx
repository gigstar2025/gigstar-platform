"use client"

import { useFormStatus } from "react-dom"

import { signOut } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"

type ButtonVariant = React.ComponentProps<typeof Button>["variant"]

function SubmitButton({ variant }: { variant: ButtonVariant }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant={variant} disabled={pending}>
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  )
}

export function SignOutButton({ variant = "outline" }: { variant?: ButtonVariant }) {
  return (
    <form action={signOut}>
      <SubmitButton variant={variant} />
    </form>
  )
}
