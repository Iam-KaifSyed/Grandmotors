-- Seed Media Assets (Builtin and External)
INSERT OR IGNORE INTO media_assets (id, filename, source, publicUrl, mimeType, width, height, byteSize, createdAt, createdBy)
VALUES
  ('builtin-services-hero', 'services-hero.jpg', 'builtin', '/images/services-hero.jpg', 'image/jpeg', 1920, 1080, NULL, CURRENT_TIMESTAMP, 'system'),
  ('builtin-services-cta', 'services-cta.jpg', 'external', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=2000&q=80', 'image/jpeg', 2000, 1333, NULL, CURRENT_TIMESTAMP, 'system'),
  ('builtin-service-engine-diagnostics', 'service-engine.jpg', 'external', 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1200&q=80', 'image/jpeg', 1200, 800, NULL, CURRENT_TIMESTAMP, 'system'),
  ('builtin-service-brakes', 'service-brakes.jpg', 'builtin', '/images/service-brakes.jpg', 'image/jpeg', 1200, 800, NULL, CURRENT_TIMESTAMP, 'system'),
  ('builtin-service-tyres-alignment', 'service-tyres.jpeg', 'builtin', '/images/service-tyres.jpeg', 'image/jpeg', 1200, 800, NULL, CURRENT_TIMESTAMP, 'system'),
  ('builtin-service-ac-electrical', 'service-ac-electrical.jpg', 'builtin', '/images/service-ac-electrical.jpg', 'image/jpeg', 1200, 800, NULL, CURRENT_TIMESTAMP, 'system'),
  ('builtin-service-suspension-steering', 'service-suspension.jpg', 'builtin', '/images/service-suspension.jpg', 'image/jpeg', 1200, 800, NULL, CURRENT_TIMESTAMP, 'system'),
  ('builtin-service-general-service', 'service-general.jpg', 'builtin', '/images/service-general.jpg', 'image/jpeg', 1200, 800, NULL, CURRENT_TIMESTAMP, 'system'),
  ('builtin-service-body-paint', 'service-body-paint.jpg', 'external', 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=1200&q=80', 'image/jpeg', 1200, 800, NULL, CURRENT_TIMESTAMP, 'system'),
  ('builtin-service-detailing-interior', 'service-detailing.jpg', 'builtin', '/images/service-detailing.jpg', 'image/jpeg', 1200, 800, NULL, CURRENT_TIMESTAMP, 'system');

-- Seed Media References (Fixed Usage Locations)
INSERT OR IGNORE INTO media_references (id, usageLocation, mediaAssetId, updatedAt, updatedBy)
VALUES
  ('ref-services-hero', 'services-hero', 'builtin-services-hero', CURRENT_TIMESTAMP, 'system'),
  ('ref-services-cta', 'services-cta', 'builtin-services-cta', CURRENT_TIMESTAMP, 'system'),
  ('ref-service-engine-diagnostics', 'service-engine-diagnostics', 'builtin-service-engine-diagnostics', CURRENT_TIMESTAMP, 'system'),
  ('ref-service-brakes', 'service-brakes', 'builtin-service-brakes', CURRENT_TIMESTAMP, 'system'),
  ('ref-service-tyres-alignment', 'service-tyres-alignment', 'builtin-service-tyres-alignment', CURRENT_TIMESTAMP, 'system'),
  ('ref-service-ac-electrical', 'service-ac-electrical', 'builtin-service-ac-electrical', CURRENT_TIMESTAMP, 'system'),
  ('ref-service-suspension-steering', 'service-suspension-steering', 'builtin-service-suspension-steering', CURRENT_TIMESTAMP, 'system'),
  ('ref-service-general-service', 'service-general-service', 'builtin-service-general-service', CURRENT_TIMESTAMP, 'system'),
  ('ref-service-body-paint', 'service-body-paint', 'builtin-service-body-paint', CURRENT_TIMESTAMP, 'system'),
  ('ref-service-detailing-interior', 'service-detailing-interior', 'builtin-service-detailing-interior', CURRENT_TIMESTAMP, 'system');

-- Seed 8 Initial Services
INSERT OR IGNORE INTO services (
  id, title, summary, itemsJson, mediaAssetId, imagePath, displayOrder, visibleInCatalogue, selectableInBooking, active, createdAt, createdBy, updatedAt, updatedBy
)
VALUES
  (
    'engine-diagnostics',
    'Engine & Diagnostics',
    'Computerised fault scanning and precision engine work to keep performance exactly where it should be.',
    '["Computerised OBD / ECU diagnostics","Engine tuning & performance checks","Timing belt & chain replacement","Cylinder head & gasket repair","Oil, filter & fluid service","Cooling system & radiator service","Turbo & intake inspection"]',
    'builtin-service-engine-diagnostics',
    'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1200&q=80',
    1, 1, 1, 1, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'
  ),
  (
    'brakes',
    'Brakes',
    'Complete braking system service tuned for confident, repeatable stopping power.',
    '["Brake pad & disc replacement","Brake fluid flush & bleed","Caliper service & overhaul","ABS diagnostics","Handbrake adjustment","Brake line inspection"]',
    'builtin-service-brakes',
    '/images/service-brakes.jpg',
    2, 1, 1, 1, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'
  ),
  (
    'tyres-alignment',
    'Tyres & Wheel Alignment',
    'Precision alignment and balancing for even wear, cleaner handling and longer tyre life.',
    '["Tyre fitting & replacement","Computerised wheel alignment","Wheel balancing","Puncture repair","Tyre rotation","Nitrogen inflation"]',
    'builtin-service-tyres-alignment',
    '/images/service-tyres.jpeg',
    3, 1, 1, 1, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'
  ),
  (
    'ac-electrical',
    'AC & Electrical',
    'Climate comfort and electrical reliability, from compressor service to battery and wiring diagnostics.',
    '["AC gas recharge & leak detection","Compressor & condenser service","Battery testing & replacement","Alternator & starter repair","Wiring & fuse diagnostics","Lighting & electronics repair"]',
    'builtin-service-ac-electrical',
    '/images/service-ac-electrical.jpg',
    4, 1, 1, 1, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'
  ),
  (
    'suspension-steering',
    'Suspension & Steering',
    'Shocks, struts and steering components restored for a planted, controlled ride.',
    '["Shock & strut replacement","Suspension bush & arm repair","Steering rack service","Ball joint & tie rod replacement","Power steering service","Ride height & handling checks"]',
    'builtin-service-suspension-steering',
    '/images/service-suspension.jpg',
    5, 1, 1, 1, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'
  ),
  (
    'general-service',
    'General Service & Maintenance',
    'Scheduled periodic service that keeps the whole vehicle healthy and warranty-ready.',
    '["Periodic / scheduled service","Multi-point vehicle inspection","Filters (air, cabin, fuel) replacement","Spark plug replacement","Belt & hose inspection","Pre-purchase & pre-trip checks"]',
    'builtin-service-general-service',
    '/images/service-general.jpg',
    6, 1, 1, 1, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'
  ),
  (
    'body-paint',
    'Body & Paint',
    'Collision repair and factory-grade refinishing with precise colour matching.',
    '["Dent & scratch repair","Panel beating & body work","Full & spot repainting","Colour matching","Rust treatment & protection","Bumper & panel replacement"]',
    'builtin-service-body-paint',
    'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=1200&q=80',
    7, 1, 1, 1, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'
  ),
  (
    'detailing-interior',
    'Detailing & Interior',
    'Deep cleaning, protection and finishing that returns the cabin and paint to showroom condition.',
    '["Interior deep cleaning","Exterior wash & polish","Ceramic coating & paint protection","Headlight restoration","Upholstery & leather care","Engine bay cleaning"]',
    'builtin-service-detailing-interior',
    '/images/service-detailing.jpg',
    8, 1, 1, 1, CURRENT_TIMESTAMP, 'system', CURRENT_TIMESTAMP, 'system'
  );

-- Seed Booking Form Config (Singleton Row 'default')
INSERT OR IGNORE INTO booking_form_config (
  key, heading, supportingText, fieldLabelsJson, optionalFieldVisibilityJson, customQuestionsJson, confirmationMessage, appointmentSlotsJson, bookingWindowJson, updatedAt, updatedBy
)
VALUES (
  'default',
  'Book Your Service',
  'Schedule your service. We''ll contact you shortly to confirm the details and time.',
  '{"fullName":"Full Name","phoneNumber":"Phone Number","email":"Email Address","vehicleMake":"Make","vehicleModel":"Model","registrationNumber":"Registration No.","serviceCategory":"Service Category","specificService":"Specific Service / Work","preferredDate":"Preferred Date","preferredTime":"Preferred Time Slot","additionalMessage":"Additional Notes / Special Instructions"}',
  '{"email":true,"specificService":true,"additionalMessage":true}',
  '[]',
  'Thank you for booking with Grand Motors. Our workshop team will review the requirements and contact you to confirm your appointment.',
  '["Morning (9:00 AM - 12:00 PM)","Afternoon (12:00 PM - 3:00 PM)","Evening (3:00 PM - 6:00 PM)","Flexible / Any Time"]',
  '{"minLeadDays":0,"maxAdvanceDays":60}',
  CURRENT_TIMESTAMP,
  'system'
);
