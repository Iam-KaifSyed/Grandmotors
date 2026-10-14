/**
 * Maps a raw D1 `bookings` row into the full admin-facing booking DTO.
 * Shared by the admin API endpoints so the shape stays consistent.
 *
 * NOTE: This returns the FULL record including PII. It must only be used behind
 * an authenticated admin check (header key or admin session).
 */
export function mapBookingRowForAdmin(row: any) {
  const serviceLocation = row.serviceLocation || 'Workshop Visit';
  const doorstepLatitude =
    row.doorstepLatitude !== null && row.doorstepLatitude !== undefined && row.doorstepLatitude !== ''
      ? Number(row.doorstepLatitude)
      : null;
  const doorstepLongitude =
    row.doorstepLongitude !== null && row.doorstepLongitude !== undefined && row.doorstepLongitude !== ''
      ? Number(row.doorstepLongitude)
      : null;

  let doorstepMapUrl = row.doorstepMapUrl || '';
  if (!doorstepMapUrl && doorstepLatitude !== null && doorstepLongitude !== null) {
    doorstepMapUrl = `https://www.google.com/maps?q=${doorstepLatitude},${doorstepLongitude}`;
  }

  return {
    id: row.id,
    bookingId: row.id,
    customerName: row.customerName,
    fullName: row.customerName,
    phoneNumber: row.phoneNumber,
    phone: row.phoneNumber,
    email: row.email || '',
    vehicleMake: row.vehicleMake,
    vehicleModel: row.vehicleModel,
    vehicle: `${row.vehicleMake ?? ''} ${row.vehicleModel ?? ''}`.trim(),
    fuelType: row.fuelType || '',
    registrationNumber: row.registrationNumber,
    serviceCategory: row.serviceCategory,
    specificService: row.specificService || '',
    preferredDate: row.preferredDate,
    requestedDate: row.preferredDate,
    preferredTime: row.preferredTime,
    requestedTime: row.preferredTime,
    status: row.status,
    additionalMessage: row.additionalMessage || '',
    serviceLocation,
    doorstepHouseFlat: row.doorstepHouseFlat || '',
    doorstepStreetLocality: row.doorstepStreetLocality || '',
    doorstepCity: row.doorstepCity || '',
    doorstepPincode: row.doorstepPincode || '',
    doorstepLatitude,
    doorstepLongitude,
    doorstepMapUrl,
    source: row.source ? row.source : 'Unknown',
    createdAt: row.createdAt,
  };
}

export type AdminBooking = ReturnType<typeof mapBookingRowForAdmin>;
