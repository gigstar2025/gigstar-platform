import "server-only"

// Server-only environment helpers.
//
// `VERCEL_ENV` is a non-public server variable set by Vercel to "production",
// "preview", or "development". Because this module is `server-only`, the value
// can never be bundled into client code, so production-only guards built on it
// cannot be inspected or bypassed from the browser.

export const IS_PRODUCTION = process.env.VERCEL_ENV === "production"

// True only in explicitly non-production environments (Preview, Development,
// or local). Diagnostic and seed surfaces are gated on this.
export const IS_NON_PRODUCTION = !IS_PRODUCTION
