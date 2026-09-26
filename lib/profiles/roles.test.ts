import assert from "node:assert/strict"
import { test } from "node:test"

import type { MembershipRole } from "../db/types.ts"
import { EDITABLE_MEMBERSHIP_ROLES, filterEditable, roleCanEdit } from "./roles.ts"

test("roleCanEdit accepts only owner/administrator/editor", () => {
  assert.equal(roleCanEdit("owner"), true)
  assert.equal(roleCanEdit("administrator"), true)
  assert.equal(roleCanEdit("editor"), true)
})

test("roleCanEdit rejects non-editable active roles", () => {
  assert.equal(roleCanEdit("event_manager"), false)
  assert.equal(roleCanEdit("content_contributor"), false)
  assert.equal(roleCanEdit("analyst"), false)
})

test("roleCanEdit rejects null/undefined (no membership)", () => {
  assert.equal(roleCanEdit(null), false)
  assert.equal(roleCanEdit(undefined), false)
})

test("EDITABLE_MEMBERSHIP_ROLES is exactly the three editing roles", () => {
  assert.deepEqual([...EDITABLE_MEMBERSHIP_ROLES], ["owner", "administrator", "editor"])
})

type Row = { id: string; role: MembershipRole }

test("filterEditable: zero editable memberships yields empty picker", () => {
  const rows: Row[] = [
    { id: "a", role: "analyst" },
    { id: "b", role: "event_manager" },
  ]
  assert.deepEqual(filterEditable(rows), [])
})

test("filterEditable: single editable membership yields one entry", () => {
  const rows: Row[] = [
    { id: "a", role: "owner" },
    { id: "b", role: "analyst" },
  ]
  assert.deepEqual(
    filterEditable(rows).map((r) => r.id),
    ["a"],
  )
})

test("filterEditable: multiple editable memberships preserve input order", () => {
  const rows: Row[] = [
    { id: "a", role: "editor" },
    { id: "b", role: "content_contributor" },
    { id: "c", role: "administrator" },
    { id: "d", role: "owner" },
  ]
  assert.deepEqual(
    filterEditable(rows).map((r) => r.id),
    ["a", "c", "d"],
  )
})
