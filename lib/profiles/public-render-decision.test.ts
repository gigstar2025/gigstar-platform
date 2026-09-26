import assert from "node:assert/strict"
import { test } from "node:test"

import { decidePublicRender, isDemoFallbackAllowed } from "./public-render-decision.ts"

test("real modular profile always renders as modular", () => {
  assert.equal(
    decidePublicRender({
      modularFlow: true,
      modularFound: true,
      isShowcaseSlug: true,
      demoFallbackAllowed: true,
    }),
    "modular",
  )
})

test("production modular miss on a demo slug 404s instead of showing samples", () => {
  assert.equal(
    decidePublicRender({
      modularFlow: true,
      modularFound: false,
      isShowcaseSlug: true,
      demoFallbackAllowed: false,
    }),
    "not-found",
  )
})

test("non-production modular miss on a demo slug renders a labeled demo", () => {
  assert.equal(
    decidePublicRender({
      modularFlow: true,
      modularFound: false,
      isShowcaseSlug: true,
      demoFallbackAllowed: true,
    }),
    "demo",
  )
})

test("modular miss on a non-demo slug 404s regardless of demo mode", () => {
  assert.equal(
    decidePublicRender({
      modularFlow: true,
      modularFound: false,
      isShowcaseSlug: false,
      demoFallbackAllowed: true,
    }),
    "not-found",
  )
})

test("legacy marketing site (flow off) still renders showcase slugs", () => {
  assert.equal(
    decidePublicRender({
      modularFlow: false,
      modularFound: false,
      isShowcaseSlug: true,
      demoFallbackAllowed: false,
    }),
    "showcase",
  )
})

test("flow off with an unknown slug 404s", () => {
  assert.equal(
    decidePublicRender({
      modularFlow: false,
      modularFound: false,
      isShowcaseSlug: false,
      demoFallbackAllowed: false,
    }),
    "not-found",
  )
})

test("demo fallback disabled in production by default", () => {
  assert.equal(isDemoFallbackAllowed({ vercelEnv: "production" }), false)
})

test("demo fallback enabled outside production by default", () => {
  assert.equal(isDemoFallbackAllowed({ vercelEnv: "preview" }), true)
  assert.equal(isDemoFallbackAllowed({ vercelEnv: "development" }), true)
  assert.equal(isDemoFallbackAllowed({}), true)
})

test("demo fallback can be explicitly opted into in production", () => {
  assert.equal(isDemoFallbackAllowed({ vercelEnv: "production", demoFallbackFlag: "1" }), true)
  assert.equal(isDemoFallbackAllowed({ vercelEnv: "production", demoFallbackFlag: "true" }), true)
})
