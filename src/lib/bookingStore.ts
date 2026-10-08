export interface BookingRecord {
  id: string;
  status: 'Pending' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled';
  fullName: string;
  phoneNumber: string;
  email?: string;
  vehicleMake: string;
  vehicleModel: string;
  registrationNumber: string;
  serviceCategory: string;
  specificService?: string;
  preferredDate: string;
  preferredTime: string;
  additionalMessage?: string;
  createdAt: string;
}

export const INITIAL_BOOKINGS: BookingRecord[] = [
  {
    id: 'GM-229397',
    status: 'In Progress',
    fullName: 'Aditya Varma',
    phoneNumber: '+91 98490 12345',
    email: 'aditya.v@example.com',
    vehicleMake: 'BMW',
    vehicleModel: 'M3 Competition',
    registrationNumber: 'TS 09 EG 4499',
    serviceCategory: 'brake-systems',
    specificService: 'Brake pad & rotor replacement',
    preferredDate: '2026-10-12',
    preferredTime: 'Morning (9:00 AM - 12:00 PM)',
    additionalMessage: 'Inspect front ceramic brake sensors.',
    createdAt: '2026-10-07T09:30:00Z',
  },
  {
    id: 'GM-842910',
    status: 'Confirmed',
    fullName: 'Rahul Sharma',
    phoneNumber: '+91 98765 43210',
    email: 'rahul@example.com',
    vehicleMake: 'Mercedes-Benz',
    vehicleModel: 'AMG GT',
    registrationNumber: 'TS 09 AB 1234',
    serviceCategory: 'engine-diagnostics',
    specificService: 'Computerised OBD / ECU diagnostics',
    preferredDate: '2026-10-15',
    preferredTime: 'Morning (9:00 AM - 12:00 PM)',
    additionalMessage: 'Check the slight knocking sound on cold starts.',
    createdAt: '2026-10-06T11:00:00Z',
  },
  {
    id: 'GM-551920',
    status: 'Completed',
    fullName: 'Priya Reddy',
    phoneNumber: '+91 91234 56789',
    email: 'priya.r@example.com',
    vehicleMake: 'Porsche',
    vehicleModel: 'Cayenne GTS',
    registrationNumber: 'TS 07 HK 9000',
    serviceCategory: 'general-service',
    specificService: 'Periodic / scheduled service',
    preferredDate: '2026-10-02',
    preferredTime: 'Afternoon (12:00 PM - 3:00 PM)',
    additionalMessage: '',
    createdAt: '2026-09-28T14:15:00Z',
  },
];

const STORAGE_KEY = 'gm_active_bookings';

export function getAllBookings(): BookingRecord[] {
  if (typeof window === 'undefined') {
    return INITIAL_BOOKINGS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_BOOKINGS));
      return INITIAL_BOOKINGS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_BOOKINGS;
  } catch {
    return INITIAL_BOOKINGS;
  }
}

export function saveBookingRecord(booking: BookingRecord): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getAllBookings();
    const updated = [
      booking,
      ...current.filter((b) => b.id.toUpperCase() !== booking.id.toUpperCase()),
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save booking to local store', err);
  }
}

export function getBookingById(bookingId: string): BookingRecord | null {
  if (!bookingId) return null;
  const clean = bookingId.trim().toUpperCase();
  const all = getAllBookings();

  return (
    all.find((b) => {
      const bId = b.id.toUpperCase();
      const strippedBId = bId.replace(/^GM-?/i, '');
      const strippedClean = clean.replace(/^GM-?/i, '');
      return bId === clean || strippedBId === strippedClean;
    }) || null
  );
}
