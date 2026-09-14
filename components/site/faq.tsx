import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const FAQS = [
  {
    q: 'How much does GigStar cost?',
    a: 'GigStar is free for artists to create a profile and receive offers. Venues pay a simple per-booking fee, with volume plans available for multi-room operators.',
  },
  {
    q: 'How do payments work?',
    a: 'Deposits and final payments are processed securely through the platform. Artists get paid on time, and both sides keep a clear record of every transaction.',
  },
  {
    q: 'Can I manage multiple venues or band members?',
    a: 'Yes. GigStar supports teams, so you can invite collaborators, share calendars, and manage several rooms or projects from a single account.',
  },
  {
    q: 'What kind of events can I book?',
    a: 'From intimate acoustic sets to festival slots and private events, GigStar handles the booking, scheduling, and coordination for any type of live performance.',
  },
]

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Frequently asked questions
        </h2>
        <p className="mt-4 text-pretty text-muted-foreground">
          Everything you need to know before your first booking.
        </p>
      </div>

      <Accordion className="mt-12 w-full">
        {FAQS.map((faq, index) => (
          <AccordionItem key={faq.q} value={index}>
            <AccordionTrigger className="text-left font-display text-base font-semibold">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
