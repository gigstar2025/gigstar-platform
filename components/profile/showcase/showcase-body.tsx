import type { ComponentType } from "react"
import type { SectionKey, ShowcaseProfile } from "@/lib/profiles/showcase/types"
import {
  AboutSection,
  AudioSection,
  ContactSection,
  EventsSection,
  FactsSection,
  FeaturedEventSection,
  GallerySection,
  MailingListSection,
  MenuSection,
  PartnersSection,
  PastEventsSection,
  RelatedSection,
  ReleasesSection,
  ReviewsSection,
  SpacesSection,
  TechnicalSection,
  VideosSection,
} from "./sections"

const SECTION_COMPONENTS: Record<
  SectionKey,
  ComponentType<{ profile: ShowcaseProfile }>
> = {
  about: AboutSection,
  facts: FactsSection,
  "featured-event": FeaturedEventSection,
  events: EventsSection,
  "past-events": PastEventsSection,
  releases: ReleasesSection,
  audio: AudioSection,
  videos: VideosSection,
  gallery: GallerySection,
  spaces: SpacesSection,
  menu: MenuSection,
  technical: TechnicalSection,
  reviews: ReviewsSection,
  partners: PartnersSection,
  "mailing-list": MailingListSection,
  contact: ContactSection,
  related: RelatedSection,
}

export function ShowcaseBody({ profile }: { profile: ShowcaseProfile }) {
  return (
    <div className="mx-auto max-w-5xl space-y-14 px-4 py-12 sm:px-6 md:space-y-20">
      {profile.sections.map((key) => {
        const Section = SECTION_COMPONENTS[key]
        return <Section key={key} profile={profile} />
      })}
    </div>
  )
}
