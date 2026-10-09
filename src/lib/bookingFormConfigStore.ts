import { recordAuditEvent } from './auditLog';

export interface CustomQuestion {
  id: string;
  label: string;
  required?: boolean;
}

export interface BookingFormConfig {
  heading: string;
  supportingText: string;
  fieldLabels: Record<string, string>;
  optionalFieldVisibility: Record<string, boolean>;
  customQuestions: CustomQuestion[];
  confirmationMessage: string;
  appointmentSlots: string[];
  bookingWindow: {
    minLeadDays?: number;
    maxAdvanceDays?: number;
  };
  updatedAt?: string;
  updatedBy?: string | null;
}

/**
 * Essential fields that cannot be removed, hidden, or made optional.
 */
export const ESSENTIAL_FIELDS = [
  'fullName',
  'customerName',
  'phoneNumber',
  'vehicleMake',
  'vehicleModel',
  'registrationNumber',
  'serviceCategory',
  'preferredDate',
  'preferredTime',
] as const;

export const DEFAULT_BOOKING_FORM_CONFIG: BookingFormConfig = {
  heading: 'Book Your Service',
  supportingText: "Schedule your service. We'll contact you shortly to confirm the details and time.",
  fieldLabels: {
    fullName: 'Full Name',
    phoneNumber: 'Phone Number',
    email: 'Email Address',
    vehicleMake: 'Make',
    vehicleModel: 'Model',
    registrationNumber: 'Registration No.',
    serviceCategory: 'Service Category',
    specificService: 'Specific Service / Work',
    preferredDate: 'Preferred Date',
    preferredTime: 'Preferred Time Slot',
    additionalMessage: 'Additional Notes / Special Instructions',
  },
  optionalFieldVisibility: {
    email: true,
    specificService: true,
    additionalMessage: true,
  },
  customQuestions: [],
  confirmationMessage:
    'Thank you for booking with Grand Motors. Our workshop team will review the requirements and contact you to confirm your appointment.',
  appointmentSlots: [
    'Morning (9:00 AM - 12:00 PM)',
    'Afternoon (12:00 PM - 3:00 PM)',
    'Evening (3:00 PM - 6:00 PM)',
    'Flexible / Any Time',
  ],
  bookingWindow: {
    minLeadDays: 0,
    maxAdvanceDays: 60,
  },
};

/**
 * Load booking form config from D1.
 */
export async function getBookingFormConfig(db: any): Promise<BookingFormConfig | null> {
  if (!db) return null;

  const row = await db
    .prepare('SELECT * FROM booking_form_config WHERE key = ?')
    .bind('default')
    .first();

  if (!row) return null;

  let fieldLabels = DEFAULT_BOOKING_FORM_CONFIG.fieldLabels;
  let optionalFieldVisibility = DEFAULT_BOOKING_FORM_CONFIG.optionalFieldVisibility;
  let customQuestions = DEFAULT_BOOKING_FORM_CONFIG.customQuestions;
  let appointmentSlots = DEFAULT_BOOKING_FORM_CONFIG.appointmentSlots;
  let bookingWindow = DEFAULT_BOOKING_FORM_CONFIG.bookingWindow;

  try {
    if (row.fieldLabelsJson) fieldLabels = { ...fieldLabels, ...JSON.parse(row.fieldLabelsJson) };
    if (row.optionalFieldVisibilityJson)
      optionalFieldVisibility = { ...optionalFieldVisibility, ...JSON.parse(row.optionalFieldVisibilityJson) };
    if (row.customQuestionsJson) customQuestions = JSON.parse(row.customQuestionsJson);
    if (row.appointmentSlotsJson) appointmentSlots = JSON.parse(row.appointmentSlotsJson);
    if (row.bookingWindowJson) bookingWindow = JSON.parse(row.bookingWindowJson);
  } catch (e) {
    console.warn('Error parsing booking form config json fields:', e);
  }

  return {
    heading: row.heading || DEFAULT_BOOKING_FORM_CONFIG.heading,
    supportingText: row.supportingText || DEFAULT_BOOKING_FORM_CONFIG.supportingText,
    fieldLabels,
    optionalFieldVisibility,
    customQuestions,
    confirmationMessage: row.confirmationMessage || DEFAULT_BOOKING_FORM_CONFIG.confirmationMessage,
    appointmentSlots,
    bookingWindow,
    updatedAt: row.updatedAt,
    updatedBy: row.updatedBy,
  };
}

/**
 * Safe fallback for booking form config.
 */
export async function getBookingFormConfigOrDefault(db: any): Promise<BookingFormConfig> {
  try {
    const cfg = await getBookingFormConfig(db);
    if (cfg) return cfg;
  } catch (err) {
    console.warn('Fallback: Error reading booking form config:', err);
  }
  return DEFAULT_BOOKING_FORM_CONFIG;
}

/**
 * Update booking form config with essential-field protection.
 */
export async function updateBookingFormConfig(
  db: any,
  config: Partial<BookingFormConfig>,
  actorAdmin = 'admin'
): Promise<BookingFormConfig> {
  // Validate Essential Fields protection
  if (config.optionalFieldVisibility) {
    for (const essential of ESSENTIAL_FIELDS) {
      if ((config.optionalFieldVisibility as any)[essential] === false) {
        const err: any = new Error(
          `Essential field '${essential}' cannot be hidden or disabled.`
        );
        err.status = 422;
        throw err;
      }
    }
  }

  const existing = (await getBookingFormConfig(db)) || DEFAULT_BOOKING_FORM_CONFIG;

  const merged: BookingFormConfig = {
    heading: config.heading !== undefined ? config.heading : existing.heading,
    supportingText:
      config.supportingText !== undefined ? config.supportingText : existing.supportingText,
    fieldLabels: { ...existing.fieldLabels, ...(config.fieldLabels || {}) },
    optionalFieldVisibility: {
      ...existing.optionalFieldVisibility,
      ...(config.optionalFieldVisibility || {}),
    },
    customQuestions:
      config.customQuestions !== undefined ? config.customQuestions : existing.customQuestions,
    confirmationMessage:
      config.confirmationMessage !== undefined
        ? config.confirmationMessage
        : existing.confirmationMessage,
    appointmentSlots:
      config.appointmentSlots !== undefined ? config.appointmentSlots : existing.appointmentSlots,
    bookingWindow: { ...existing.bookingWindow, ...(config.bookingWindow || {}) },
  };

  await db
    .prepare(
      `INSERT INTO booking_form_config (
        key, heading, supportingText, fieldLabelsJson, optionalFieldVisibilityJson,
        customQuestionsJson, confirmationMessage, appointmentSlotsJson, bookingWindowJson,
        updatedAt, updatedBy
      ) VALUES ('default', ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
      ON CONFLICT(key) DO UPDATE SET
        heading = excluded.heading,
        supportingText = excluded.supportingText,
        fieldLabelsJson = excluded.fieldLabelsJson,
        optionalFieldVisibilityJson = excluded.optionalFieldVisibilityJson,
        customQuestionsJson = excluded.customQuestionsJson,
        confirmationMessage = excluded.confirmationMessage,
        appointmentSlotsJson = excluded.appointmentSlotsJson,
        bookingWindowJson = excluded.bookingWindowJson,
        updatedAt = datetime('now'),
        updatedBy = excluded.updatedBy`
    )
    .bind(
      merged.heading,
      merged.supportingText,
      JSON.stringify(merged.fieldLabels),
      JSON.stringify(merged.optionalFieldVisibility),
      JSON.stringify(merged.customQuestions),
      merged.confirmationMessage,
      JSON.stringify(merged.appointmentSlots),
      JSON.stringify(merged.bookingWindow),
      actorAdmin
    )
    .run();

  await recordAuditEvent(db, {
    entityType: 'booking_form_config',
    entityId: 'default',
    action: 'update',
    actorAdmin,
    summary: config,
  });

  return {
    ...merged,
    updatedAt: new Date().toISOString(),
    updatedBy: actorAdmin,
  };
}
