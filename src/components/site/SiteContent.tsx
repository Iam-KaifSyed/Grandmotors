import { Reveal, SectionHeading } from './Shared';
import {
  EyeIcon,
  SearchIcon,
  WrenchIcon,
  CheckIcon,
  TruckIcon,
  ArrowRightIcon,
  PhoneIcon,
  WhatsAppIcon,
  PinIcon,
} from './Icons';

/* ------------------------------------------------------------------ */
/* Business constants                                                  */
/* ------------------------------------------------------------------ */
const PHONE_TEL = '+918623948898';
const WHATSAPP_URL = 'https://wa.me/918623948898';
const MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  'Grand Motors, Metro Pillar No. 842, 5-7-73/NR, beside JSP Honda Showroom, Habeeb Nagar, Moosapet, Hyderabad, Telangana 500072'
)}`;

const PROCESS_STEPS = [
  {
    n: '01',
    icon: EyeIcon,
    title: 'Inspect',
    body: 'A thorough multi-point check to understand the full condition of your vehicle before any work begins.',
  },
  {
    n: '02',
    icon: SearchIcon,
    title: 'Diagnose',
    body: 'Computerised scanning and expert assessment isolate the root cause, not just the symptom.',
  },
  {
    n: '03',
    icon: WrenchIcon,
    title: 'Repair',
    body: 'Skilled technicians carry out the work to specification using genuine-quality parts.',
  },
  {
    n: '04',
    icon: CheckIcon,
    title: 'Test',
    body: 'Every repair is verified and road-tested so the fix is confirmed before it reaches you.',
  },
  {
    n: '05',
    icon: TruckIcon,
    title: 'Deliver',
    body: 'Your car is returned clean, documented and ready, with a clear summary of the work done.',
  },
];

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */
export function SiteContent() {
  return (
    <div
      id="site-content"
      className="relative z-40 bg-[var(--gm-bg-page)] text-[var(--gm-text-primary)] transition-colors duration-200"
    >
      {/* Seamless Transition Seam */}
      <div className="relative pt-6 pb-2 sm:pt-8 sm:pb-3 flex flex-col items-center gap-2 sm:gap-2.5 text-center">
        <Reveal className="flex flex-col items-center gap-2 sm:gap-2.5">
          <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.35em] text-[var(--gm-accent-primary)] uppercase">
            The Workshop
          </span>
          <span className="text-xs sm:text-[13px] tracking-[0.15em] text-[var(--gm-text-secondary)] uppercase">
            Where precision continues
          </span>
          <span className="w-px h-6 bg-gradient-to-b from-[var(--gm-accent-primary)]/60 to-transparent" />
        </Reveal>
      </div>

      {/* ============================================================ */}
      {/* 1. OUR PROCESS                                               */}
      {/* ============================================================ */}
      <section className="relative px-4 sm:px-8 md:px-12 lg:px-16 py-8 sm:py-10 md:py-12 bg-[var(--gm-bg-surface)] border-t border-[var(--gm-border-subtle)] transition-colors duration-200">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            eyebrow="Our Process"
            title={<>Five Steps, Zero Guesswork</>}
            intro="A disciplined workflow that keeps your car — and you — informed from drop-off to delivery."
          />

          <div className="mt-6 sm:mt-8 relative">
            {/* Connecting line (desktop) */}
            <div
              aria-hidden="true"
              className="hidden lg:block absolute top-5 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--gm-accent-primary)]/30 to-transparent"
            />
            <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {PROCESS_STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <Reveal key={step.n} delay={i * 70} as="li" className="relative">
                    <div className="flex items-center gap-3 lg:flex-col lg:items-start">
                      <span className="relative z-10 grid place-items-center w-10 h-10 rounded-full border border-[var(--gm-accent-border)] bg-[var(--gm-bg-card)] text-[var(--gm-accent-primary)] shadow-sm">
                        <Icon className="w-4.5 h-4.5" />
                      </span>
                      <span className="font-mono text-[10px] sm:text-[11px] tracking-[0.3em] text-[var(--gm-text-secondary)]">
                        {step.n}
                      </span>
                    </div>
                    <h3 className="mt-3 text-base sm:text-lg font-semibold tracking-[-0.01em] text-[var(--gm-text-primary)]">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-xs sm:text-[13px] leading-relaxed text-[var(--gm-text-secondary)]">{step.body}</p>
                  </Reveal>
                );
              })}
            </ol>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. CTA SECTION (BOOKING CTA)                                  */}
      {/* ============================================================ */}
      <section className="relative px-4 sm:px-8 md:px-12 lg:px-16 py-10 sm:py-12 md:py-14 bg-[var(--gm-bg-page)] border-t border-[var(--gm-border-subtle)] overflow-hidden transition-colors duration-200">
        <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-[50rem] max-w-full h-56 rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(var(--gm-accent-rgb), 0.12) 0%, rgba(var(--gm-accent-rgb), 0.04) 45%, transparent 70%)',
              transform: 'translateZ(0)',
            }}
          />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <Reveal
            as="h2"
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.035em] text-[var(--gm-text-primary)] leading-[1.02] uppercase"
          >
            Your Car Deserves
            <br />
            <span className="text-[var(--gm-accent-primary)]">Precision.</span>
          </Reveal>
          <Reveal as="p" delay={100} className="mt-4 text-xs sm:text-sm md:text-base text-[var(--gm-text-secondary)] max-w-lg mx-auto">
            Book your service, ask a question or drop by the workshop. We will take it from here.
          </Reveal>

          <Reveal delay={180} className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            <a
              href="/book-service"
              className="group inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 rounded-full bg-[var(--gm-accent-primary)] text-[var(--gm-accent-foreground)] text-xs sm:text-sm font-semibold tracking-[0.04em] uppercase transition-colors duration-200 hover:bg-[var(--gm-accent-hover)] cursor-pointer shadow-lg shadow-[var(--gm-accent-primary)]/20"
            >
              Book Service
              <ArrowRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href={`tel:${PHONE_TEL}`}
              className="group inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-full border border-[var(--gm-border-medium)] text-[var(--gm-text-primary)] text-xs sm:text-sm font-semibold tracking-[0.04em] uppercase transition-colors duration-200 hover:border-[var(--gm-accent-border)] hover:bg-[var(--gm-accent-muted)] cursor-pointer shadow-sm"
            >
              <PhoneIcon className="w-4 h-4 text-[var(--gm-accent-primary)]" />
              Call Now
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-full border border-[var(--gm-border-medium)] text-[var(--gm-text-primary)] text-xs sm:text-sm font-semibold tracking-[0.04em] uppercase transition-colors duration-200 hover:border-[var(--gm-accent-border)] hover:bg-[var(--gm-accent-muted)] cursor-pointer shadow-sm"
            >
              <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
              WhatsApp
            </a>
            <a
              href={MAPS_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-full border border-[var(--gm-border-medium)] text-[var(--gm-text-primary)] text-xs sm:text-sm font-semibold tracking-[0.04em] uppercase transition-colors duration-200 hover:border-[var(--gm-accent-border)] hover:bg-[var(--gm-accent-muted)] cursor-pointer shadow-sm"
            >
              <PinIcon className="w-4 h-4 text-[var(--gm-accent-primary)]" />
              Directions
            </a>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
