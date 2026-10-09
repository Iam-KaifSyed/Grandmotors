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
