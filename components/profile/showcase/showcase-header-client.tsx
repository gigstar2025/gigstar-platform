'use client'

import { useEffect, useState } from 'react'
import { Info } from 'lucide-react'
import type { ShowcaseProfile } from '@/lib/profiles/showcase/types'
import { loadDraft } from '@/lib/profiles/editor/draft'
import { ShowcaseHeader } from './showcase-header'

/**
 * Public showcase header with a browser-local demo overlay.
 *
 * The static showcase profile is rendered on the server. On the client we look
 * for a locally-saved editor draft for THIS profile (localStorage on this
 * device only) and, if the person has uploaded a demo avatar/logo or cover in
 * the editor, we render those images instead. This is prototype behavior for
 * testing the upload → save → render loop — nothing is published to a server.
 */
export function ShowcaseHeaderClient({ profile }: { profile: ShowcaseProfile }) {
  const [merged, setMerged] = useState<ShowcaseProfile>(profile)
  const [usingLocalImages, setUsingLocalImages] = useState(false)

  useEffect(() => {
    const draft = loadDraft(profile)
    if (!draft?.base) return

    const localAvatar = draft.base.avatar
    const localCover = draft.base.cover
    const avatarChanged = Boolean(localAvatar) && localAvatar !== profile.avatar
    const coverChanged = Boolean(localCover) && localCover !== profile.cover

    if (avatarChanged || coverChanged) {
      setMerged({
        ...profile,
        avatar: localAvatar || profile.avatar,
        cover: localCover || profile.cover,
      })
      setUsingLocalImages(true)
    }
  }, [profile])

  return (
    <>
      {usingLocalImages ? (
        <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs font-medium text-amber-700 dark:text-amber-300">
          <span className="inline-flex items-center gap-1.5">
            <Info className="size-3.5 shrink-0" />
            Showing a browser-local demo image saved in the editor on this device. It isn&apos;t published or visible to
            anyone else.
          </span>
        </div>
      ) : null}
      <ShowcaseHeader profile={merged} />
    </>
  )
}
