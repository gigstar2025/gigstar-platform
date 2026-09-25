// Validates a post-login `next` redirect target. Only an app-relative path is
// allowed — never an absolute URL, a protocol-relative `//host` target, or a
// backslash trick — so `next` can never be used as an open-redirect to an
// external origin. Plain module (no "server-only") so both the client login
// form and the server post-login route can share exactly one rule.
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value || typeof value !== "string") return null
  if (!value.startsWith("/")) return null
  // Reject protocol-relative ("//evil.com") and backslash-normalised variants
  // that browsers may treat as an absolute URL.
  if (value.startsWith("//") || value.startsWith("/\\")) return null
  return value
}
