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
    expect(list.length).toBe(9);
    expect(list[0].id).toBe('engine-diagnostics');
    expect(list[0].displayOrder).toBe(1);

    const jumpStart = list.find((s) => s.id === 'car-battery-jump-start');
    expect(jumpStart).toBeDefined();
    expect(jumpStart?.title).toBe('Car Battery Jump Start');
    expect(jumpStart?.summary).toContain('discharged');
    expect(jumpStart?.items.length).toBeGreaterThan(0);
    expect(jumpStart?.active).toBe(true);
    expect(jumpStart?.visibleInCatalogue).toBe(true);
    expect(jumpStart?.selectableInBooking).toBe(true);
    expect(jumpStart?.displayOrder).toBe(9);
  });

  it('filters public catalogue and booking options based on flags', async () => {
    const catalogue = await getPublicCatalogue(db);
    expect(catalogue.length).toBe(9);
    expect(catalogue.some((s) => s.id === 'car-battery-jump-start')).toBe(true);

    // Deactivate a service
    await updateService(db, 'brakes', { active: false }, 'admin');

    const catAfterDeactivate = await getPublicCatalogue(db);
    expect(catAfterDeactivate.length).toBe(8);
    expect(catAfterDeactivate.some((s) => s.id === 'brakes')).toBe(false);

    // Hide from booking only
    await updateService(db, 'engine-diagnostics', { selectableInBooking: false }, 'admin');

    const bookingOpts = await getBookingOptions(db);
    expect(bookingOpts.some((s) => s.id === 'engine-diagnostics')).toBe(false);
    expect(bookingOpts.some((s) => s.id === 'tyres-alignment')).toBe(true);
    expect(bookingOpts.some((s) => s.id === 'car-battery-jump-start')).toBe(true);
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
    expect(newSvc.displayOrder).toBe(10);
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

  it('manages Car Battery Jump Start like other services with configurable properties', async () => {
    // 1. Verify Car Battery Jump Start exists in public catalogue & booking options
    const bookingOpts = await getBookingOptions(db);
    const jumpStartBooking = bookingOpts.find((s) => s.id === 'car-battery-jump-start');
    expect(jumpStartBooking).toBeDefined();
    expect(jumpStartBooking?.title).toBe('Car Battery Jump Start');
    expect(jumpStartBooking?.summary.toLowerCase()).toContain('discharged');
    expect(jumpStartBooking?.items.length).toBeGreaterThanOrEqual(4);

    // 2. Admin can update its summary and checklist items without pricing constraints
    const updated = await updateService(
      db,
      'car-battery-jump-start',
      {
        summary: 'Emergency roadside technician dispatched to jump start vehicle with a flat battery.',
        items: ['Mobile booster pack jump start', 'Alternator health check'],
      },
      'admin'
    );
    expect(updated.summary).toBe('Emergency roadside technician dispatched to jump start vehicle with a flat battery.');
    expect(updated.items).toEqual(['Mobile booster pack jump start', 'Alternator health check']);

    // 3. Admin can toggle selectableInBooking flag
    await updateService(db, 'car-battery-jump-start', { selectableInBooking: false }, 'admin');
    const bookingAfterToggle = await getBookingOptions(db);
    expect(bookingAfterToggle.some((s) => s.id === 'car-battery-jump-start')).toBe(false);

    // Re-enable booking
    await updateService(db, 'car-battery-jump-start', { selectableInBooking: true }, 'admin');
    const bookingReenabled = await getBookingOptions(db);
    expect(bookingReenabled.some((s) => s.id === 'car-battery-jump-start')).toBe(true);

    // 4. Admin can deactivate and reactivate
    await updateService(db, 'car-battery-jump-start', { active: false }, 'admin');
    const catalogueInactive = await getPublicCatalogue(db);
    expect(catalogueInactive.some((s) => s.id === 'car-battery-jump-start')).toBe(false);
    const bookingInactive = await getBookingOptions(db);
    expect(bookingInactive.some((s) => s.id === 'car-battery-jump-start')).toBe(false);
  });
});
