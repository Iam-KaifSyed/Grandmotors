export type BookingStatus = 'Pending' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled';
export type ServiceLocation = 'Workshop Visit' | 'Doorstep Service';

export const FUEL_TYPES = [
  'Petrol',
  'Diesel',
  'CNG',
  'Electric (EV)',
  'Hybrid',
  'Other',
] as const;

export type FuelType = (typeof FUEL_TYPES)[number];

export interface BookingRecord {
  id: string; // Booking ID e.g. GM-229397
  bookingId?: string; // Standard alias
  customerName?: string;
  fullName: string;
  phone?: string;
  phoneNumber: string;
  email?: string;
  vehicle?: string; // e.g. "BMW M3 Competition"
  vehicleMake: string;
  vehicleModel: string;
  fuelType?: FuelType | string;
  registrationNumber: string;
  serviceCategory: string;
  specificService?: string;
  requestedDate?: string;
  preferredDate: string;
  requestedTime?: string;
  preferredTime: string;
  status: BookingStatus;
  additionalMessage?: string;
  serviceLocation: ServiceLocation | string;
  doorstepHouseFlat?: string;
  doorstepStreetLocality?: string;
  doorstepCity?: string;
  doorstepPincode?: string;
  doorstepLatitude?: number | null;
  doorstepLongitude?: number | null;
  doorstepMapUrl?: string;
  source?: string;
  createdAt: string;
}

export const STORAGE_KEY = 'grandmotors_bookings';
const LEGACY_STORAGE_KEY = 'gm_active_bookings';

/**
 * Normalizes a BookingRecord to ensure all alias fields are populated.
 * Optionally merges with an existing record to preserve user fields during partial updates.
 */
export function normalizeBooking(
  raw: Partial<BookingRecord> & { id: string },
  existing?: BookingRecord
): BookingRecord {
  const id = raw.id || raw.bookingId || existing?.id || '';
  const fullName = (raw.fullName || raw.customerName || existing?.fullName || '').trim();
  const phoneNumber = (raw.phoneNumber || raw.phone || existing?.phoneNumber || '').trim();
  const vehicleMake = (raw.vehicleMake || existing?.vehicleMake || '').trim();
  const vehicleModel = (raw.vehicleModel || existing?.vehicleModel || '').trim();
  const vehicle = raw.vehicle || existing?.vehicle || [vehicleMake, vehicleModel].filter(Boolean).join(' ') || 'Vehicle';
  const preferredDate = raw.preferredDate || raw.requestedDate || existing?.preferredDate || '';
  const preferredTime = raw.preferredTime || raw.requestedTime || existing?.preferredTime || '';

  // Service Location normalization
  const rawLoc = raw.serviceLocation || existing?.serviceLocation || 'Workshop Visit';
  const serviceLocation: ServiceLocation | string =
    rawLoc.toLowerCase().includes('doorstep') ? 'Doorstep Service' : 'Workshop Visit';

  const doorstepHouseFlat = (
    raw.doorstepHouseFlat !== undefined ? raw.doorstepHouseFlat : existing?.doorstepHouseFlat || ''
  ).trim();
  const doorstepStreetLocality = (
    raw.doorstepStreetLocality !== undefined
      ? raw.doorstepStreetLocality
      : existing?.doorstepStreetLocality || ''
  ).trim();
  const doorstepCity = (
    raw.doorstepCity !== undefined ? raw.doorstepCity : existing?.doorstepCity || ''
  ).trim();
  const doorstepPincode = (
    raw.doorstepPincode !== undefined ? raw.doorstepPincode : existing?.doorstepPincode || ''
  ).trim();

  const doorstepLatitude =
    raw.doorstepLatitude !== undefined
      ? raw.doorstepLatitude
      : existing?.doorstepLatitude !== undefined
      ? existing.doorstepLatitude
      : null;
  const doorstepLongitude =
    raw.doorstepLongitude !== undefined
      ? raw.doorstepLongitude
      : existing?.doorstepLongitude !== undefined
      ? existing.doorstepLongitude
      : null;

  let doorstepMapUrl = (
    raw.doorstepMapUrl !== undefined ? raw.doorstepMapUrl : existing?.doorstepMapUrl || ''
  ).trim();

  if (!doorstepMapUrl && doorstepLatitude !== null && doorstepLongitude !== null) {
    doorstepMapUrl = `https://www.google.com/maps?q=${doorstepLatitude},${doorstepLongitude}`;
  }

  return {
    id,
    bookingId: id,
    fullName,
    customerName: fullName,
    phoneNumber,
    phone: phoneNumber,
    email: (raw.email !== undefined ? raw.email : existing?.email || '').trim(),
    vehicle,
    vehicleMake: vehicleMake || vehicle,
    vehicleModel: vehicleModel || '',
    fuelType: (raw.fuelType !== undefined ? raw.fuelType : existing?.fuelType || '').trim(),
    registrationNumber: (raw.registrationNumber || existing?.registrationNumber || '').trim().toUpperCase(),
    serviceCategory: raw.serviceCategory || existing?.serviceCategory || '',
    specificService: raw.specificService || existing?.specificService || '',
    preferredDate,
    requestedDate: preferredDate,
    preferredTime,
    requestedTime: preferredTime,
    status: raw.status || existing?.status || 'Pending',
    additionalMessage: (raw.additionalMessage !== undefined ? raw.additionalMessage : existing?.additionalMessage || '').trim(),
    serviceLocation,
    doorstepHouseFlat,
    doorstepStreetLocality,
    doorstepCity,
    doorstepPincode,
    doorstepLatitude,
    doorstepLongitude,
    doorstepMapUrl,
    source: (raw.source !== undefined ? raw.source : existing?.source) || '',
    createdAt: raw.createdAt || existing?.createdAt || new Date().toISOString(),
  };
}

/**
 * Retrieves all locally saved customer bookings on this device.
 * Returns an empty array if no bookings have been created on this browser yet.
 */
export function getCustomerBookings(): BookingRecord[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => normalizeBooking(item));
      }
    }

    // Check legacy key if primary doesn't exist yet and migrate customer entries
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      try {
        const legacyParsed = JSON.parse(legacyRaw);
        if (Array.isArray(legacyParsed) && legacyParsed.length > 0) {
          const migrated = legacyParsed.map((item) => normalizeBooking(item));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
          return migrated;
        }
      } catch {
        // Ignore legacy parse errors
      }
    }

    return [];
  } catch (err) {
    console.error('Failed to retrieve customer bookings from localStorage', err);
    return [];
  }
}

/**
 * Saves a customer booking to localStorage under `grandmotors_bookings`.
 * If updating an existing booking ID, preserves its position in the list.
 * If creating a new booking, prepends it to the top.
 */
export function saveBookingRecord(booking: BookingRecord | Partial<BookingRecord> & { id: string }): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getCustomerBookings();
    const cleanId = (booking.id || booking.bookingId || '').trim().toUpperCase();
    const existingIndex = current.findIndex(
      (b) => b.id.trim().toUpperCase() === cleanId
    );

    const existing = existingIndex >= 0 ? current[existingIndex] : undefined;
    const normalized = normalizeBooking(booking, existing);

    let updated: BookingRecord[];
    if (existingIndex >= 0) {
      // In-place update to preserve ordering
      updated = [...current];
      updated[existingIndex] = normalized;
    } else {
      // Prepend newest booking
      updated = [normalized, ...current];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save customer booking to localStorage', err);
  }
}

/**
 * Removes a locally stored booking from this device.
 */
export function removeCustomerBooking(bookingId: string): void {
  if (typeof window === 'undefined' || !bookingId) return;
  try {
    const cleanId = bookingId.trim().toUpperCase();
    const current = getCustomerBookings();
    const updated = current.filter((b) => b.id.trim().toUpperCase() !== cleanId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to remove booking from localStorage', err);
  }
}

export const DEMO_BOOKINGS: BookingRecord[] = [
  {
    id: 'GM-229397',
    bookingId: 'GM-229397',
    status: 'In Progress',
    fullName: 'Aditya Varma',
    customerName: 'Aditya Varma',
    phoneNumber: '+91 98490 12345',
    phone: '+91 98490 12345',
    email: 'aditya.v@example.com',
    vehicle: 'BMW M3 Competition',
    vehicleMake: 'BMW',
    vehicleModel: 'M3 Competition',
    fuelType: 'Petrol',
    registrationNumber: 'TS 09 EG 4499',
    serviceCategory: 'brakes',
    specificService: 'Brake pad & rotor replacement',
    preferredDate: '2026-10-12',
    requestedDate: '2026-10-12',
    preferredTime: 'Morning (9:00 AM - 12:00 PM)',
    requestedTime: 'Morning (9:00 AM - 12:00 PM)',
    additionalMessage: 'Inspect front ceramic brake sensors.',
    serviceLocation: 'Workshop Visit',
    createdAt: '2026-10-07T09:30:00Z',
  },
  {
    id: 'GM-842910',
    bookingId: 'GM-842910',
    status: 'Confirmed',
    fullName: 'Rahul Sharma',
    customerName: 'Rahul Sharma',
    phoneNumber: '+91 98765 43210',
    phone: '+91 98765 43210',
    email: 'rahul@example.com',
    vehicle: 'Mercedes-Benz AMG GT',
    vehicleMake: 'Mercedes-Benz',
    vehicleModel: 'AMG GT',
    fuelType: 'Petrol',
    registrationNumber: 'TS 09 AB 1234',
    serviceCategory: 'engine-diagnostics',
    specificService: 'Computerised OBD / ECU diagnostics',
    preferredDate: '2026-10-15',
    requestedDate: '2026-10-15',
    preferredTime: 'Morning (9:00 AM - 12:00 PM)',
    requestedTime: 'Morning (9:00 AM - 12:00 PM)',
    additionalMessage: 'Check the slight knocking sound on cold starts.',
    serviceLocation: 'Doorstep Service',
    doorstepHouseFlat: 'Villa 42, Palm Meadows',
    doorstepStreetLocality: 'Jubilee Hills, Road No. 36',
    doorstepCity: 'Hyderabad',
    doorstepPincode: '500033',
    doorstepLatitude: 17.4319,
    doorstepLongitude: 78.4073,
    doorstepMapUrl: 'https://www.google.com/maps?q=17.4319,78.4073',
    createdAt: '2026-10-06T11:00:00Z',
  },
  {
    id: 'GM-551920',
    bookingId: 'GM-551920',
    status: 'Completed',
    fullName: 'Priya Reddy',
    customerName: 'Priya Reddy',
    phoneNumber: '+91 91234 56789',
    phone: '+91 91234 56789',
    email: 'priya.r@example.com',
    vehicle: 'Porsche Cayenne GTS',
    vehicleMake: 'Porsche',
    vehicleModel: 'Cayenne GTS',
    fuelType: 'Petrol',
    registrationNumber: 'TS 07 HK 9000',
    serviceCategory: 'general-service',
    specificService: 'Periodic / scheduled service',
    preferredDate: '2026-10-02',
    requestedDate: '2026-10-02',
    preferredTime: 'Afternoon (12:00 PM - 3:00 PM)',
    requestedTime: 'Afternoon (12:00 PM - 3:00 PM)',
    additionalMessage: '',
    serviceLocation: 'Workshop Visit',
    createdAt: '2026-09-28T14:15:00Z',
  },
];

/**
 * Finds a booking by ID across locally saved customer bookings (with demo fallback for verification).
 */
export function getBookingById(bookingId: string): BookingRecord | null {
  if (!bookingId) return null;
  const clean = bookingId.trim().toUpperCase();
  const customerBookings = getCustomerBookings();

  const match = customerBookings.find((b) => {
    const bId = b.id.toUpperCase();
    const strippedBId = bId.replace(/^GM-?/i, '');
    const strippedClean = clean.replace(/^GM-?/i, '');
    return bId === clean || (strippedBId && strippedBId === strippedClean);
  });

  if (match) return match;

  // Fallback check against demo records
  const demoMatch = DEMO_BOOKINGS.find((b) => {
    const bId = b.id.toUpperCase();
    const strippedBId = bId.replace(/^GM-?/i, '');
    const strippedClean = clean.replace(/^GM-?/i, '');
    return bId === clean || (strippedBId && strippedBId === strippedClean);
  });

  return demoMatch || null;
}

/**
 * Deprecated alias for getAllBookings (backward compatibility)
 */
export function getAllBookings(): BookingRecord[] {
  return getCustomerBookings();
}

