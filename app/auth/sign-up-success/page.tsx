import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ResendConfirmationForm } from "@/components/auth/resend-confirmation-button"

export default function SignUpSuccessPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent a confirmation link. Confirm your address, then sign in to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">
              Didn&apos;t get it? Enter your email to send a new link.
            </p>
            <ResendConfirmationForm />
          </div>
          <Link href="/auth/login" className={buttonVariants({ variant: "outline", className: "w-full" })}>
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}
