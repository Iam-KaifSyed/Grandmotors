import { describe, it, expect } from 'vitest';
import {
  normalizePhoneNumber,
  normalizeEmail,
  calculateRepeatCustomers,
} from './customerMatching';

describe('Customer Matching & Repeat Customer Identification', () => {
  describe('normalizePhoneNumber', () => {
    it('normalizes various phone number formatting styles for 10-digit numbers', () => {
      expect(normalizePhoneNumber('+91 98490 12345')).toBe('9849012345');
      expect(normalizePhoneNumber('98490 12345')).toBe('9849012345');
      expect(normalizePhoneNumber('98490-12345')).toBe('9849012345');
      expect(normalizePhoneNumber('(98490) 12345')).toBe('9849012345');
      expect(normalizePhoneNumber('+91-98490-12345')).toBe('9849012345');
      expect(normalizePhoneNumber('09849012345')).toBe('9849012345');
      expect(normalizePhoneNumber('+919849012345')).toBe('9849012345');
      expect(normalizePhoneNumber('  9849012345  ')).toBe('9849012345');
    });

    it('handles international numbers or non-10 digit numbers safely', () => {
      expect(normalizePhoneNumber('+1 (555) 234-5678')).toBe('15552345678');
      expect(normalizePhoneNumber('447700900077')).toBe('447700900077');
    });

    it('returns empty string for missing, empty, or short invalid phone numbers', () => {
      expect(normalizePhoneNumber('')).toBe('');
      expect(normalizePhoneNumber('   ')).toBe('');
      expect(normalizePhoneNumber(null)).toBe('');
      expect(normalizePhoneNumber(undefined)).toBe('');
      expect(normalizePhoneNumber('—')).toBe('');
      expect(normalizePhoneNumber('N/A')).toBe('');
      expect(normalizePhoneNumber('123')).toBe(''); // too short to match
    });
  });

  describe('normalizeEmail', () => {
    it('normalizes email addresses case-insensitively with trimming', () => {
      expect(normalizeEmail('John.Doe@Example.com')).toBe('john.doe@example.com');
      expect(normalizeEmail('  ALICE@GMAIL.COM  ')).toBe('alice@gmail.com');
      expect(normalizeEmail('Customer@sub.domain.co.in')).toBe('customer@sub.domain.co.in');
    });

    it('returns empty string for missing, empty, or invalid email formats', () => {
      expect(normalizeEmail('')).toBe('');
      expect(normalizeEmail('   ')).toBe('');
      expect(normalizeEmail(null)).toBe('');
      expect(normalizeEmail(undefined)).toBe('');
      expect(normalizeEmail('—')).toBe('');
      expect(normalizeEmail('n/a')).toBe('');
      expect(normalizeEmail('no-email-at-all')).toBe('');
    });
  });

  describe('calculateRepeatCustomers', () => {
    it('identifies repeat customers sharing the same phone number with different formatting', () => {
      const bookings = [
        {
          id: 'GM-101',
          phoneNumber: '+91 98490 12345',
          email: 'aditya@example.com',
        },
        {
          id: 'GM-102',
          phoneNumber: '98490-12345',
          email: 'aditya.work@company.com',
        },
        {
          id: 'GM-103',
          phoneNumber: '+91 99999 88888',
          email: 'someone.else@example.com',
        },
      ];

      const result = calculateRepeatCustomers(bookings);

      const b101 = result.get('GM-101');
      expect(b101).toBeDefined();
      expect(b101?.isRepeatCustomer).toBe(true);
      expect(b101?.totalBookingCount).toBe(2);
      expect(b101?.otherBookingIds).toEqual(['GM-102']);

      const b102 = result.get('GM-102');
      expect(b102).toBeDefined();
      expect(b102?.isRepeatCustomer).toBe(true);
      expect(b102?.totalBookingCount).toBe(2);
      expect(b102?.otherBookingIds).toEqual(['GM-101']);

      const b103 = result.get('GM-103');
      expect(b103).toBeDefined();
      expect(b103?.isRepeatCustomer).toBe(false);
      expect(b103?.totalBookingCount).toBe(1);
      expect(b103?.otherBookingIds).toEqual([]);
    });

    it('identifies repeat customers sharing the same email address case-insensitively', () => {
      const bookings = [
        {
          id: 'GM-201',
          phoneNumber: '+91 91111 11111',
          email: 'Priya.Reddy@Domain.COM',
        },
        {
          id: 'GM-202',
          phoneNumber: '+91 92222 22222',
          email: 'priya.reddy@domain.com',
        },
      ];

      const result = calculateRepeatCustomers(bookings);

      const b201 = result.get('GM-201');
      expect(b201?.isRepeatCustomer).toBe(true);
      expect(b201?.totalBookingCount).toBe(2);
      expect(b201?.otherBookingIds).toEqual(['GM-202']);

      const b202 = result.get('GM-202');
      expect(b202?.isRepeatCustomer).toBe(true);
      expect(b202?.totalBookingCount).toBe(2);
      expect(b202?.otherBookingIds).toEqual(['GM-201']);
    });

    it('does not falsely match different customers who have distinct phone numbers and emails', () => {
      const bookings = [
        {
          id: 'GM-301',
          phoneNumber: '+91 98765 11111',
          email: 'cust1@example.com',
        },
        {
          id: 'GM-302',
          phoneNumber: '+91 98765 22222',
          email: 'cust2@example.com',
        },
        {
          id: 'GM-303',
          phoneNumber: '+91 98765 33333',
          email: 'cust3@example.com',
        },
      ];

      const result = calculateRepeatCustomers(bookings);

      bookings.forEach((b) => {
        const info = result.get(b.id);
        expect(info?.isRepeatCustomer).toBe(false);
        expect(info?.totalBookingCount).toBe(1);
        expect(info?.otherBookingIds).toEqual([]);
      });
    });

    it('handles bookings without email safely and does NOT match multiple bookings with missing emails', () => {
      const bookings = [
        {
          id: 'GM-401',
          phoneNumber: '+91 94444 11111',
          email: '', // missing email
        },
        {
          id: 'GM-402',
          phoneNumber: '+91 95555 22222',
          email: undefined, // undefined email
        },
        {
          id: 'GM-403',
          phoneNumber: '+91 96666 33333',
          email: '   ', // whitespace email
        },
        {
          id: 'GM-404',
          phoneNumber: '+91 97777 44444',
          email: null, // null email
        },
      ];

      const result = calculateRepeatCustomers(bookings);

      bookings.forEach((b) => {
        const info = result.get(b.id);
        expect(info?.isRepeatCustomer).toBe(false);
        expect(info?.totalBookingCount).toBe(1);
        expect(info?.otherBookingIds).toEqual([]);
      });
    });

    it('matches bookings without email if they share the same phone number', () => {
      const bookings = [
        {
          id: 'GM-501',
          phoneNumber: '+91 98490 99999',
          email: '',
        },
        {
          id: 'GM-502',
          phoneNumber: '98490 99999',
          email: undefined,
        },
      ];

      const result = calculateRepeatCustomers(bookings);

      const b501 = result.get('GM-501');
      expect(b501?.isRepeatCustomer).toBe(true);
      expect(b501?.totalBookingCount).toBe(2);
      expect(b501?.otherBookingIds).toEqual(['GM-502']);

      const b502 = result.get('GM-502');
      expect(b502?.isRepeatCustomer).toBe(true);
      expect(b502?.totalBookingCount).toBe(2);
      expect(b502?.otherBookingIds).toEqual(['GM-501']);
    });

    it('transitively clusters multiple bookings when customer used alternating contact details', () => {
      // B1 and B2 share phone
      // B2 and B3 share email
      // All 3 should be recognized as the same customer group
      const bookings = [
        {
          id: 'GM-601',
          phoneNumber: '+91 98888 12345',
          email: 'email1@example.com',
        },
        {
          id: 'GM-602',
          phoneNumber: '+91 98888 12345', // matches B1
          email: 'email2@example.com',
        },
        {
          id: 'GM-603',
          phoneNumber: '+91 97777 99999',
          email: 'Email2@Example.COM', // matches B2
        },
      ];

      const result = calculateRepeatCustomers(bookings);

      const b601 = result.get('GM-601');
      expect(b601?.isRepeatCustomer).toBe(true);
      expect(b601?.totalBookingCount).toBe(3);
      expect(b601?.otherBookingIds).toContain('GM-602');
      expect(b601?.otherBookingIds).toContain('GM-603');
      expect(b601?.otherBookingIds.length).toBe(2);

      const b602 = result.get('GM-602');
      expect(b602?.totalBookingCount).toBe(3);
      expect(b602?.otherBookingIds).toContain('GM-601');
      expect(b602?.otherBookingIds).toContain('GM-603');

      const b603 = result.get('GM-603');
      expect(b603?.totalBookingCount).toBe(3);
      expect(b603?.otherBookingIds).toContain('GM-601');
      expect(b603?.otherBookingIds).toContain('GM-602');
    });

    it('handles empty bookings list safely', () => {
      const result = calculateRepeatCustomers([]);
      expect(result.size).toBe(0);
    });

    it('handles a single booking safely', () => {
      const result = calculateRepeatCustomers([
        { id: 'GM-001', phoneNumber: '+91 98490 12345', email: 'test@example.com' },
      ]);
      expect(result.size).toBe(1);
      const info = result.get('GM-001');
      expect(info?.isRepeatCustomer).toBe(false);
      expect(info?.totalBookingCount).toBe(1);
      expect(info?.otherBookingIds).toEqual([]);
    });
  });
});
