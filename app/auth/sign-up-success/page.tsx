import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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
        <CardContent>
          <Link href="/auth/login" className={buttonVariants({ className: "w-full" })}>
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}
