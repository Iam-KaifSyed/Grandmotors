import { createElement } from 'react';
import { Reveal, SectionHeading } from './Shared';
import { ArrowRightIcon, PhoneIcon, WhatsAppIcon, PinIcon } from './Icons';

const PHONE_TEL = '+918623948898';
const WHATSAPP_URL = 'https://wa.me/918623948898';
const MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  'Grand Motors, Metro Pillar No. 842, 5-7-73/NR, beside JSP Honda Showroom, Habeeb Nagar, Moosapet, Hyderabad, Telangana 500072'
)}`;

/* ------------------------------------------------------------------ */
/* Home page simplified content                                       */
/* ------------------------------------------------------------------ */
export function SiteContent() {
  return (
    <div id="site-content" className="relative z-10 bg-[#07090A] text-[#F2F0EA]">
      {/* Transition seam */}
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

      <section className="relative px-6 md:px-12 lg:px-16 py-20 md:py-28 bg-[#0A0C0D] border-y border-white/5 overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
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
              href="/contact"
              className="group inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#B88952] text-[#0A0C0D] font-semibold tracking-[0.02em] transition-colors duration-200 hover:bg-[#caa066] cursor-pointer"
            >
              Book Service
              <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="/services"
              className="group inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-7 py-3.5 rounded-full border border-white/15 text-[#F2F0EA] font-semibold tracking-[0.02em] transition-colors duration-200 hover:border-[#B88952]/50 hover:bg-[#B88952]/10 cursor-pointer"
            >
              Explore Services
            </a>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
