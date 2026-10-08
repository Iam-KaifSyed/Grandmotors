export interface Booking {
  id: string;
  status: 'Pending' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled';
  fullName: string;
  phoneNumber: string;
  email: string;
  vehicleMake: string;
  vehicleModel: string;
  registrationNumber: string;
  serviceCategory: string;
  specificService: string;
  preferredDate: string;
  preferredTime: string;
  additionalMessage: string;
  createdAt: string;
}

export const INITIAL_MOCK_BOOKINGS: Booking[] = [
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
    preferredDate: '2027-11-15',
    preferredTime: 'Morning (9:00 AM - 12:00 PM)',
    additionalMessage: 'Check the slight knocking sound on cold starts.',
    createdAt: '2026-10-01T10:00:00Z',
  },
  {
    id: 'GM-112233',
    status: 'Completed',
    fullName: 'Rahul Sharma',
    phoneNumber: '+91 98765 43210',
    email: 'rahul@example.com',
    vehicleMake: 'Mercedes-Benz',
    vehicleModel: 'AMG GT',
    registrationNumber: 'TS 09 AB 1234',
    serviceCategory: 'general-service',
    specificService: 'Periodic / scheduled service',
    preferredDate: '2025-05-10',
    preferredTime: 'Afternoon (12:00 PM - 3:00 PM)',
    additionalMessage: '',
    createdAt: '2025-05-01T14:30:00Z',
  },
];

const STORAGE_KEY = 'grandmotors_bookings';

export function getAllBookings(): Booking[] {
  if (typeof window === 'undefined') {
    return INITIAL_MOCK_BOOKINGS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_BOOKINGS));
      return INITIAL_MOCK_BOOKINGS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_MOCK_BOOKINGS;
  } catch (err) {
    console.error('Error reading bookings from localStorage', err);
    return INITIAL_MOCK_BOOKINGS;
  }
}

export function saveBooking(booking: Booking): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getAllBookings();
    const updated = [
      booking,
      ...current.filter((b) => b.id.toUpperCase() !== booking.id.toUpperCase()),
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving booking to localStorage', err);
  }
}

export interface VerificationResult {
  bookings: Booking[];
  matchedBooking?: Booking;
  error?: string;
}

export function verifyAndFetchBookings(refInput: string, phoneInput: string): VerificationResult {
  const cleanRef = refInput.trim().toUpperCase();
  const cleanPhone = phoneInput.replace(/\D/g, '');

  if (!cleanRef && !cleanPhone) {
    return { bookings: [], error: 'Please enter your Booking Reference and Phone Number.' };
  }

  // Explicit demo empty state keyword support
  if (cleanPhone === '000' || phoneInput.trim().toLowerCase() === 'empty') {
    return { bookings: [] };
  }

  const allBookings = getAllBookings();

  // Find by ID match (support 'GM-842910', 'GM842910', '842910')
  const matchedById = allBookings.find((b) => {
    const bId = b.id.toUpperCase();
    const strippedBId = bId.replace(/^GM-?/i, '');
    const strippedRef = cleanRef.replace(/^GM-?/i, '');
    return bId === cleanRef || strippedBId === strippedRef;
  });

  if (!matchedById) {
    return {
      bookings: [],
      error: `No booking record found for reference "${refInput.trim()}". Please verify your Booking ID.`,
    };
  }

  // Check phone number match
  if (cleanPhone) {
    const bPhoneDigits = matchedById.phoneNumber.replace(/\D/g, '');
    const last10Input = cleanPhone.slice(-10);
    const last10Booking = bPhoneDigits.slice(-10);

    // If both have at least 5 digits, check if they match
    if (last10Input.length >= 5 && last10Booking.length >= 5) {
      if (last10Booking !== last10Input && !bPhoneDigits.includes(cleanPhone) && !cleanPhone.includes(bPhoneDigits)) {
        return {
          bookings: [],
          error: 'The provided phone number does not match the registered contact for this booking reference.',
        };
      }
    }
  }

  // Find all bookings associated with this customer phone number or this booking ID
  const bPhoneDigits = matchedById.phoneNumber.replace(/\D/g, '').slice(-10);
  const customerBookings = allBookings.filter((b) => {
    if (b.id.toUpperCase() === matchedById.id.toUpperCase()) return true;
    if (bPhoneDigits.length >= 5) {
      const otherPhoneDigits = b.phoneNumber.replace(/\D/g, '').slice(-10);
      return otherPhoneDigits === bPhoneDigits;
    }
    return false;
  });

  return {
    bookings: customerBookings.length > 0 ? customerBookings : [matchedById],
    matchedBooking: matchedById,
  };
}
