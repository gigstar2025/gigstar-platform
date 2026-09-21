import { test } from "node:test"
import assert from "node:assert/strict"
import {
  MODULE_KEYS,
  MODULE_REGISTRY,
  isModuleKey,
  moduleAppliesTo,
  modulesForProfileType,
  moduleKeyFromLegacyType,
  moduleKeyFromSectionKey,
} from "./registry.ts"

test("registry covers exactly the five modular keys", () => {
  assert.deepEqual([...MODULE_KEYS].sort(), ["audio", "gallery", "gigs", "radio", "videos"])
  for (const key of MODULE_KEYS) {
    assert.equal(MODULE_REGISTRY[key].key, key, `definition key matches map key for ${key}`)
  }
})

test("isModuleKey guards unknown strings", () => {
  assert.equal(isModuleKey("audio"), true)
  assert.equal(isModuleKey("gigs"), true)
  assert.equal(isModuleKey("mixes"), false)
  assert.equal(isModuleKey("events"), false)
  assert.equal(isModuleKey(""), false)
})

test("legacy ModuleType mapping maps mixes -> audio and is otherwise identity", () => {
  assert.equal(moduleKeyFromLegacyType("mixes"), "audio")
  assert.equal(moduleKeyFromLegacyType("videos"), "videos")
  assert.equal(moduleKeyFromLegacyType("radio"), "radio")
  assert.equal(moduleKeyFromLegacyType("gallery"), "gallery")
  assert.equal(moduleKeyFromLegacyType("gigs"), "gigs")
})

test("showcase SectionKey mapping only resolves the five modular sections", () => {
  assert.equal(moduleKeyFromSectionKey("audio"), "audio")
  assert.equal(moduleKeyFromSectionKey("videos"), "videos")
  assert.equal(moduleKeyFromSectionKey("gallery"), "gallery")
  // radio/gigs are new in the converged vocabulary
  assert.equal(moduleKeyFromSectionKey("radio"), "radio")
  assert.equal(moduleKeyFromSectionKey("gigs"), "gigs")
  // non-module sections do not map
  assert.equal(moduleKeyFromSectionKey("about"), null)
  assert.equal(moduleKeyFromSectionKey("reviews"), null)
})

test("module availability respects applies_to", () => {
  assert.equal(moduleAppliesTo("radio", "dj"), true)
  assert.equal(moduleAppliesTo("radio", "venue"), false)
  assert.equal(moduleAppliesTo("gigs", "organiser"), true)
  assert.equal(moduleAppliesTo("gigs", "venue"), false)
  assert.equal(moduleAppliesTo("gallery", "venue"), true)
})

test("modulesForProfileType returns only-allowed keys in descending position", () => {
  const djModules = modulesForProfileType("dj")
  assert.deepEqual([...djModules].sort(), ["audio", "gallery", "gigs", "radio", "videos"])

  const venueModules = modulesForProfileType("venue")
  assert.deepEqual([...venueModules].sort(), ["gallery", "videos"])

  // descending default_position order
  const positions = djModules.map((k) => MODULE_REGISTRY[k].defaultPosition)
  const sorted = [...positions].sort((a, b) => b - a)
  assert.deepEqual(positions, sorted)
})
