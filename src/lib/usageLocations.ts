export interface UsageLocationDef {
  key: string;
  name: string;
  description: string;
  recommendedDimensions?: string;
}

export const USAGE_LOCATIONS: UsageLocationDef[] = [
  {
    key: 'services-hero',
    name: 'Services Page Hero',
    description: 'Main background image for the top hero on /services',
    recommendedDimensions: '1920x1080',
  },
  {
    key: 'services-cta',
    name: 'Services Page CTA Banner',
    description: 'Background image for the "Ready when your car is" booking callout',
    recommendedDimensions: '2000x1200',
  },
  {
    key: 'service-engine-diagnostics',
    name: 'Engine & Diagnostics Service Card',
    description: 'Card image for Engine & Diagnostics',
    recommendedDimensions: '1200x800',
  },
  {
    key: 'service-brakes',
    name: 'Brakes Service Card',
    description: 'Card image for Brakes service',
    recommendedDimensions: '1200x800',
  },
  {
    key: 'service-tyres-alignment',
    name: 'Tyres & Alignment Service Card',
    description: 'Card image for Tyres & Wheel Alignment',
    recommendedDimensions: '1200x800',
  },
  {
    key: 'service-ac-electrical',
    name: 'AC & Electrical Service Card',
    description: 'Card image for AC & Electrical',
    recommendedDimensions: '1200x800',
  },
  {
    key: 'service-suspension-steering',
    name: 'Suspension & Steering Service Card',
    description: 'Card image for Suspension & Steering',
    recommendedDimensions: '1200x800',
  },
  {
    key: 'service-general-service',
    name: 'General Service Card',
    description: 'Card image for General Service & Maintenance',
    recommendedDimensions: '1200x800',
  },
  {
    key: 'service-body-paint',
    name: 'Body & Paint Service Card',
    description: 'Card image for Body & Paint',
    recommendedDimensions: '1200x800',
  },
  {
    key: 'service-detailing-interior',
    name: 'Detailing & Interior Service Card',
    description: 'Card image for Detailing & Interior',
    recommendedDimensions: '1200x800',
  },
  {
    key: 'service-car-battery-jump-start',
    name: 'Car Battery Jump Start Service Card',
    description: 'Card image for Car Battery Jump Start',
    recommendedDimensions: '1200x800',
  },
];

export const VALID_USAGE_LOCATION_KEYS = new Set(USAGE_LOCATIONS.map((u) => u.key));

export function isValidUsageLocation(key: string): boolean {
  return VALID_USAGE_LOCATION_KEYS.has(key);
}

export function getUsageLocationDef(key: string): UsageLocationDef | undefined {
  return USAGE_LOCATIONS.find((u) => u.key === key);
}
