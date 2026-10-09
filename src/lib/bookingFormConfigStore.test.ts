import { describe, it, expect, beforeEach } from 'vitest';
import { createTestD1Database } from './testDbHelper';
import {
  getBookingFormConfig,
  getBookingFormConfigOrDefault,
  updateBookingFormConfig,
  DEFAULT_BOOKING_FORM_CONFIG,
} from './bookingFormConfigStore';

describe('bookingFormConfigStore & Essential Fields Protection', () => {
  let db: any;

  beforeEach(() => {
    db = createTestD1Database();
  });

  it('reads seeded default booking form config', async () => {
    const config = await getBookingFormConfig(db);
    expect(config).toBeDefined();
    expect(config?.heading).toBe('Book Your Service');
    expect(config?.fieldLabels.fullName).toBe('Full Name');
    expect(config?.appointmentSlots.length).toBeGreaterThan(0);
  });

  it('updates labels and adds custom questions', async () => {
    const updated = await updateBookingFormConfig(
      db,
      {
        heading: 'Schedule Premium Maintenance',
        fieldLabels: { fullName: 'Customer Full Name' },
        customQuestions: [{ id: 'q1', label: 'Doorstep pickup requested?' }],
      },
      'admin'
    );

    expect(updated.heading).toBe('Schedule Premium Maintenance');
    expect(updated.fieldLabels.fullName).toBe('Customer Full Name');
    expect(updated.customQuestions).toEqual([
      { id: 'q1', label: 'Doorstep pickup requested?' },
    ]);

    const reloaded = await getBookingFormConfig(db);
    expect(reloaded?.heading).toBe('Schedule Premium Maintenance');
  });

  it('strictly rejects attempts to hide or disable essential fields (422)', async () => {
    await expect(
      updateBookingFormConfig(
        db,
        {
          optionalFieldVisibility: {
            phoneNumber: false,
          } as any,
        },
        'admin'
      )
    ).rejects.toMatchObject({
      status: 422,
    });
  });

  it('returns fallback default config when DB is empty or fails', async () => {
    const fallback = await getBookingFormConfigOrDefault(null);
    expect(fallback.heading).toBe(DEFAULT_BOOKING_FORM_CONFIG.heading);
  });
});
