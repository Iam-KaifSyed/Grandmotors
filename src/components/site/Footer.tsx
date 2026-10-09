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
    <footer className="relative z-10 px-6 md:px-12 lg:px-16 pt-16 pb-10 bg-[#0A0C0D] border-t border-white/8">
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
                { label: 'Home', href: '/' },
                { label: 'Services', href: '/services' },
                { label: 'Book Service', href: '/book-service' },
                { label: 'My Bookings', href: '/my-bookings' },
                { label: 'Track Booking', href: '/track-booking' },
                { label: 'About', href: '/about' },
                { label: 'Contact', href: '/contact' },
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
              {serviceList.map((service) => (
                <li key={service.id}>
                  <a
                    href="/services"
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
              <li>
                <a
                  href={MAPS_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2.5 hover:text-[#B88952] transition-colors duration-200 cursor-pointer"
                >
                  <PinIcon className="w-4 h-4 mt-0.5 shrink-0 text-[#B88952]" />
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
                  className="flex items-center gap-2.5 hover:text-[#B88952] transition-colors duration-200 cursor-pointer"
                >
                  <PhoneIcon className="w-4 h-4 shrink-0 text-[#B88952]" />
                  {PHONE_DISPLAY}
                </a>
              </li>
              <li>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 hover:text-[#B88952] transition-colors duration-200 cursor-pointer"
                >
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
  );
}
