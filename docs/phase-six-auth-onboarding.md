# Phase Six — Branded Auth, Onboarding & Multi-Profile Accounts

Status: planning locked. PR-1 shipped and merged to `main`. PR-2 onward not started.

This document is the durable record of the Phase Six plan and the decisions
locked in with the product owner. It is the source of truth for the remaining
PRs. Nothing here changes environment variables, database schema, migrations,
email templates, or Supabase settings on its own — those changes land in their
designated PRs.

---

## 1. Context: two disconnected worlds

Phase Six's central job is to join a solid Supabase backend to a prototype
front end that does not yet use it.

- **Real backend** (migrations 0001–0010): `auth.users` → `user_accounts`
  trigger, `profiles` / `profile_memberships` / `profile_modules`, the atomic
  `create_profile_with_owner` RPC, full RLS, safe views, and PostGIS search.
- **Prototype front end**: the profile editor operates on static showcase data
  (`lib/profiles/showcase`) plus localStorage drafts, managed by a fictional
  `DEMO_ACCOUNT`. The `create_profile_with_owner` RPC is never called by app
  code today.

The database can already create a private draft profile for a user; nothing in
the app calls that path. Phase Six builds the missing path.

---

## 2. Locked product decisions

1. **Profile cap: 5 active (non-archived) profiles per account at launch.**
   - Enforced inside the authenticated profile-creation RPC.
   - Archived profiles do not appear in the normal switcher and do not count
     toward the active limit.
   - At the limit, the user must archive an active profile before creating
     another.
   - The RPC returns a friendly error; no SQL/internal detail is exposed.
   - The limit is defined in one clearly documented place (a single SQL
     constant/function in migration 0011, mirrored by one app constant) so it
     can be changed later.

2. **Homepage discovery radius defaults to 25 miles.**
   - Miles shown in the UK interface.
   - Converted to kilometres internally for PostGIS where needed
     (25 miles ≈ 40.2 km).
   - Users can adjust the radius.
   - Browser geolocation is never requested automatically.
   - Origin is the selected town/city or the signed-in user's default-profile
     coarse location.

3. **Step order: type → details → editable suggested handle.** Display name and
   required coarse location are captured in *details*; the handle step opens
   pre-filled with a slugified suggestion the user can edit, with a live
   authenticated availability check.

4. **Switching profiles never changes the default silently.** The switcher only
   changes the active editing context; `default_profile_id` changes only via an
   explicit "Set as default" action in the manager.

5. **Archive only at launch; deletion UI deferred.** The manager offers Archive
   (reversible, hidden from the switcher). No delete affordance ships this phase.

6. **Required coarse location at onboarding.** The flow cannot complete without a
   resolved town centroid. Exact address/coordinates are never captured.

7. **Ambiguous or invalid defaults route to `/profiles/manage`.**

8. **Email stays on the default Supabase sender for now.** Branded SMTP +
   SPF/DKIM/DMARC + custom templates are a separate later task; only redirect
   allowlists and a docs stub are in scope this phase.

9. **No rate-limit infrastructure this phase.** Client debounce on availability
   checks plus Supabase's built-in auth email throttling only.

---

## 3. Idempotency model (many profiles per account, exactly-once per attempt)

A retry or double-submit of the *same* creation attempt must never create two
profiles, but a user may deliberately create another profile later (up to the
active cap).

- Entering any creation flow (initial onboarding or "Create another profile")
  mints a server-side **attempt** row keyed by a server-generated
  `idempotency_key`. The key is carried through the resumable onboarding state,
  never trusted from arbitrary client input.
- The creation RPC is keyed on `idempotency_key`, not on `user_id`:
  - new key → create profile, mark attempt completed, record
    `created_profile_id`;
  - existing completed key → return the same `created_profile_id` (no-op);
  - existing pending key → serialized by an advisory lock on the key so
    concurrent double-submits collapse to one insert.
- A new intentional profile simply starts a new attempt with a new key, subject
  to the 5-active-profile cap.

---

## 4. `default_profile_id`

- Stored on `user_accounts.default_profile_id uuid null references profiles(id)
  on delete set null`. Nullable so an account can transiently have zero
  profiles and degrade gracefully on deletion.
- **Valid** only if the referenced profile exists, is not archived, and the user
  still has an active membership. Publication status does not affect validity —
  an unpublished draft is a valid default (lands on the private owner preview).
- Set to the first profile on initial creation; changed later only via
  `set_default_profile(profile_id)` (asserts active membership, rejects
  archived).
- Fallback when invalid: pick the most recently active accessible non-archived
  profile, persist it as the new default; if none exist, treat as "no profiles."

| Event | Behavior |
|---|---|
| Default archived | Invalid → fallback resolution |
| Default unpublished/draft | Still valid → private owner preview |
| Membership revoked | Invalid → fallback; profile drops from switcher |

---

## 5. Default vs. publication — private owner preview

Landing on a default profile routes to that profile as the owner. Published →
public page. `hidden`/`draft` → **private owner preview** of the same route
(owner-only via RLS/membership) with a "Draft — only you can see this"
affordance and publish CTA. A draft is never publicly exposed; anon and
non-member access continues to 404 via the safe views + RLS from Phase Five.

---

## 6. Profile-aware login routing

Resolved server-side by a single `resolvePostLoginDestination(user)` helper used
by the callback and the `/auth/post-login` hub:

- **a. No profiles** → `/onboarding/type`.
- **b. Exactly one profile** → that profile's page (public or private preview);
  set as default if unset.
- **c. Multiple + valid default** → the default profile's page.
- **d. Multiple + invalid default** → fallback resolution; if it yields a
  profile, route there; if genuinely ambiguous, route to `/profiles/manage`.

PR-1 shipped this helper as the single seam, currently returning `/`, with a–d
documented against the PRs that fill them in.

---

## 7. Onboarding journey

Steps: **type → details → handle → creating → land on profile.**

| Step | Field | Req | Notes |
|---|---|---|---|
| type | `profile_type` | yes | enum: dj / artist / venue / organiser |
| details | `display_name` | yes | 2–80 chars, trimmed |
| details | `location_label` + coarse `location_centroid` | yes | town/city; coarse centroid only, never exact |
| details | `tagline` | no | ≤120 chars |
| handle | `slug` | yes | auto-suggested from display name, editable; lowercase `^[a-z0-9]+(?:-[a-z0-9]+)*$`, 3–40 chars; live authenticated availability + debounce; reserved-word blocklist |

Resumable via server-side onboarding state carrying the attempt key. Duplicate
slug on final submit is caught (`23505`) and re-prompted as "That username is
taken" with a suggested alternative — never the raw Postgres error.

Accessibility/mobile: single-column `min-h-svh`, real `<form>` + `<label>`,
`aria-invalid`/`aria-describedby`, `role="alert"`, radiogroup with arrow-key
support, `aria-live="polite"` for availability results.

---

## 8. Profile manager, switcher, "Create another profile"

- `/profiles/manage` — lists the account's profiles (name, type, slug, status
  badge: Published / Draft / Archived), shows the default, offers open, edit,
  set-as-default, archive, and create-another.
- Switcher — header component reading the user's memberships; changes active
  editing context only (never the default), never lists inaccessible profiles.
- `/profiles/new` — same step UI as onboarding, mints a fresh attempt key,
  subject to the 5-active cap; on success routes to the new profile and offers
  "make this my default."

---

## 9. Security & privacy

- Coarse location only; `location_exact` never written and excluded from
  anon/authenticated column grants (Phase Five 0007/0010).
- All creation via `SECURITY DEFINER` RPC stamping ownership from `auth.uid()`;
  all edits membership-gated by RLS. Switcher/manager list only the caller's own
  memberships.
- `profile_creation_attempts` and `onboarding_state` are authenticated-only
  (`user_id = auth.uid()`), no anon grants. Clients cannot insert attempts
  directly — only `start_profile_creation_attempt` mints them.
- All 0011 RPCs are `to authenticated` with execute revoked from `anon`,
  including `slug_available` (onboarding runs post-confirmation, so no anon
  caller needs it).
- Generic user-facing errors; technical detail logged server-side only. No
  service role in the onboarding/switch/manage paths.

---

## 10. PR sequence

| PR | Title | Migration | Manual/config | Status |
|---|---|---|---|---|
| PR-1 | Auth plumbing & profile-aware routing seam | none | none | **Merged to `main`** |
| PR-2 | Migration 0011 — state, attempts, `default_profile_id`, RPCs, 5-profile cap | new 0011 (additive) | none | not started |
| PR-3 | Onboarding UI (initial, resumable, required coarse location) | none | none | not started |
| PR-4 | Profile manager + switcher + "Create another profile" | none | none | not started |
| PR-5 | Editor ↔ database bridge | none | none | not started |
| PR-6 | Database-backed homepage/discovery (25-mile default, miles UI) | none | none | not started |
| PR-7 | Redirect allowlists + email docs stub (default sender retained) | none | manual Supabase dashboard (both projects) | not started |
| PR-8 | Password reset | none | relies on PR-7 allowlists | not started |

Migration 0011 objects (additive; 0001–0010 untouched): `profile_creation_attempts`
(+ `attempt_status` enum), `onboarding_state`, `user_accounts.default_profile_id`;
RPCs `start_profile_creation_attempt`, `create_profile`, `set_default_profile`,
`resolve_default_profile`, `slug_available` — all authenticated-only. The
5-active-profile cap lives in one documented SQL location.

---

## 11. PR-1 — shipped

Merged to `main` (rebase, no squash). Establishes:

- `lib/auth/post-login.ts` — `resolvePostLoginDestination` single seam (returns
  `/` for now; a–d documented for later PRs).
- `app/auth/post-login/route.ts` — server-side redirect hub; verifies the user
  with `getUser()`, redirects unauthenticated visitors to `/auth/login`.
- Callback and login route through the hub instead of the old hardcoded
  `/dev/foundation` (which 404s in Production).
- `app/auth/actions.ts` — app-wide `signOut` and enumeration-safe
  `resendConfirmation` server actions.
- `components/auth/sign-out-button.tsx`, `resend-confirmation-button.tsx` — the
  resend form collects the email at resend time; the signup email is never
  carried in the URL (no history/referrer/log leak).
- `lib/auth/errors.ts` — generic auth copy; technical causes logged server-side
  only.

Verified in Production: auth routes 200, sign-up-success has a required email
field and clean URL, unauthenticated `/auth/post-login` → `/auth/login`, no open
redirect from any auth route, public routes load, `/dev/foundation` 404s,
console clean.

---

## 12. Open items (non-blocking)

- Branded email provider + sending domain for eventual DNS (SPF/DKIM/DMARC).
- Whether the 5-profile cap should later be tier-dependent.
