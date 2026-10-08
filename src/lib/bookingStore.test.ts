import { describe, it, expect, beforeEach } from 'vitest';
import {
  getCustomerBookings,
  saveBookingRecord,
  getBookingById,
  removeCustomerBooking,
  type BookingRecord,
} from './bookingStore';

// In-memory mock for localStorage in Node test environment
const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = String(value);
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    for (const k in mockStorage) {
      delete mockStorage[k];
    }
  },
};

// Set up window / localStorage globals for testing
// @ts-ignore
globalThis.window = globalThis;
// @ts-ignore
globalThis.localStorage = localStorageMock;

describe('Customer Booking Store (localStorage)', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('returns empty array when no customer bookings are stored', () => {
    expect(getCustomerBookings()).toEqual([]);
  });

  it('saves a booking and normalizes fields correctly', () => {
    const booking: BookingRecord = {
      id: 'GM-102938',
      fullName: 'Vikram Mehta',
      phoneNumber: '+91 98765 00000',
      vehicleMake: 'BMW',
      vehicleModel: 'M3',
      registrationNumber: 'TS 09 AB 9999',
      serviceCategory: 'brakes',
      specificService: 'Brake pad & disc replacement',
      preferredDate: '2026-10-20',
      preferredTime: 'Morning (9:00 AM - 12:00 PM)',
      status: 'Pending',
      createdAt: '2026-10-09T00:00:00Z',
    };

    saveBookingRecord(booking);

    const stored = getCustomerBookings();
    expect(stored.length).toBe(1);
    expect(stored[0].id).toBe('GM-102938');
    expect(stored[0].bookingId).toBe('GM-102938');
    expect(stored[0].customerName).toBe('Vikram Mehta');
    expect(stored[0].vehicle).toBe('BMW M3');
    expect(stored[0].phone).toBe('+91 98765 00000');
    expect(stored[0].requestedDate).toBe('2026-10-20');
  });

  it('supports multiple bookings and places newest first', () => {
    saveBookingRecord({
      id: 'GM-111111',
      fullName: 'User 1',
      phoneNumber: '111',
      vehicleMake: 'Audi',
      vehicleModel: 'A6',
      registrationNumber: 'TS01',
      serviceCategory: 'engine-diagnostics',
      preferredDate: '2026-10-10',
      preferredTime: 'Morning',
      status: 'Pending',
      createdAt: '2026-10-01',
    });

    saveBookingRecord({
      id: 'GM-222222',
      fullName: 'User 2',
      phoneNumber: '222',
      vehicleMake: 'Porsche',
      vehicleModel: '911',
      registrationNumber: 'TS02',
      serviceCategory: 'brakes',
      preferredDate: '2026-10-12',
      preferredTime: 'Afternoon',
      status: 'Confirmed',
      createdAt: '2026-10-02',
    });

    const stored = getCustomerBookings();
    expect(stored.length).toBe(2);
    expect(stored[0].id).toBe('GM-222222');
    expect(stored[1].id).toBe('GM-111111');
  });

  it('prevents duplicate entries when saving with the same booking ID', () => {
    saveBookingRecord({
      id: 'GM-333333',
      fullName: 'Original Name',
      phoneNumber: '333',
      vehicleMake: 'Mercedes',
      vehicleModel: 'C200',
      registrationNumber: 'TS03',
      serviceCategory: 'general-service',
      preferredDate: '2026-10-14',
      preferredTime: 'Morning',
      status: 'Pending',
      createdAt: '2026-10-01',
    });

    // Update with same ID
    saveBookingRecord({
      id: 'GM-333333',
      fullName: 'Updated Name',
      phoneNumber: '333',
      vehicleMake: 'Mercedes',
      vehicleModel: 'C200',
      registrationNumber: 'TS03',
      serviceCategory: 'general-service',
      preferredDate: '2026-10-14',
      preferredTime: 'Morning',
      status: 'Confirmed',
      createdAt: '2026-10-01',
    });

    const stored = getCustomerBookings();
    expect(stored.length).toBe(1);
    expect(stored[0].customerName).toBe('Updated Name');
    expect(stored[0].status).toBe('Confirmed');
  });

  it('retrieves booking by ID (case-insensitive and prefix tolerant)', () => {
    saveBookingRecord({
      id: 'GM-445566',
      fullName: 'Test Person',
      phoneNumber: '444',
      vehicleMake: 'Jaguar',
      vehicleModel: 'F-Pace',
      registrationNumber: 'TS04',
      serviceCategory: 'ac-electrical',
      preferredDate: '2026-10-18',
      preferredTime: 'Evening',
      status: 'In Progress',
      createdAt: '2026-10-03',
    });

    expect(getBookingById('GM-445566')?.fullName).toBe('Test Person');
    expect(getBookingById('gm-445566')?.fullName).toBe('Test Person');
    expect(getBookingById('445566')?.fullName).toBe('Test Person');
    expect(getBookingById('NONEXISTENT')).toBeNull();
  });

  it('removes a booking by ID', () => {
    saveBookingRecord({
      id: 'GM-777777',
      fullName: 'Remove Me',
      phoneNumber: '777',
      vehicleMake: 'Volvo',
      vehicleModel: 'XC90',
      registrationNumber: 'TS07',
      serviceCategory: 'tyres-alignment',
      preferredDate: '2026-10-19',
      preferredTime: 'Morning',
      status: 'Pending',
      createdAt: '2026-10-04',
    });

    expect(getCustomerBookings().length).toBe(1);
    removeCustomerBooking('GM-777777');
    expect(getCustomerBookings().length).toBe(0);
  });
});
