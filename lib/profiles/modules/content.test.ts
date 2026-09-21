import { test } from "node:test"
import assert from "node:assert/strict"
import { validateModuleContent } from "./content.ts"

test("audio: valid content passes and is normalised", () => {
  const result = validateModuleContent("audio", {
    items: [
      {
        id: "mix_1",
        title: "Warehouse closing set",
        embedUrl: "https://soundcloud.com/lunavega/warehouse",
        provider: "soundcloud",
      },
    ],
  })
  assert.equal(result.ok, true)
  if (result.ok) assert.equal(result.value.items[0].title, "Warehouse closing set")
})

test("audio: missing embedUrl and bad provider fail", () => {
  const result = validateModuleContent("audio", {
    items: [{ id: "x", title: "No link", provider: "spotify" }],
  })
  assert.equal(result.ok, false)
  if (!result.ok) {
    const paths = result.errors.map((e) => e.path)
    assert.ok(paths.includes("content.items[0].embedUrl"))
    assert.ok(paths.includes("content.items[0].provider"))
  }
})

test("audio: non-http embedUrl is rejected", () => {
  const result = validateModuleContent("audio", {
    items: [{ id: "x", title: "t", embedUrl: "javascript:alert(1)" }],
  })
  assert.equal(result.ok, false)
})

test("radio: requires stationName and a valid streamUrl", () => {
  const ok = validateModuleContent("radio", {
    radio: { stationName: "Reform Radio", streamUrl: "https://reform.example/live", onAir: true },
  })
  assert.equal(ok.ok, true)

  const bad = validateModuleContent("radio", {
    radio: { stationName: "", streamUrl: "not-a-url" },
  })
  assert.equal(bad.ok, false)
})

test("gallery: requires id + alt, allows optional src URL (uploads are PR-5c)", () => {
  const ok = validateModuleContent("gallery", {
    photos: [{ id: "p1", alt: "A crowd at golden hour" }],
  })
  assert.equal(ok.ok, true)

  const bad = validateModuleContent("gallery", {
    photos: [{ id: "p1", src: "ftp://nope" }],
  })
  assert.equal(bad.ok, false)
  if (!bad.ok) {
    const paths = bad.errors.map((e) => e.path)
    assert.ok(paths.includes("content.photos[0].alt"))
    assert.ok(paths.includes("content.photos[0].src"))
  }
})

test("gigs: enforces required fields, ISO date and status enum", () => {
  const ok = validateModuleContent("gigs", {
    gigs: [
      {
        id: "g1",
        title: "Afterglow",
        date: "2026-02-14",
        venueName: "Hidden Basement",
        town: "Manchester",
        status: "on-sale",
      },
    ],
  })
  assert.equal(ok.ok, true)

  const bad = validateModuleContent("gigs", {
    gigs: [
      {
        id: "g1",
        title: "Afterglow",
        date: "14/02/2026",
        venueName: "Hidden Basement",
        town: "Manchester",
        status: "cancelled",
      },
    ],
  })
  assert.equal(bad.ok, false)
  if (!bad.ok) {
    const paths = bad.errors.map((e) => e.path)
    assert.ok(paths.includes("content.gigs[0].date"))
    assert.ok(paths.includes("content.gigs[0].status"))
  }
})

test("videos: valid youtube embed passes", () => {
  const result = validateModuleContent("videos", {
    items: [
      { id: "v1", title: "Live at Parklife", embedUrl: "https://youtube.com/watch?v=abc", provider: "youtube" },
    ],
  })
  assert.equal(result.ok, true)
})

test("top-level content must be an object", () => {
  assert.equal(validateModuleContent("audio", null).ok, false)
  assert.equal(validateModuleContent("gigs", []).ok, false)
})
