import type { ProfileModule } from '@/lib/profiles/types'
import { MixesModule } from '@/components/profile/modules/mixes-module'
import { VideosModule } from '@/components/profile/modules/videos-module'
import { RadioModule } from '@/components/profile/modules/radio-module'
import { GalleryModule } from '@/components/profile/modules/gallery-module'
import { GigsModule } from '@/components/profile/modules/gigs-module'

/** Renders a single profile module by type. Shared by the public page and editor preview. */
export function ModuleView({ module }: { module: ProfileModule }) {
  switch (module.type) {
    case 'mixes':
      return <MixesModule module={module} />
    case 'videos':
      return <VideosModule module={module} />
    case 'radio':
      return <RadioModule module={module} />
    case 'gallery':
      return <GalleryModule module={module} />
    case 'gigs':
      return <GigsModule module={module} />
  }
}
