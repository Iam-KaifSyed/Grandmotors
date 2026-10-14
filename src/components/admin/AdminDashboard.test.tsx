import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { AdminDashboard } from './AdminDashboard';

const sampleBookings = [
  {
    id: 'GM-20261014-9988',
    bookingId: 'GM-20261014-9988',
    customerName: 'Aarav Patel',
    fullName: 'Aarav Patel',
    phoneNumber: '+91 98490 12345',
    phone: '+91 98490 12345',
    email: 'aarav.patel@example.com',
    vehicleMake: 'Mercedes-Benz',
    vehicleModel: 'E-Class E220d',
    vehicle: 'Mercedes-Benz E-Class E220d',
    fuelType: 'Diesel',
    registrationNumber: 'TS 09 AB 1234',
    serviceCategory: 'periodic-maintenance',
    specificService: 'Comprehensive 30,000 KM Major Service',
    preferredDate: '2026-10-20',
    preferredTime: '10:00 AM',
    status: 'Confirmed' as const,
    additionalMessage: 'Please inspect front brake pads and transmission fluid level carefully.',
    serviceLocation: 'Doorstep Service',
    doorstepHouseFlat: 'Flat 402, Skyline Residency',
    doorstepStreetLocality: 'Road No 36, Jubilee Hills',
    doorstepCity: 'Hyderabad',
    doorstepPincode: '500033',
    source: 'Direct/Unknown',
    isArchived: false,
    createdAt: '2026-10-14T10:30:00Z',
  },
];

describe('AdminDashboard Table Layout & Accessibility', () => {
  it('renders the responsive desktop table container with horizontal scroll support and fixed layout', () => {
    const html = renderToString(<AdminDashboard initialBookings={sampleBookings} />);

    // Container must support controlled horizontal scroll for narrower viewports
    expect(html).toContain('overflow-x-auto');
    expect(html).toContain('table-fixed');

    // Table must enforce minimum comfortable width
    expect(html).toContain('min-w-[1180px]');

    // Table headers must include all expected columns
    expect(html).toContain('Booking ID');
    expect(html).toContain('Customer');
    expect(html).toContain('Phone');
    expect(html).toContain('Vehicle');
    expect(html).toContain('Service');
    expect(html).toContain('Requested');
    expect(html).toContain('Status');
    expect(html).toContain('Source');
    expect(html).toContain('Actions');
  });

  it('allocates sufficient dedicated widths for Source and Actions columns to prevent overlapping', () => {
    const html = renderToString(<AdminDashboard initialBookings={sampleBookings} />);

    // Source header has dedicated min-width
    expect(html).toContain('min-w-[130px]');

    // Action header has dedicated min-width
    expect(html).toContain('min-w-[165px]');

    // Action cell contains View and Archive buttons with gap and no overlapping
    expect(html).toContain('View');
    expect(html).toContain('Archive');
    expect(html).toContain('gap-1.5 sm:gap-2');
  });

  it('renders lead-source badge with proper styling, non-colliding layout and tooltip', () => {
    const html = renderToString(<AdminDashboard initialBookings={sampleBookings} />);

    // SourceBadge rendered with tooltip and uppercase text
    expect(html).toContain('title="Lead source: Direct/Unknown"');
    expect(html).toContain('Direct/Unknown');
  });

  it('renders distinct, separated mobile cards with prominent Booking IDs and dedicated footers', () => {
    const html = renderToString(<AdminDashboard initialBookings={sampleBookings} />);

    // Mobile layout uses space-y-4 container with isolated article cards
    expect(html).toContain('lg:hidden space-y-4');
    expect(html).toContain('<article');
    expect(html).toContain('rounded-xl border border-[var(--gm-border-subtle)] bg-[var(--gm-bg-card)]');

    // Prominent Booking ID at top of card
    expect(html).toContain('Booking ID');
    expect(html).toContain('GM-20261014-9988');

    // Customer details with quick contact
    expect(html).toContain('Aarav Patel');
    expect(html).toContain('aarav.patel@example.com');
    expect(html).toContain('+91 98490 12345');
    expect(html).toContain('Call');
    expect(html).toContain('WA');

    // Structured vehicle, service and schedule details
    expect(html).toContain('Mercedes-Benz E-Class E220d');
    expect(html).toContain('Fuel: Diesel');
    expect(html).toContain('Doorstep City: Hyderabad');

    // Dedicated card footer with equal-width buttons
    expect(html).toContain('flex-1 min-h-[38px]');
    expect(html).toContain('View Details');
    expect(html).toContain('Archive');
  });
});
