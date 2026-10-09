/**
 * Helper utilities for identifying repeat customers across bookings.
 *
 * Matching rules:
 * - Phone numbers are matched after normalizing formatting (removing spaces, dashes,
 *   parentheses, and standardizing country prefix / 10-digit formats).
 * - Emails are matched case-insensitively and trimmed.
 * - Missing or empty emails/phones are safely ignored and never matched with each other.
 * - Bookings are grouped transitively (if B1 shares phone with B2, and B2 shares email with B3,
 *   they are recognized as the same repeat customer).
 */

export interface BookingMatchInput {
  id: string;
  phoneNumber?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface RepeatCustomerInfo {
  bookingId: string;
  isRepeatCustomer: boolean;
  totalBookingCount: number;
  otherBookingIds: string[];
}

/**
 * Normalizes phone numbers to standard digit strings for accurate matching.
 * Handles country prefixes (+91, 091, 0) for 10-digit mobile numbers as well
 * as general digit stripping.
 */
export function normalizePhoneNumber(rawPhone?: string | null): string {
  if (!rawPhone || typeof rawPhone !== 'string') return '';
  const trimmed = rawPhone.trim();
  if (!trimmed || trimmed === '—' || trimmed === 'N/A') return '';

  // Extract all digit characters
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 5) return '';

  // Standardize 10-digit Indian numbers with country/trunk prefixes
  if (digits.length === 10) {
    return digits;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 13 && digits.startsWith('091')) {
    return digits.slice(3);
  }

  return digits;
}

/**
 * Normalizes email addresses by trimming and lowercasing.
 * Safely ignores missing, empty, or placeholder emails.
 */
export function normalizeEmail(rawEmail?: string | null): string {
  if (!rawEmail || typeof rawEmail !== 'string') return '';
  const trimmed = rawEmail.trim().toLowerCase();
  if (!trimmed || trimmed === '—' || trimmed === 'n/a' || !trimmed.includes('@')) {
    return '';
  }
  return trimmed;
}

/**
 * Identifies repeat customers across a list of bookings and calculates
 * the total booking count and links to other Booking IDs for each booking.
 */
export function calculateRepeatCustomers<T extends BookingMatchInput>(
  bookings: T[]
): Map<string, RepeatCustomerInfo> {
  const result = new Map<string, RepeatCustomerInfo>();
  if (!bookings || bookings.length === 0) {
    return result;
  }

  const n = bookings.length;
  // Adjacency list for graph components
  const adj: number[][] = Array.from({ length: n }, () => []);

  // Map normalized keys to list of booking indices
  const phoneIndexMap = new Map<string, number[]>();
  const emailIndexMap = new Map<string, number[]>();

  bookings.forEach((b, idx) => {
    const rawPhone = b.phoneNumber || b.phone || '';
    const normPhone = normalizePhoneNumber(rawPhone);
    if (normPhone) {
      if (!phoneIndexMap.has(normPhone)) {
        phoneIndexMap.set(normPhone, []);
      }
      phoneIndexMap.get(normPhone)!.push(idx);
    }

    const normEmail = normalizeEmail(b.email);
    if (normEmail) {
      if (!emailIndexMap.has(normEmail)) {
        emailIndexMap.set(normEmail, []);
      }
      emailIndexMap.get(normEmail)!.push(idx);
    }
  });

  // Build edges for shared phone
  phoneIndexMap.forEach((indices) => {
    if (indices.length > 1) {
      const first = indices[0];
      for (let i = 1; i < indices.length; i++) {
        const other = indices[i];
        adj[first].push(other);
        adj[other].push(first);
      }
    }
  });

  // Build edges for shared email
  emailIndexMap.forEach((indices) => {
    if (indices.length > 1) {
      const first = indices[0];
      for (let i = 1; i < indices.length; i++) {
        const other = indices[i];
        adj[first].push(other);
        adj[other].push(first);
      }
    }
  });

  // Find connected components using BFS
  const visited = new Array(n).fill(false);

  for (let i = 0; i < n; i++) {
    if (visited[i]) continue;

    const componentIndices: number[] = [];
    const queue: number[] = [i];
    visited[i] = true;

    while (queue.length > 0) {
      const curr = queue.shift()!;
      componentIndices.push(curr);

      for (const neighbor of adj[curr]) {
        if (!visited[neighbor]) {
          visited[neighbor] = true;
          queue.push(neighbor);
        }
      }
    }

    // Collect all booking IDs in this component
    const allIdsInComponent = componentIndices.map((idx) => bookings[idx].id);
    const totalCount = allIdsInComponent.length;
    const isRepeat = totalCount > 1;

    // Assign repeat info for each booking in the component
    componentIndices.forEach((idx) => {
      const currentBooking = bookings[idx];
      const otherIds = allIdsInComponent.filter((id) => id !== currentBooking.id);

      result.set(currentBooking.id, {
        bookingId: currentBooking.id,
        isRepeatCustomer: isRepeat,
        totalBookingCount: totalCount,
        otherBookingIds: otherIds,
      });
    });
  }

  return result;
}
