import Link from "next/link"

import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { confirmEmailAction } from "./actions"

// The emailed link performs a GET to this page. We intentionally DO NOT verify
// the one-time token on GET — email security scanners auto-issue a GET that
// would burn the single-use token before the human clicks (the `otp_expired`
// symptom). Verification happens only on the explicit POST in confirmEmailAction.
export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string; next?: string }>
}) {
  const { token_hash: tokenHash, type, next } = await searchParams

  if (!tokenHash || !type) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Link incomplete</CardTitle>
            <CardDescription>
              This confirmation link is missing information. Please use the most recent link from your email.
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

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Confirm your email</CardTitle>
          <CardDescription>
            Press the button below to finish confirming your email address and sign in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={confirmEmailAction} className="flex flex-col gap-4">
            <input type="hidden" name="token_hash" value={tokenHash} />
            <input type="hidden" name="type" value={type} />
            {next ? <input type="hidden" name="next" value={next} /> : null}
            <Button type="submit" className="w-full">
              Confirm email
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
