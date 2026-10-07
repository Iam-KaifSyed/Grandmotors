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
} from './Icons';

export type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export interface ServiceCategory {
  id: string;
  title: string;
  icon: IconType;
  summary: string;
  items: string[];
}

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
    items: [
      'Interior deep cleaning',
      'Exterior wash & polish',
      'Ceramic coating & paint protection',
      'Headlight restoration',
      'Upholstery & leather care',
      'Engine bay cleaning',
    ],
  },
];
