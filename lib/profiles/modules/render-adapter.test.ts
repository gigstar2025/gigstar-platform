import { test } from "node:test"
import assert from "node:assert/strict"
import { mapGigStatus, moduleToRenderModule } from "./render-adapter.ts"

test("audio content maps to a mixes module with legacy discriminant", () => {
  const mod = moduleToRenderModule("audio", {
    items: [
      {
        id: "a1",
        title: "Warehouse Set",
        embedUrl: "https://soundcloud.com/x/warehouse",
        description: "Two hours",
        provider: "soundcloud",
      },
    ],
  })
  assert.ok(mod)
  assert.equal(mod.type, "mixes")
  assert.equal(mod.hidden, false)
  assert.equal(mod.items.length, 1)
  assert.equal(mod.items[0].embedUrl, "https://soundcloud.com/x/warehouse")
  assert.equal(mod.items[0].provider, "soundcloud")
})

test("videos content maps to a videos module", () => {
  const mod = moduleToRenderModule(
    "videos",
    { items: [{ id: "v1", title: "Live", embedUrl: "https://youtube.com/watch?v=abc" }] },
    { id: "row-1", hidden: false },
  )
  assert.ok(mod)
  assert.equal(mod.type, "videos")
  assert.equal(mod.id, "row-1")
  assert.equal(mod.items[0].embedUrl, "https://youtube.com/watch?v=abc")
})

test("radio content maps, defaulting optional fields and titling from show", () => {
  const mod = moduleToRenderModule("radio", {
    radio: {
      stationName: "Reform Radio",
      streamUrl: "https://reform.example/live",
      showTitle: "Afterglow",
    },
  })
  assert.ok(mod)
  assert.equal(mod.type, "radio")
  assert.equal(mod.title, "Afterglow")
  assert.equal(mod.radio.onAir, false)
  assert.equal(mod.radio.schedule, "")
  assert.equal(mod.radio.stationName, "Reform Radio")
})

test("gallery content maps photos preserving alt text", () => {
  const mod = moduleToRenderModule("gallery", {
    photos: [{ id: "p1", alt: "Crowd at golden hour", caption: "Parklife" }],
  })
  assert.ok(mod)
  assert.equal(mod.type, "gallery")
  assert.equal(mod.photos[0].alt, "Crowd at golden hour")
  assert.equal(mod.photos[0].caption, "Parklife")
})

test("gigs content maps venueName->venue and collapses status vocabulary", () => {
  const mod = moduleToRenderModule("gigs", {
    gigs: [
      { id: "g1", title: "Night A", date: "2026-10-01", venueName: "Club", town: "Berlin", status: "selling-fast" },
      { id: "g2", title: "Night B", date: "2026-10-02", venueName: "Hall", town: "Leeds", status: "sold-out" },
    ],
  })
  assert.ok(mod)
  assert.equal(mod.type, "gigs")
  assert.equal(mod.gigs[0].venue, "Club")
  assert.equal(mod.gigs[0].status, "on-sale")
  assert.equal(mod.gigs[1].status, "sold-out")
})

test("mapGigStatus only preserves sold-out, else on-sale", () => {
  assert.equal(mapGigStatus("sold-out"), "sold-out")
  assert.equal(mapGigStatus("on-sale"), "on-sale")
  assert.equal(mapGigStatus("free"), "on-sale")
  assert.equal(mapGigStatus("coming-soon"), "on-sale")
  assert.equal(mapGigStatus("last-tickets"), "on-sale")
})

test("invalid content yields null instead of throwing", () => {
  assert.equal(moduleToRenderModule("audio", { items: [{ id: "x", title: "" }] }), null)
  assert.equal(moduleToRenderModule("radio", { radio: { stationName: "X" } }), null)
  assert.equal(moduleToRenderModule("gigs", { gigs: [{ id: "g", title: "T", date: "not-a-date", venueName: "V", town: "T", status: "on-sale" }] }), null)
  assert.equal(moduleToRenderModule("audio", "nonsense"), null)
})

test("empty collections are valid and map to empty render modules", () => {
  const audio = moduleToRenderModule("audio", { items: [] })
  assert.ok(audio)
  assert.equal(audio.type === "mixes" && audio.items.length, 0)

  const gigs = moduleToRenderModule("gigs", { gigs: [] })
  assert.ok(gigs)
  assert.equal(gigs.type === "gigs" && gigs.gigs.length, 0)
})
