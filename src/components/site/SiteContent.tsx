import { createElement, useState } from 'react';
import { useReveal } from './useReveal';
import { SERVICES } from './servicesData';
import {
  ShieldCheckIcon,
  UsersIcon,
  GaugeIcon,
  BadgeIcon,
  EyeIcon,
  SearchIcon,
  WrenchIcon,
  CheckIcon,
  TruckIcon,
  PhoneIcon,
  WhatsAppIcon,
  PinIcon,
  MailIcon,
  ClockIcon,
  ArrowRightIcon,
  ChevronDownIcon,
} from './Icons';

/* ------------------------------------------------------------------ */
/* Business constants                                                  */
/* ------------------------------------------------------------------ */
const PHONE_DISPLAY = '+91 90000 00000';
const PHONE_TEL = '+919000000000';
const WHATSAPP_URL = 'https://wa.me/919000000000';
const MAPS_QUERY = 'Grand+Motors+Moosapet+Hyderabad';
const MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY}`;
const MAPS_EMBED = `https://maps.google.com/maps?q=${MAPS_QUERY}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
const ADDRESS_LINE_1 = 'Habeeb Nagar, Moosapet';
const ADDRESS_LINE_2 = 'Hyderabad, Telangana 500018';
const EMAIL = 'service@grandmotors.in';

/* ------------------------------------------------------------------ */
/* Small presentational helpers                                        */
/* ------------------------------------------------------------------ */
function Reveal({
  children,
  delay = 0,
  className = '',
  as = 'div',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}) {
  const { ref, revealed } = useReveal<HTMLElement>();
  return createElement(
    as,
    {
      ref,
      className: `gm-reveal ${revealed ? 'is-visible' : ''} ${className}`,
      style: { transitionDelay: `${delay}ms` },
    },
    children
  );
}

function SectionHeading({
  eyebrow,
  title,
  intro,
  align = 'left',
}: {
  eyebrow: string;
  title: React.ReactNode;
  intro?: string;
  align?: 'left' | 'center';
}) {
  const isCenter = align === 'center';
  return (
    <div className={`max-w-2xl ${isCenter ? 'mx-auto text-center' : ''}`}>
      <Reveal className={`flex items-center gap-2.5 mb-5 ${isCenter ? 'justify-center' : ''}`}>
        <span className="w-6 h-px bg-[#B88952]" />
        <span className="text-[11px] font-semibold tracking-[0.3em] text-[#B88952] uppercase">
          {eyebrow}
        </span>
      </Reveal>
      <Reveal
        as="h2"
        delay={80}
        className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.03em] text-[#F2F0EA] leading-[1.03] uppercase"
      >
        {title}
      </Reveal>
      {intro && (
        <Reveal
          as="p"
          delay={160}
          className="mt-5 text-sm md:text-[15px] leading-relaxed text-[#A7AAAD]"
        >
          {intro}
        </Reveal>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section data                                                        */
/* ------------------------------------------------------------------ */
const WHY_POINTS = [
  {
    icon: GaugeIcon,
    title: 'Precision Service',
    body: 'Every job is measured, torqued and tested to spec. We work to the numbers, not to guesswork.',
  },
  {
    icon: UsersIcon,
    title: 'Experienced Technicians',
    body: 'A team trained across European and performance marques, with the hands-on depth that complex repairs demand.',
  },
  {
    icon: SearchIcon,
    title: 'Advanced Diagnostics',
    body: 'Computerised fault scanning pinpoints the real issue first, so you only pay for the work that matters.',
  },
  {
    icon: BadgeIcon,
    title: 'Genuine-Quality Parts',
    body: 'OEM and OEM-grade components only. The right part, fitted right, backed by our workmanship.',
  },
  {
    icon: EyeIcon,
    title: 'Transparent Service',
    body: 'Clear estimates, honest timelines and no surprise line items. You approve before we proceed.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Workmanship You Trust',
    body: 'Quality-checked at every handover and standing behind every repair that leaves the bay.',
  },
];

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
/* Detailed Services accordion                                         */
/* ------------------------------------------------------------------ */
function ServiceAccordionItem({
  service,
  isOpen,
  onToggle,
}: {
  service: (typeof SERVICES)[number];
  isOpen: boolean;
  onToggle: () => void;
}) {
  const Icon = service.icon;
  const panelId = `panel-${service.id}`;
  const btnId = `trigger-${service.id}`;
  return (
    <div
      className={`rounded-xl border transition-colors duration-200 overflow-hidden ${
        isOpen
          ? 'border-[#B88952]/40 bg-[#181B1E]'
          : 'border-white/8 bg-[#111315] hover:border-[#B88952]/25'
      }`}
    >
      <h3>
        <button
          id={btnId}
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className="w-full flex items-center gap-4 px-5 md:px-6 py-5 text-left cursor-pointer group"
        >
          <span
            className={`shrink-0 grid place-items-center w-11 h-11 rounded-lg border transition-colors duration-200 ${
              isOpen
                ? 'border-[#B88952]/50 text-[#B88952] bg-[#B88952]/10'
                : 'border-white/10 text-[#A7AAAD] group-hover:text-[#B88952] group-hover:border-[#B88952]/30'
            }`}
          >
            <Icon className="w-5 h-5" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-base md:text-lg font-semibold tracking-[-0.01em] text-[#F2F0EA]">
              {service.title}
            </span>
            <span className="block mt-0.5 text-[13px] text-[#A7AAAD] leading-snug">
              {service.summary}
            </span>
          </span>
          <ChevronDownIcon
            className={`shrink-0 w-5 h-5 text-[#A7AAAD] transition-transform duration-300 ${
              isOpen ? 'rotate-180 text-[#B88952]' : ''
            }`}
          />
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={btnId}
        className="grid transition-all duration-300 ease-out"
        style={{
          gridTemplateRows: isOpen ? '1fr' : '0fr',
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className="overflow-hidden">
          <ul className="px-5 md:px-6 pb-6 pt-1 grid sm:grid-cols-2 gap-x-8 gap-y-2.5">
            {service.items.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[13.5px] text-[#D8D6D0]/90">
                <CheckIcon className="w-4 h-4 mt-0.5 shrink-0 text-[#B88952]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */
export function SiteContent() {
  const [openId, setOpenId] = useState<string | null>(SERVICES[0].id);

  return (
    <div id="site-content" className="relative z-10 bg-[#07090A] text-[#F2F0EA]">
      {/* Transition seam: a compact handoff from the hero into the page.
          Kept short so the website begins immediately when the car animation
          releases — no dead scroll space. The opaque page background means the
          hero (which has already faded out) never bleeds through. */}
      <div className="relative pt-10 pb-6 flex flex-col items-center gap-3 text-center">
        <Reveal className="flex flex-col items-center gap-3">
          <span className="text-[11px] font-semibold tracking-[0.35em] text-[#B88952] uppercase">
            The Workshop
          </span>
          <span className="text-[13px] tracking-[0.15em] text-[#A7AAAD]/80 uppercase">
            Where precision continues
          </span>
          <span className="mt-1 w-px h-8 bg-gradient-to-b from-[#B88952]/60 to-transparent" />
        </Reveal>
      </div>

      {/* ============================================================ */}
      {/* 1. SERVICES OVERVIEW                                         */}
      {/* ============================================================ */}
      <section id="services" className="relative px-6 md:px-12 lg:px-16 py-20 md:py-28 scroll-mt-24">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            eyebrow="What We Do"
            title={<>Services, Engineered<br className="hidden sm:block" /> Around Your Car</>}
            intro="A complete workshop under one roof. From diagnostics to detailing, every service is delivered with the same precision you expect from a premium garage."
          />

          <div className="mt-14 grid gap-px rounded-2xl overflow-hidden border border-white/8 bg-white/8 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((service, i) => {
              const Icon = service.icon;
              return (
                <Reveal
                  key={service.id}
                  delay={(i % 4) * 70}
                  className="group relative bg-[#111315] p-7 md:p-8 transition-colors duration-200 hover:bg-[#181B1E] cursor-pointer"
                >
                  <a
                    href="#detailed-services"
                    className="absolute inset-0"
                    aria-label={`${service.title} — view detailed services`}
                  />
                  <span className="grid place-items-center w-12 h-12 rounded-lg border border-white/10 text-[#B88952] transition-colors duration-200 group-hover:border-[#B88952]/40 group-hover:bg-[#B88952]/10">
                    <Icon className="w-6 h-6" />
                  </span>
                  <h3 className="mt-6 text-lg font-semibold tracking-[-0.01em] text-[#F2F0EA]">
                    {service.title}
                  </h3>
                  <p className="mt-2.5 text-[13.5px] leading-relaxed text-[#A7AAAD]">
                    {service.summary}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.18em] uppercase text-[#A7AAAD] transition-colors duration-200 group-hover:text-[#B88952]">
                    Explore
                    <ArrowRightIcon className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </span>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. WHY GRAND MOTORS                                          */}
      {/* ============================================================ */}
      <section className="relative px-6 md:px-12 lg:px-16 py-20 md:py-28 bg-[#0A0C0D] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            eyebrow="Why Grand Motors"
            title={<>Built On Precision,<br className="hidden sm:block" /> Backed By Trust</>}
            intro="A premium workshop is defined by its standards. These are ours — the reasons drivers in Hyderabad bring their cars to us and keep coming back."
          />

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {WHY_POINTS.map((point, i) => {
              const Icon = point.icon;
              return (
                <Reveal
                  key={point.title}
                  delay={(i % 3) * 70}
                  className="group relative rounded-xl border border-white/8 bg-[#111315] p-7 transition-colors duration-200 hover:border-[#B88952]/30"
                >
                  <span className="grid place-items-center w-11 h-11 rounded-lg border border-[#B88952]/30 bg-[#B88952]/10 text-[#B88952]">
                    <Icon className="w-5 h-5" />
                  </span>
                  <h3 className="mt-5 text-base font-semibold text-[#F2F0EA]">{point.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-[#A7AAAD]">{point.body}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. DETAILED SERVICES (ACCORDION)                             */}
      {/* ============================================================ */}
      <section
        id="detailed-services"
        className="relative px-6 md:px-12 lg:px-16 py-20 md:py-28 scroll-mt-24"
      >
        <div className="max-w-4xl mx-auto">
          <SectionHeading
            eyebrow="The Full List"
            title={<>Detailed Services</>}
            intro="Expand a category to see everything we handle. If it keeps your car running right, it is almost certainly on this list."
          />

          <div className="mt-12 flex flex-col gap-3">
            {SERVICES.map((service) => (
              <Reveal key={service.id}>
                <ServiceAccordionItem
                  service={service}
                  isOpen={openId === service.id}
                  onToggle={() => setOpenId(openId === service.id ? null : service.id)}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. OUR PROCESS                                               */}
      {/* ============================================================ */}
      <section className="relative px-6 md:px-12 lg:px-16 py-20 md:py-28 bg-[#0A0C0D] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            eyebrow="Our Process"
            title={<>Five Steps, Zero Guesswork</>}
            intro="A disciplined workflow that keeps your car — and you — informed from drop-off to delivery."
          />

          <div className="mt-16 relative">
            {/* Connecting line (desktop) */}
            <div
              aria-hidden="true"
              className="hidden lg:block absolute top-6 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#B88952]/30 to-transparent"
            />
            <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
              {PROCESS_STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <Reveal key={step.n} delay={i * 90} as="li" className="relative">
                    <div className="flex items-center gap-3 lg:flex-col lg:items-start">
                      <span className="relative z-10 grid place-items-center w-12 h-12 rounded-full border border-[#B88952]/40 bg-[#0A0C0D] text-[#B88952]">
                        <Icon className="w-5 h-5" />
                      </span>
                      <span className="font-mono text-[11px] tracking-[0.3em] text-[#A7AAAD]/70">
                        {step.n}
                      </span>
                    </div>
                    <h3 className="mt-5 text-lg font-semibold tracking-[-0.01em] text-[#F2F0EA]">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-[13.5px] leading-relaxed text-[#A7AAAD]">{step.body}</p>
                  </Reveal>
                );
              })}
            </ol>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. ABOUT GRAND MOTORS                                        */}
      {/* ============================================================ */}
      <section id="about" className="relative px-6 md:px-12 lg:px-16 py-20 md:py-28 scroll-mt-24">
        <div className="max-w-7xl mx-auto grid gap-14 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading
              eyebrow="About Us"
              title={<>A Premium Workshop<br className="hidden sm:block" /> In The Heart Of Hyderabad</>}
            />
            <Reveal as="p" delay={120} className="mt-6 text-sm md:text-[15px] leading-relaxed text-[#A7AAAD]">
              Grand Motors is a premium automotive workshop in Moosapet, Hyderabad, built for drivers
              who refuse to compromise on how their car is cared for. We pair modern diagnostic
              equipment with genuinely experienced technicians to deliver service that is precise,
              transparent and dependable.
            </Reveal>
            <Reveal as="p" delay={200} className="mt-4 text-sm md:text-[15px] leading-relaxed text-[#A7AAAD]">
              From routine maintenance to complex repairs and full detailing, every vehicle is treated
              with the same standard of craftsmanship. No shortcuts, no surprises — just the quality
              your car deserves.
            </Reveal>

            <Reveal delay={280} className="mt-10 grid grid-cols-3 gap-6 max-w-md">
              {[
                { k: '8+', v: 'Service Categories' },
                { k: '100%', v: 'Quality-Checked' },
                { k: 'Genuine', v: 'Grade Parts' },
              ].map((stat) => (
                <div key={stat.v}>
                  <div className="text-2xl md:text-3xl font-extrabold tracking-[-0.02em] text-[#B88952]">
                    {stat.k}
                  </div>
                  <div className="mt-1 text-[11px] tracking-[0.14em] uppercase text-[#A7AAAD]/80 leading-snug">
                    {stat.v}
                  </div>
                </div>
              ))}
            </Reveal>
          </div>

          <Reveal delay={120} className="relative">
            <div className="relative rounded-2xl border border-white/8 bg-gradient-to-br from-[#181B1E] to-[#0E1012] p-8 md:p-10 overflow-hidden">
              <div
                aria-hidden="true"
                className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-[#B88952]/10 blur-3xl"
              />
              <div className="relative">
                <GaugeIcon className="w-9 h-9 text-[#B88952]" />
                <blockquote className="mt-6 text-xl md:text-2xl font-semibold leading-snug tracking-[-0.015em] text-[#F2F0EA]">
                  “We treat every car as if the next drive depends on it — because it does.”
                </blockquote>
                <div className="mt-6 flex items-center gap-3">
                  <span className="w-8 h-px bg-[#B88952]" />
                  <span className="text-[12px] tracking-[0.18em] uppercase text-[#A7AAAD]">
                    The Grand Motors Standard
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. CTA SECTION                                               */}
      {/* ============================================================ */}
      <section className="relative px-6 md:px-12 lg:px-16 py-20 md:py-28 bg-[#0A0C0D] border-y border-white/5 overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-[60rem] max-w-full h-72 rounded-full bg-[#B88952]/8 blur-[120px]" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <Reveal
            as="h2"
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-[-0.035em] text-[#F2F0EA] leading-[0.98] uppercase"
          >
            Your Car Deserves
            <br />
            <span className="text-[#B88952]">Precision.</span>
          </Reveal>
          <Reveal as="p" delay={120} className="mt-6 text-sm md:text-base text-[#A7AAAD] max-w-xl mx-auto">
            Book your service, ask a question or drop by the workshop. We will take it from here.
          </Reveal>

          <Reveal delay={200} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <a
              href={`tel:${PHONE_TEL}`}
              className="group inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#B88952] text-[#0A0C0D] font-semibold tracking-[0.02em] transition-colors duration-200 hover:bg-[#caa066] cursor-pointer"
            >
              <PhoneIcon className="w-[18px] h-[18px]" />
              Call Now
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-7 py-3.5 rounded-full border border-white/15 text-[#F2F0EA] font-semibold tracking-[0.02em] transition-colors duration-200 hover:border-[#B88952]/50 hover:bg-[#B88952]/10 cursor-pointer"
            >
              <WhatsAppIcon className="w-[18px] h-[18px] text-[#25D366]" />
              WhatsApp
            </a>
            <a
              href={MAPS_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-7 py-3.5 rounded-full border border-white/15 text-[#F2F0EA] font-semibold tracking-[0.02em] transition-colors duration-200 hover:border-[#B88952]/50 hover:bg-[#B88952]/10 cursor-pointer"
            >
              <PinIcon className="w-[18px] h-[18px] text-[#B88952]" />
              Get Directions
            </a>
          </Reveal>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. LOCATION & CONTACT                                        */}
      {/* ============================================================ */}
      <section id="contact" className="relative px-6 md:px-12 lg:px-16 py-20 md:py-28 scroll-mt-24">
        <div className="max-w-7xl mx-auto grid gap-10 lg:grid-cols-2 lg:items-stretch">
          <div className="flex flex-col">
            <SectionHeading
              eyebrow="Visit Us"
              title={<>Location & Contact</>}
              intro="Find us in Moosapet, Hyderabad. Call ahead or drop by — we are happy to walk you through what your car needs."
            />

            <Reveal delay={160} className="mt-10 flex flex-col gap-5">
              {[
                {
                  icon: PinIcon,
                  label: 'Workshop',
                  lines: ['Grand Motors', ADDRESS_LINE_1, ADDRESS_LINE_2],
                  href: MAPS_LINK,
                  external: true,
                },
                { icon: PhoneIcon, label: 'Phone', lines: [PHONE_DISPLAY], href: `tel:${PHONE_TEL}` },
                { icon: MailIcon, label: 'Email', lines: [EMAIL], href: `mailto:${EMAIL}` },
                {
                  icon: ClockIcon,
                  label: 'Hours',
                  lines: ['Mon – Sat · 9:30 AM – 8:00 PM', 'Sunday · By appointment'],
                },
              ].map((row) => {
                const Icon = row.icon;
                const content = (
                  <>
                    <span className="shrink-0 grid place-items-center w-11 h-11 rounded-lg border border-white/10 text-[#B88952] transition-colors duration-200 group-hover:border-[#B88952]/40 group-hover:bg-[#B88952]/10">
                      <Icon className="w-5 h-5" />
                    </span>
                    <span>
                      <span className="block text-[11px] font-semibold tracking-[0.22em] uppercase text-[#A7AAAD]/80">
                        {row.label}
                      </span>
                      {row.lines.map((line) => (
                        <span key={line} className="block text-[14px] md:text-[15px] text-[#F2F0EA] leading-snug mt-0.5">
                          {line}
                        </span>
                      ))}
                    </span>
                  </>
                );
                return row.href ? (
                  <a
                    key={row.label}
                    href={row.href}
                    {...(row.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="group flex items-start gap-4 cursor-pointer"
                  >
                    {content}
                  </a>
                ) : (
                  <div key={row.label} className="group flex items-start gap-4">
                    {content}
                  </div>
                );
              })}
            </Reveal>
          </div>

          <Reveal delay={120} className="min-h-[340px] lg:min-h-full">
            <div className="relative h-full min-h-[340px] rounded-2xl overflow-hidden border border-white/10">
              <iframe
                title="Grand Motors location on Google Maps — Moosapet, Hyderabad"
                src={MAPS_EMBED}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 w-full h-full grayscale-[0.3] contrast-[1.05]"
                style={{ border: 0 }}
                allowFullScreen
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 8. FOOTER                                                    */}
      {/* ============================================================ */}
      <footer className="relative px-6 md:px-12 lg:px-16 pt-16 pb-10 bg-[#0A0C0D] border-t border-white/8">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-10 md:grid-cols-4">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-semibold tracking-[0.25em] text-[#F2F0EA] uppercase">
                  Grand Motors
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#B88952]" />
              </div>
              <p className="mt-4 text-[13px] leading-relaxed text-[#A7AAAD] max-w-xs">
                Premium automotive workshop in Moosapet, Hyderabad. Precision service, honest advice
                and genuine-quality parts.
              </p>
            </div>

            {/* Navigation */}
            <nav aria-label="Footer">
              <h3 className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[#A7AAAD]/80">
                Navigate
              </h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {[
                  { label: 'Services', href: '#services' },
                  { label: 'Detailed Services', href: '#detailed-services' },
                  { label: 'About', href: '#about' },
                  { label: 'Contact', href: '#contact' },
                ].map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[13.5px] text-[#D8D6D0]/80 hover:text-[#B88952] transition-colors duration-200 cursor-pointer"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Services */}
            <div>
              <h3 className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[#A7AAAD]/80">
                Services
              </h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {SERVICES.slice(0, 6).map((service) => (
                  <li key={service.id}>
                    <a
                      href="#detailed-services"
                      className="text-[13.5px] text-[#D8D6D0]/80 hover:text-[#B88952] transition-colors duration-200 cursor-pointer"
                    >
                      {service.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[#A7AAAD]/80">
                Reach Us
              </h3>
              <ul className="mt-4 flex flex-col gap-3 text-[13.5px] text-[#D8D6D0]/80">
                <li className="flex items-start gap-2.5">
                  <PinIcon className="w-4 h-4 mt-0.5 shrink-0 text-[#B88952]" />
                  <span>
                    {ADDRESS_LINE_1}
                    <br />
                    {ADDRESS_LINE_2}
                  </span>
                </li>
                <li>
                  <a href={`tel:${PHONE_TEL}`} className="flex items-center gap-2.5 hover:text-[#B88952] transition-colors duration-200 cursor-pointer">
                    <PhoneIcon className="w-4 h-4 shrink-0 text-[#B88952]" />
                    {PHONE_DISPLAY}
                  </a>
                </li>
                <li>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 hover:text-[#B88952] transition-colors duration-200 cursor-pointer">
                    <WhatsAppIcon className="w-4 h-4 shrink-0 text-[#25D366]" />
                    WhatsApp
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-14 pt-6 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[12px] tracking-[0.08em] text-[#A7AAAD]/70">
              © {new Date().getFullYear()} Grand Motors, Hyderabad. All rights reserved.
            </p>
            <p className="text-[11px] tracking-[0.2em] uppercase text-[#A7AAAD]/50">
              Engineered for the drive
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
