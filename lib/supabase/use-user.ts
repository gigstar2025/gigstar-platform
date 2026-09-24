'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

import { createClient } from '@/lib/supabase/client'

// Reactive client-side view of the current Supabase session user. Reads the
// session once on mount and then subscribes to auth changes so the UI stays in
// sync across sign-in / sign-out / token refresh — a client subscription is the
// only way to reflect those events on surfaces (like the shared header) that
// mount on both static marketing pages and dynamic authenticated pages.
//
// This is presentation only. Every privileged route and action is guarded
// server-side (session check + RLS), so the value here never gates access.
export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let active = true

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return
      setUser(data.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
}
