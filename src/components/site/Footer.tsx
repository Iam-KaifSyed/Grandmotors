import { SERVICES } from './servicesData';
import { PinIcon, PhoneIcon, WhatsAppIcon } from './Icons';

const PHONE_DISPLAY = '+91 86239 48898';
const PHONE_TEL = '+918623948898';
const WHATSAPP_URL = 'https://wa.me/918623948898';
const ADDRESS_LINE_1 = 'Metro Pillar No. 842, 5-7-73/NR';
const ADDRESS_LINE_2 = 'Beside JSP Honda Showroom, Habeeb Nagar';
const ADDRESS_LINE_3 = 'Moosapet, Hyderabad, Telangana 500072';
const MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  'Grand Motors, Metro Pillar No. 842, 5-7-73/NR, beside JSP Honda Showroom, Habeeb Nagar, Moosapet, Hyderabad, Telangana 500072'
)}`;

interface FooterProps {
  services?: Array<{ id: string; title: string }>;
}

export function Footer({ services }: FooterProps = {}) {
  const serviceList = services && services.length > 0 ? services.slice(0, 6) : SERVICES.slice(0, 6);

  return (
    <footer className="relative z-40 px-4 sm:px-8 md:px-12 lg:px-16 pt-8 sm:pt-10 pb-6 sm:pb-8 bg-[var(--gm-bg-surface)] border-t border-[var(--gm-border-subtle)] transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <div className="grid gap-8 sm:gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-semibold tracking-[0.25em] text-[var(--gm-text-primary)] uppercase">
                Grand Motors
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--gm-accent-primary)] shadow-[0_0_6px_var(--gm-accent-glow)]" />
            </div>
            <p className="mt-4 text-xs sm:text-[13px] leading-relaxed text-[var(--gm-text-secondary)] max-w-sm">
              Premium automotive workshop in Moosapet, Hyderabad. Precision service, honest advice
              and genuine-quality parts.
            </p>
          </div>

          {/* Navigation */}
          <nav aria-label="Footer">
            <h3 className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[var(--gm-text-muted)]">
              Navigate
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {[
                { label: 'Home', href: '/' },
                { label: 'Services', href: '/services' },
                { label: 'Gallery', href: '/gallery' },
                { label: 'Book Service', href: '/book-service' },
                { label: 'My Bookings', href: '/my-bookings' },
                { label: 'Track Booking', href: '/track-booking' },
                { label: 'About', href: '/about' },
                { label: 'Contact', href: '/contact' },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-[13.5px] text-[var(--gm-text-secondary)] hover:text-[var(--gm-accent-primary)] transition-colors duration-200 cursor-pointer"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Services */}
          <div>
            <h3 className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[var(--gm-text-muted)]">
              Services
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {serviceList.map((service) => (
                <li key={service.id}>
                  <a
                    href="/services"
                    className="text-[13.5px] text-[var(--gm-text-secondary)] hover:text-[var(--gm-accent-primary)] transition-colors duration-200 cursor-pointer"
                  >
                    {service.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[var(--gm-text-muted)]">
              Reach Us
            </h3>
            <ul className="mt-4 flex flex-col gap-3 text-[13.5px] text-[var(--gm-text-secondary)]">
              <li>
                <a
                  href={MAPS_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2.5 hover:text-[var(--gm-accent-primary)] transition-colors duration-200 cursor-pointer"
                >
                  <PinIcon className="w-4 h-4 mt-0.5 shrink-0 text-[var(--gm-accent-primary)]" />
                  <span>
                    {ADDRESS_LINE_1}
                    <br />
                    {ADDRESS_LINE_2}
                    <br />
                    {ADDRESS_LINE_3}
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={`tel:${PHONE_TEL}`}
                  className="flex items-center gap-2.5 hover:text-[var(--gm-accent-primary)] transition-colors duration-200 cursor-pointer"
                >
                  <PhoneIcon className="w-4 h-4 shrink-0 text-[var(--gm-accent-primary)]" />
                  {PHONE_DISPLAY}
                </a>
              </li>
              <li>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 hover:text-[var(--gm-accent-primary)] transition-colors duration-200 cursor-pointer"
                >
                  <WhatsAppIcon className="w-4 h-4 shrink-0 text-[#25D366]" />
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-[var(--gm-border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12px] tracking-[0.08em] text-[var(--gm-text-muted)]">
            © {new Date().getFullYear()} Grand Motors, Hyderabad. All rights reserved.
          </p>
          <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--gm-text-muted)]">
            Engineered for the drive
          </p>
        </div>
      </div>
    </footer>
  );
}
