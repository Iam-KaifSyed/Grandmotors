import type { ComponentType, SVGProps } from 'react';
import {
  EngineIcon,
  BrakeIcon,
  TyreIcon,
  BoltIcon,
  SuspensionIcon,
  WrenchIcon,
  PaintIcon,
  SparkleIcon,
  BatteryBoltIcon,
} from './Icons';

export type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export interface ServiceCategory {
  id: string;
  title: string;
  icon: IconType;
  summary: string;
  items: string[];
  /** High-resolution Unsplash CDN image for the service card (free for commercial use). */
  image: string;
  /** Descriptive alt text for accessibility. */
  imageAlt: string;
}

/** Shared Unsplash CDN sizing params for consistent, optimised delivery. */
const IMG = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

/**
 * Eight major service categories with their detailed service lists.
 * Used by both the Services Overview grid and the Detailed Services accordion.
 */
export const SERVICES: ServiceCategory[] = [
  {
    id: 'engine-diagnostics',
    title: 'Engine & Diagnostics',
    icon: EngineIcon,
    summary:
      'Computerised fault scanning and precision engine work to keep performance exactly where it should be.',
    image: IMG('photo-1486262715619-67b85e0b08d3'),
    imageAlt: 'Technician inspecting a car engine bay under the hood',
    items: [
      'Computerised OBD / ECU diagnostics',
      'Engine tuning & performance checks',
      'Timing belt & chain replacement',
      'Cylinder head & gasket repair',
      'Oil, filter & fluid service',
      'Cooling system & radiator service',
      'Turbo & intake inspection',
    ],
  },
  {
    id: 'brakes',
    title: 'Brakes',
    icon: BrakeIcon,
    summary:
      'Complete braking system service tuned for confident, repeatable stopping power.',
    image: '/images/service-brakes.jpg',
    imageAlt: 'Red Brembo brake caliper over a drilled disc rotor on a performance car wheel',
    items: [
      'Brake pad & disc replacement',
      'Brake fluid flush & bleed',
      'Caliper service & overhaul',
      'ABS diagnostics',
      'Handbrake adjustment',
      'Brake line inspection',
    ],
  },
  {
    id: 'tyres-alignment',
    title: 'Tyres & Wheel Alignment',
    icon: TyreIcon,
    summary:
      'Precision alignment and balancing for even wear, cleaner handling and longer tyre life.',
    image: '/images/service-tyres.jpeg',
    imageAlt: 'Alloy wheel and performance tyre during a tyre and alignment service',
    items: [
      'Tyre fitting & replacement',
      'Computerised wheel alignment',
      'Wheel balancing',
      'Puncture repair',
      'Tyre rotation',
      'Nitrogen inflation',
    ],
  },
  {
    id: 'ac-electrical',
    title: 'AC & Electrical',
    icon: BoltIcon,
    summary:
      'Climate comfort and electrical reliability, from compressor service to battery and wiring diagnostics.',
    image: '/images/service-ac-electrical.jpg',
    imageAlt: 'Automotive air-conditioning and electrical diagnostics work',
    items: [
      'AC gas recharge & leak detection',
      'Compressor & condenser service',
      'Battery testing & replacement',
      'Alternator & starter repair',
      'Wiring & fuse diagnostics',
      'Lighting & electronics repair',
    ],
  },
  {
    id: 'suspension-steering',
    title: 'Suspension & Steering',
    icon: SuspensionIcon,
    summary:
      'Shocks, struts and steering components restored for a planted, controlled ride.',
    image: '/images/service-suspension.jpg',
    imageAlt: 'Suspension coil spring and shock absorber assembly',
    items: [
      'Shock & strut replacement',
      'Suspension bush & arm repair',
      'Steering rack service',
      'Ball joint & tie rod replacement',
      'Power steering service',
      'Ride height & handling checks',
    ],
  },
  {
    id: 'general-service',
    title: 'General Service & Maintenance',
    icon: WrenchIcon,
    summary:
      'Scheduled periodic service that keeps the whole vehicle healthy and warranty-ready.',
    image: '/images/service-general.jpg',
    imageAlt: 'Mechanic performing routine maintenance in a modern workshop',
    items: [
      'Periodic / scheduled service',
      'Multi-point vehicle inspection',
      'Filters (air, cabin, fuel) replacement',
      'Spark plug replacement',
      'Belt & hose inspection',
      'Pre-purchase & pre-trip checks',
    ],
  },
  {
    id: 'body-paint',
    title: 'Body & Paint',
    icon: PaintIcon,
    summary:
      'Collision repair and factory-grade refinishing with precise colour matching.',
    image: IMG('photo-1550355291-bbee04a92027'),
    imageAlt: 'Freshly painted car body panel with a deep gloss finish',
    items: [
      'Dent & scratch repair',
      'Panel beating & body work',
      'Full & spot repainting',
      'Colour matching',
      'Rust treatment & protection',
      'Bumper & panel replacement',
    ],
  },
  {
    id: 'detailing-interior',
    title: 'Detailing & Interior',
    icon: SparkleIcon,
    summary:
      'Deep cleaning, protection and finishing that returns the cabin and paint to showroom condition.',
    image: '/images/service-detailing.jpg',
    imageAlt: 'Polished car exterior with a deep mirror-gloss finish',
    items: [
      'Interior deep cleaning',
      'Exterior wash & polish',
      'Ceramic coating & paint protection',
      'Headlight restoration',
      'Upholstery & leather care',
      'Engine bay cleaning',
    ],
  },
  {
    id: 'car-battery-jump-start',
    title: 'Car Battery Jump Start',
    icon: BatteryBoltIcon,
    summary:
      'Professional jump start assistance to safely start your car when its battery is discharged or flat.',
    image: IMG('photo-1619642751034-765dfdf7c58e'),
    imageAlt: 'Technician jump-starting a vehicle with booster cables connected to a discharged car battery',
    items: [
      'Safe battery jump start with surge & reverse-polarity protection',
      'Discharged battery testing & state-of-health diagnostics',
      'Alternator charging output & starter motor check',
      'Terminal cleaning & secure connection inspection',
      'Parasitic electrical leakage & drain check',
      'Doorstep & emergency roadside assistance',
    ],
  },
];
