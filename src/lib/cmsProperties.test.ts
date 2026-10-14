import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { createTestD1Database } from './testDbHelper';
import { MockStorageDriver } from './testStorageDriver';
import {
  createService,
  updateService,
  reorderServices,
  getPublicCatalogue,
  getBookingOptions,
} from './serviceStore';
import {
  createMediaUpload,
  deleteMediaAsset,
  assignMediaToUsageLocation,
} from './mediaStore';
import {
  updateBookingFormConfig,
  ESSENTIAL_FIELDS,
} from './bookingFormConfigStore';
import { USAGE_LOCATIONS } from './usageLocations';

describe('CMS Property-Based Tests (fast-check)', () => {
  const samplePngBytes = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
    0x52, 0x00, 0x00, 0x00, 0x64, 0x00, 0x00, 0x00, 0x64, 0x08, 0x06,
  ]);

  // Feature: admin-cms, Property 20: Empty or whitespace-only names are rejected
  it('Property 20: Empty or whitespace-only service names are rejected', () => {
    fc.assert(
      fc.asyncProperty(fc.stringMatching(/^\s*$/), async (whitespaceTitle) => {
        const db = createTestD1Database();
        await expect(
          createService(db, { title: whitespaceTitle }, 'admin')
        ).rejects.toMatchObject({ status: 422, field: 'name' });
      }),
      { numRuns: 100 }
    );
  });

  // Feature: admin-cms, Property 16: Create assigns a trailing display-order position
  it('Property 16: Create assigns a trailing display-order position', () => {
    fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 30 }).filter((s) => s.trim().length > 0),
        async (title) => {
          const db = createTestD1Database();
          const svc = await createService(db, { title }, 'admin');
          expect(svc.displayOrder).toBe(10); // Initial 9 + 1
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: admin-cms, Property 21: Reorder yields a contiguous unique ascending order matching the submission
  it('Property 21: Reorder yields a contiguous unique ascending order', () => {
    fc.assert(
      fc.asyncProperty(
        fc.shuffledSubarray(
          [
            'engine-diagnostics',
            'brakes',
            'tyres-alignment',
            'ac-electrical',
            'suspension-steering',
            'general-service',
            'body-paint',
            'detailing-interior',
            'car-battery-jump-start',
          ],
          { minLength: 2, maxLength: 9 }
        ),
        async (shuffled) => {
          const db = createTestD1Database();
          const reordered = await reorderServices(db, shuffled, 'admin');

          expect(reordered.length).toBe(shuffled.length);
          reordered.forEach((item, index) => {
            expect(item.id).toBe(shuffled[index]);
            expect(item.displayOrder).toBe(index + 1);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: admin-cms, Property 23: Public surfaces include a service only when permitted, with deactivation dominating
  it('Property 23: Public surfaces include a service only when active and permitted', () => {
    fc.assert(
      fc.asyncProperty(
        fc.boolean(),
        fc.boolean(),
        fc.boolean(),
        async (active, visibleInCatalogue, selectableInBooking) => {
          const db = createTestD1Database();
          await updateService(
            db,
            'brakes',
            { active, visibleInCatalogue, selectableInBooking },
            'admin'
          );

          const catalogue = await getPublicCatalogue(db);
          const bookingOpts = await getBookingOptions(db);

          const inCatalogue = catalogue.some((s) => s.id === 'brakes');
          const inBooking = bookingOpts.some((s) => s.id === 'brakes');

          if (!active) {
            expect(inCatalogue).toBe(false);
            expect(inBooking).toBe(false);
          } else {
            expect(inCatalogue).toBe(visibleInCatalogue);
            expect(inBooking).toBe(selectableInBooking);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: admin-cms, Property 26: Essential Fields cannot be removed or made optional via config
  it('Property 26: Essential Fields cannot be made optional or hidden', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...ESSENTIAL_FIELDS),
        async (essentialField) => {
          const db = createTestD1Database();
          await expect(
            updateBookingFormConfig(
              db,
              {
                optionalFieldVisibility: {
                  [essentialField]: false,
                } as any,
              },
              'admin'
            )
          ).rejects.toMatchObject({ status: 422 });
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: admin-cms, Property 10: Deletion requires confirmation naming the asset
  it('Property 10: Deletion requires confirmation matching the asset filename', () => {
    fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s !== 'test.png'),
        async (wrongFilename) => {
          const db = createTestD1Database();
          const driver = new MockStorageDriver();

          const asset = await createMediaUpload(
            db,
            driver,
            { filename: 'test.png', bytes: samplePngBytes, mimeType: 'image/png' },
            'admin'
          );

          await expect(
            deleteMediaAsset(db, driver, asset.id, wrongFilename, 'admin')
          ).rejects.toThrow('Confirmation mismatch');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: admin-cms, Property 13: Assignments to unknown locations are rejected
  it('Property 13: Assignments to unknown locations are rejected', () => {
    const validKeys = new Set(USAGE_LOCATIONS.map((u) => u.key));
    fc.assert(
      fc.asyncProperty(
        fc
          .string({ minLength: 3, maxLength: 30 })
          .filter((s) => !validKeys.has(s)),
        async (invalidLocation) => {
          const db = createTestD1Database();
          await expect(
            assignMediaToUsageLocation(db, invalidLocation, 'builtin-services-hero', 'admin')
          ).rejects.toMatchObject({ status: 400 });
        }
      ),
      { numRuns: 100 }
    );
  });
});
