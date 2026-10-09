import { describe, it, expect, beforeEach } from 'vitest';
import { createTestD1Database } from './testDbHelper';
import {
  listAllServices,
  getPublicCatalogue,
  getBookingOptions,
  createService,
  updateService,
  reorderServices,
  createServiceCategory,
  updateServiceCategory,
  deleteService,
} from './serviceStore';

describe('serviceStore CRUD & Ordering', () => {
  let db: any;

  beforeEach(() => {
    db = createTestD1Database();
  });

  it('lists seeded services initially', async () => {
    const list = await listAllServices(db);
    expect(list.length).toBe(8);
    expect(list[0].id).toBe('engine-diagnostics');
    expect(list[0].displayOrder).toBe(1);
  });

  it('filters public catalogue and booking options based on flags', async () => {
    const catalogue = await getPublicCatalogue(db);
    expect(catalogue.length).toBe(8);

    // Deactivate a service
    await updateService(db, 'brakes', { active: false }, 'admin');

    const catAfterDeactivate = await getPublicCatalogue(db);
    expect(catAfterDeactivate.length).toBe(7);
    expect(catAfterDeactivate.some((s) => s.id === 'brakes')).toBe(false);

    // Hide from booking only
    await updateService(db, 'engine-diagnostics', { selectableInBooking: false }, 'admin');

    const bookingOpts = await getBookingOptions(db);
    expect(bookingOpts.some((s) => s.id === 'engine-diagnostics')).toBe(false);
    expect(bookingOpts.some((s) => s.id === 'tyres-alignment')).toBe(true);
  });

  it('creates new service with trailing display order', async () => {
    const newSvc = await createService(
      db,
      {
        title: 'Custom Exhaust Fabrication',
        summary: 'Bespoke stainless steel exhausts',
        items: ['Mandrel bending', 'TIG welding'],
      },
      'admin'
    );

    expect(newSvc.id).toBe('custom-exhaust-fabrication');
    expect(newSvc.displayOrder).toBe(9);
    expect(newSvc.items).toEqual(['Mandrel bending', 'TIG welding']);
  });

  it('rejects empty service title with 422', async () => {
    await expect(
      createService(db, { title: '   ' }, 'admin')
    ).rejects.toMatchObject({ status: 422, field: 'name' });
  });

  it('rejects duplicate service title with 409 conflict', async () => {
    // Attempt to create service with title matching existing 'Engine & Diagnostics'
    await expect(
      createService(db, { title: 'Engine & Diagnostics' }, 'admin')
    ).rejects.toMatchObject({ status: 409, field: 'name' });

    // Attempt to update service title to another existing service's title ('Brakes')
    await expect(
      updateService(db, 'engine-diagnostics', { title: 'Brakes' }, 'admin')
    ).rejects.toMatchObject({ status: 409, field: 'name' });
  });

  it('prevents deletion of services referenced by bookings (409 conflict)', async () => {
    // Seed a booking referencing 'engine-diagnostics'
    await db
      .prepare(
        `INSERT INTO bookings (
          id, customerName, phoneNumber, email, vehicleMake, vehicleModel,
          registrationNumber, serviceCategory, specificService, preferredDate,
          preferredTime, status
        ) VALUES (
          'bk-1', 'John Doe', '0712345678', 'john@example.com', 'BMW', 'M3',
          'AB12 CDE', 'engine-diagnostics', NULL, '2026-10-15', '10:00', 'Pending'
        )`
      )
      .run();

    try {
      await deleteService(db, 'engine-diagnostics', 'admin');
      expect.unreachable('Should have thrown 409 conflict');
    } catch (err: any) {
      expect(err.status).toBe(409);
      expect(err.bookingCount).toBe(1);
      expect(err.canDeactivate).toBe(true);
    }
  });

  it('deletes unreferenced services cleanly', async () => {
    // Create an unreferenced service
    const created = await createService(
      db,
      {
        title: 'Temporary Test Service',
        summary: 'To be deleted',
      },
      'admin'
    );

    const res = await deleteService(db, created.id, 'admin');
    expect(res.deleted).toBe(true);

    const all = await listAllServices(db);
    expect(all.some((s) => s.id === created.id)).toBe(false);
  });

  it('reorders services to contiguous ascending sequence', async () => {
    const reordered = await reorderServices(
      db,
      ['detailing-interior', 'body-paint', 'general-service'],
      'admin'
    );

    expect(reordered).toEqual([
      { id: 'detailing-interior', displayOrder: 1 },
      { id: 'body-paint', displayOrder: 2 },
      { id: 'general-service', displayOrder: 3 },
    ]);
  });

  it('creates and updates categories', async () => {
    const cat = await createServiceCategory(db, 'Special Projects', 'admin');
    expect(cat.id).toBe('special-projects');
    expect(cat.active).toBe(true);

    const updated = await updateServiceCategory(
      db,
      'special-projects',
      { name: 'Custom Builds', active: false },
      'admin'
    );
    expect(updated.name).toBe('Custom Builds');
    expect(updated.active).toBe(false);
  });
});
