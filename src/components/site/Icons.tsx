import type { SVGProps } from 'react';

/**
 * Inline SVG icon set (stroke-based, consistent 24x24 viewBox).
 * No emoji icons. All inherit currentColor.
 */
type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function EngineIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M5 13v-2h3V8h4l2 2h3v-2h2v8h-2v-2h-3l-2 2H8v-3H5z" />
      <path d="M3 11v2" />
      <path d="M19 10h2v4h-2" />
    </svg>
  );
}

export function BrakeIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3" />
    </svg>
  );
}

export function TyreIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 3.5V8M12 16v4.5M3.5 12H8M16 12h4.5M6 6l2.8 2.8M15.2 15.2 18 18M18 6l-2.8 2.8M8.8 15.2 6 18" />
    </svg>
  );
}

export function BoltIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2z" />
    </svg>
  );
}

export function SuspensionIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M8 3v4M8 17v4M16 3v4M16 17v4" />
      <path d="M6 7h4M14 7h4M6 17h4M14 17h4" />
      <path d="M8 7c0 2-2 2-2 3.5S8 12 8 14M16 7c0 2 2 2 2 3.5S16 12 16 14" />
    </svg>
  );
}

export function WrenchIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M15 3.5a4.5 4.5 0 0 0-4.3 5.8L3.6 16.4a2 2 0 0 0 2.8 2.8l7.1-7.1A4.5 4.5 0 1 0 15 3.5z" />
    </svg>
  );
}

export function PaintIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <rect x="4" y="4" width="12" height="7" rx="1.5" />
      <path d="M16 7h3v4a2 2 0 0 1-2 2h-3" />
      <path d="M10 13v3a2 2 0 0 1-2 2 2 2 0 0 0-2 2" />
    </svg>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
      <path d="M18.5 15.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z" />
    </svg>
  );
}

export function ShieldCheckIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.5a3 3 0 0 1 0 5.6M17 14.5a5.5 5.5 0 0 1 3.5 4.5" />
    </svg>
  );
}

export function GaugeIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M4 16a8 8 0 1 1 16 0" />
      <path d="M12 16l4-4" />
      <circle cx="12" cy="16" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function BadgeIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <circle cx="12" cy="9" r="5.5" />
      <path d="m8.5 13.5-1 7 4.5-2.5 4.5 2.5-1-7" />
      <path d="m10 9 1.4 1.4L15 7" />
    </svg>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="m4 12 5 5L20 6" />
    </svg>
  );
}

export function TruckIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17" cy="18" r="1.6" />
    </svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M6.5 3.5 9 4l1 3-1.8 1.4a12 12 0 0 0 5.4 5.4L15 11l3 1 .5 2.5a2 2 0 0 1-2.2 2.4A14 14 0 0 1 4.1 5.7 2 2 0 0 1 6.5 3.5z" />
    </svg>
  );
}

export function WhatsAppIcon(props: IconProps) {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12.04 2a9.9 9.9 0 0 0-8.47 15l-1.4 5.08 5.2-1.36A9.9 9.9 0 1 0 12.04 2zm0 1.8a8.1 8.1 0 0 1 6.9 12.4 8.1 8.1 0 0 1-10.9 2.86l-.37-.22-3.08.81.82-3-.24-.38A8.1 8.1 0 0 1 12.04 3.8zm-3.1 4.03c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.44 1.03 2.6c.13.17 1.77 2.82 4.4 3.84 2.18.85 2.62.68 3.1.63.47-.04 1.52-.62 1.73-1.22.21-.6.21-1.11.15-1.22-.06-.1-.23-.17-.48-.3-.25-.12-1.52-.75-1.75-.83-.23-.08-.4-.13-.57.13-.17.25-.65.82-.8.99-.14.17-.29.19-.54.06-.25-.12-1.08-.4-2.05-1.27-.76-.68-1.27-1.51-1.42-1.76-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.12-.14.16-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.37-.77-1.87-.2-.49-.4-.42-.56-.43h-.5z" />
    </svg>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M20 12H5M11 18l-6-6 6-6" />
    </svg>
  );
}

export function AlertTriangleIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}

export function CompassIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
