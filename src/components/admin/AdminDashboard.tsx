import { useEffect, useMemo, useState } from 'react';
import { SERVICES } from '../site/servicesData';
import { calculateRepeatCustomers } from '../../lib/customerMatching';

type Status = 'Pending' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled';

interface AdminBooking {
  id: string;
  bookingId: string;
  customerName: string;
  fullName: string;
  phoneNumber: string;
  phone: string;
  email: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicle: string;
  fuelType?: string;
  registrationNumber: string;
  serviceCategory: string;
  specificService: string;
  preferredDate: string;
  preferredTime: string;
  status: Status;
  additionalMessage: string;
  serviceLocation?: string;
  doorstepHouseFlat?: string;
  doorstepStreetLocality?: string;
  doorstepCity?: string;
  doorstepPincode?: string;
  doorstepLatitude?: number | null;
  doorstepLongitude?: number | null;
  doorstepMapUrl?: string;
  createdAt: string;
}

const ALL_STATUSES: Status[] = ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];

function serviceTitle(categoryId: string): string {
  return SERVICES.find((s) => s.id === categoryId)?.title || categoryId || '—';
}

function telHref(phone: string): string {
  return `tel:${(phone || '').replace(/[^\d+]/g, '')}`;
}

function waHref(phone: string): string {
  let digits = (phone || '').replace(/[^\d]/g, '');
  // Default to India country code when a bare 10-digit number is stored.
  if (digits.length === 10) digits = `91${digits}`;
  return `https://wa.me/${digits}`;
}

function formatDateTime(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function statusClasses(status: Status): string {
  switch (status) {
    case 'Pending':
      return 'text-[#b45309] dark:text-[#E5A84B] border-[#b45309]/30 dark:border-[#E5A84B]/30 bg-[#b45309]/10 dark:bg-[#E5A84B]/10';
    case 'Confirmed':
      return 'text-[var(--gm-accent-primary)] border-[var(--gm-accent-border)] bg-[var(--gm-accent-muted)]';
    case 'In Progress':
      return 'text-[#2563eb] dark:text-[#60A5FA] border-[#2563eb]/30 dark:border-[#60A5FA]/30 bg-[#2563eb]/10 dark:bg-[#60A5FA]/10';
    case 'Completed':
      return 'text-[#15803d] dark:text-[#25D366] border-[#15803d]/30 dark:border-[#25D366]/30 bg-[#15803d]/10 dark:bg-[#25D366]/10';
    case 'Cancelled':
      return 'text-[#dc2626] dark:text-[#FF5F5F] border-[#dc2626]/30 dark:border-[#FF5F5F]/30 bg-[#dc2626]/10 dark:bg-[#FF5F5F]/10';
    default:
      return 'text-[var(--gm-text-secondary)] border-[var(--gm-border-subtle)] bg-[var(--gm-bg-card-subtle)]';
  }
}

function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase rounded-full border ${statusClasses(status)}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function AdminDashboard() {
  const [bookings, setBookings] = useState<AdminBooking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | Status>('All');
  const [dateFilter, setDateFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const [selected, setSelected] = useState<AdminBooking | null>(null);
  const [statusDraft, setStatusDraft] = useState<Status | ''>('');
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const loadBookings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/admin/bookings', { headers: { Accept: 'application/json' } });
      if (resp.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${resp.status}).`);
      }
      const data = await resp.json();
      setBookings(Array.isArray(data.bookings) ? data.bookings : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load bookings.');
      setBookings(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const counts = useMemo(() => {
    const base = { total: 0, Pending: 0, Confirmed: 0, 'In Progress': 0, Completed: 0, Cancelled: 0 } as Record<string, number>;
    (bookings || []).forEach((b) => {
      base.total += 1;
      if (base[b.status] !== undefined) base[b.status] += 1;
    });
    return base;
  }, [bookings]);

  const repeatCustomerMap = useMemo(() => {
    return calculateRepeatCustomers(bookings || []);
  }, [bookings]);

  const filtered = useMemo(() => {
    let list = [...(bookings || [])];
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((b) =>
        [
          b.id,
          b.customerName,
          b.phoneNumber,
          b.vehicle,
          b.vehicleMake,
          b.vehicleModel,
          b.fuelType,
          b.registrationNumber,
          b.serviceLocation,
          b.doorstepCity,
          b.doorstepPincode,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      );
    }
    if (statusFilter !== 'All') {
      list = list.filter((b) => b.status === statusFilter);
    }
    if (dateFilter) {
      list = list.filter((b) => b.preferredDate === dateFilter);
    }
    list.sort((a, b) => {
      const ta = new Date(a.createdAt).getTime() || 0;
      const tb = new Date(b.createdAt).getTime() || 0;
      return sortOrder === 'newest' ? tb - ta : ta - tb;
    });
    return list;
  }, [bookings, query, statusFilter, dateFilter, sortOrder]);

  const openDetails = (b: AdminBooking) => {
    setSelected(b);
    setStatusDraft(b.status);
    setStatusFeedback(null);
  };

  const saveStatus = async () => {
    if (!selected || !statusDraft || statusDraft === selected.status) return;
    setStatusSaving(true);
    setStatusFeedback(null);
    try {
      const resp = await fetch(`/api/admin/bookings/${encodeURIComponent(selected.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusDraft }),
      });
      if (resp.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data.error || `Update failed (${resp.status}).`);
      }
      // Update local state in place.
      setBookings((prev) =>
        (prev || []).map((b) => (b.id === selected.id ? { ...b, status: statusDraft } : b))
      );
      setSelected((prev) => (prev ? { ...prev, status: statusDraft } : prev));
      setStatusFeedback({ ok: true, msg: `Status updated to “${statusDraft}”.` });
    } catch (err: any) {
      setStatusFeedback({ ok: false, msg: err?.message || 'Failed to update status.' });
    } finally {
      setStatusSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-4 h-px bg-[var(--gm-accent-primary)]" />
            <span className="text-[10px] font-semibold tracking-[0.25em] text-[var(--gm-accent-primary)] uppercase">Workshop Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.02em] text-[var(--gm-text-primary)] uppercase">
            Bookings Dashboard
          </h1>
        </div>
        <button
          type="button"
          onClick={loadBookings}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)] bg-[var(--gm-bg-card)] hover:bg-[var(--gm-bg-card-hover)] border border-[var(--gm-border-subtle)] rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
        >
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {([
          { label: 'Total', value: counts.total, accent: 'text-[var(--gm-text-primary)]' },
          { label: 'Pending', value: counts.Pending, accent: 'text-[#b45309] dark:text-[#E5A84B]' },
          { label: 'Confirmed', value: counts.Confirmed, accent: 'text-[var(--gm-accent-primary)]' },
          { label: 'In Progress', value: counts['In Progress'], accent: 'text-[#2563eb] dark:text-[#60A5FA]' },
          { label: 'Completed', value: counts.Completed, accent: 'text-[#15803d] dark:text-[#25D366]' },
          { label: 'Cancelled', value: counts.Cancelled, accent: 'text-[#dc2626] dark:text-[#FF5F5F]' },
        ]).map((card) => (
          <div key={card.label} className="rounded-xl border border-[var(--gm-border-subtle)] bg-[var(--gm-bg-card)] p-4 shadow-sm">
            <div className={`text-2xl font-extrabold tracking-[-0.02em] ${card.accent}`}>
              {isLoading ? '—' : card.value}
            </div>
            <div className="mt-1 text-[10px] font-semibold tracking-[0.14em] uppercase text-[var(--gm-text-muted)]">
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-[var(--gm-border-subtle)] bg-[var(--gm-bg-card)] p-4 sm:p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className="sr-only" htmlFor="admin-search">Search</label>
            <input
              id="admin-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ID, customer, phone, vehicle or reg. no."
              className="w-full bg-[var(--gm-bg-surface)] border border-[var(--gm-border-subtle)] rounded-lg px-4 py-2.5 text-sm text-[var(--gm-text-primary)] placeholder-[var(--gm-text-muted)] focus:border-[var(--gm-accent-primary)] focus:outline-none transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'All' | Status)}
            className="w-full bg-[var(--gm-bg-surface)] border border-[var(--gm-border-subtle)] rounded-lg px-3 py-2.5 text-sm text-[var(--gm-text-primary)] focus:border-[var(--gm-accent-primary)] focus:outline-none transition-colors cursor-pointer"
          >
            <option value="All">All statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <div className="flex gap-3">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="flex-1 min-w-0 bg-[var(--gm-bg-surface)] border border-[var(--gm-border-subtle)] rounded-lg px-3 py-2.5 text-sm text-[var(--gm-text-primary)] focus:border-[var(--gm-accent-primary)] focus:outline-none transition-colors cursor-pointer"
            />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              className="bg-[var(--gm-bg-surface)] border border-[var(--gm-border-subtle)] rounded-lg px-3 py-2.5 text-sm text-[var(--gm-text-primary)] focus:border-[var(--gm-accent-primary)] focus:outline-none transition-colors cursor-pointer"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>
        {(query || statusFilter !== 'All' || dateFilter) && (
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[12px] text-[var(--gm-text-secondary)]">{filtered.length} result{filtered.length === 1 ? '' : 's'}</span>
            <button
              type="button"
              onClick={() => { setQuery(''); setStatusFilter('All'); setDateFilter(''); }}
              className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--gm-accent-primary)] hover:text-[var(--gm-accent-primary-hover)] transition-colors cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Table / Cards / states */}
      <div className="rounded-xl border border-[var(--gm-border-subtle)] bg-[var(--gm-bg-card)] overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--gm-accent-primary)]/20 border-t-[var(--gm-accent-primary)] animate-spin" />
          </div>
        ) : error ? (
          <div className="py-12 px-6 text-center">
            <p className="text-sm text-red-500 dark:text-red-300">{error}</p>
            <button
              type="button"
              onClick={loadBookings}
              className="mt-4 inline-flex items-center px-5 py-2.5 text-[11px] font-semibold tracking-[0.16em] uppercase text-[var(--gm-accent-foreground)] bg-[var(--gm-accent-primary)] hover:bg-[var(--gm-accent-primary-hover)] rounded-lg transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <p className="text-sm text-[var(--gm-text-secondary)]">
              {bookings && bookings.length === 0 ? 'No bookings have been created yet.' : 'No bookings match your filters.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table: fits 100% width without horizontal scrolling */}
            <div className="hidden lg:block w-full overflow-hidden">
              <table className="w-full table-fixed text-left text-sm divide-y divide-[var(--gm-border-subtle)]">
                <thead className="bg-[var(--gm-bg-surface)]">
                  <tr className="text-[10px] uppercase tracking-[0.14em] text-[var(--gm-text-secondary)]">
                    <th className="w-[14%] px-4 py-3.5 font-semibold">Booking ID</th>
                    <th className="w-[14%] px-4 py-3.5 font-semibold">Customer</th>
                    <th className="w-[12%] px-4 py-3.5 font-semibold">Phone</th>
                    <th className="w-[15%] px-4 py-3.5 font-semibold">Vehicle</th>
                    <th className="w-[15%] px-4 py-3.5 font-semibold">Service</th>
                    <th className="w-[12%] px-4 py-3.5 font-semibold">Requested</th>
                    <th className="w-[10%] px-4 py-3.5 font-semibold">Status</th>
                    <th className="w-[8%] px-4 py-3.5 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--gm-border-subtle)]">
                  {filtered.map((b) => {
                    const vehicleName = b.vehicle || `${b.vehicleMake || ''} ${b.vehicleModel || ''}`.trim() || '—';
                    const categoryName = serviceTitle(b.serviceCategory);
                    const reqDate = b.preferredDate;
                    const reqTime = b.preferredTime;
                    const phoneNum = b.phoneNumber || b.phone || '—';
                    const custName = b.customerName || b.fullName || '—';
                    const repeatInfo = repeatCustomerMap.get(b.id);

                    return (
                      <tr
                        key={b.id}
                        className="hover:bg-[var(--gm-bg-card-hover)] transition-colors"
                      >
                        {/* Booking ID - prevent clipping with font-mono, whitespace-nowrap, tooltip */}
                        <td className="px-4 py-3.5 align-middle">
                          <span
                            className="font-mono font-semibold text-xs text-[var(--gm-text-primary)] whitespace-nowrap tracking-wide select-all"
                            title={`Booking ID: ${b.id}`}
                          >
                            {b.id}
                          </span>
                        </td>

                        {/* Customer */}
                        <td className="px-4 py-3.5 align-middle">
                          <div
                            className="truncate font-medium text-xs text-[var(--gm-text-primary)]"
                            title={custName}
                          >
                            {custName}
                          </div>
                          {b.email && (
                            <div
                              className="truncate text-[11px] text-[var(--gm-text-muted)]"
                              title={b.email}
                            >
                              {b.email}
                            </div>
                          )}
                          {repeatInfo?.isRepeatCustomer && (
                            <div className="mt-1.5 space-y-1">
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-[#b45309]/10 dark:bg-[#E5A84B]/15 text-[#b45309] dark:text-[#E5A84B] border border-[#b45309]/30 dark:border-[#E5A84B]/35"
                                title={`Repeat customer with ${repeatInfo.totalBookingCount} total bookings`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-[#b45309] dark:bg-[#E5A84B]" />
                                Multiple Bookings Found ({repeatInfo.totalBookingCount})
                              </span>
                              <div className="flex flex-wrap items-center gap-1 text-[11px]">
                                <span className="text-[10px] text-[var(--gm-text-muted)]">Other:</span>
                                {repeatInfo.otherBookingIds.map((otherId) => {
                                  const otherBooking = (bookings || []).find((x) => x.id === otherId);
                                  return (
                                    <button
                                      key={otherId}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (otherBooking) openDetails(otherBooking);
                                      }}
                                      className="font-mono text-[11px] font-semibold text-[var(--gm-accent-primary)] hover:text-[var(--gm-accent-primary-hover)] underline decoration-[var(--gm-accent-primary)]/40 hover:decoration-[var(--gm-accent-primary)] transition-colors cursor-pointer"
                                      title={`View booking ${otherId}`}
                                    >
                                      {otherId}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Phone */}
                        <td className="px-4 py-3.5 align-middle">
                          <a
                            href={telHref(phoneNum)}
                            className="truncate block font-mono text-xs text-[var(--gm-text-secondary)] hover:text-[var(--gm-accent-primary)] transition-colors"
                            title={`Call ${phoneNum}`}
                          >
                            {phoneNum}
                          </a>
                        </td>

                        {/* Vehicle */}
                        <td className="px-4 py-3.5 align-middle">
                          <div
                            className="truncate text-xs font-medium text-[var(--gm-text-primary)]"
                            title={vehicleName}
                          >
                            {vehicleName}
                          </div>
                          {(b.vehicleMake || b.vehicleModel || b.fuelType) && (
                            <div className="flex items-center gap-1.5 text-[10px] text-[var(--gm-text-secondary)] mt-0.5 truncate">
                              <span className="text-[var(--gm-accent-primary)] font-semibold">{b.vehicleMake || '—'}</span>
                              <span className="text-[var(--gm-border-medium)]">•</span>
                              <span className="truncate">{b.vehicleModel || '—'}</span>
                              {b.fuelType && (
                                <>
                                  <span className="text-[var(--gm-border-medium)]">•</span>
                                  <span className="text-[#b45309] dark:text-[#E5A84B] font-medium shrink-0">{b.fuelType}</span>
                                </>
                              )}
                            </div>
                          )}
                          {b.registrationNumber && (
                            <div
                              className="truncate text-[11px] font-mono text-[var(--gm-text-muted)] tracking-wider mt-0.5"
                              title={`Reg: ${b.registrationNumber}`}
                            >
                              {b.registrationNumber}
                            </div>
                          )}
                        </td>

                        {/* Service */}
                        <td className="px-4 py-3.5 align-middle">
                          <div
                            className="truncate text-xs text-[var(--gm-text-primary)]"
                            title={categoryName}
                          >
                            {categoryName}
                          </div>
                          {b.specificService && (
                            <div
                              className="truncate text-[11px] text-[var(--gm-text-muted)]"
                              title={`Specific service: ${b.specificService}`}
                            >
                              {b.specificService}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider uppercase rounded ${
                              b.serviceLocation === 'Doorstep Service'
                                ? 'bg-[var(--gm-accent-muted)] text-[var(--gm-accent-primary)] border border-[var(--gm-accent-border)]'
                                : 'bg-[var(--gm-bg-surface)] text-[var(--gm-text-secondary)] border border-[var(--gm-border-subtle)]'
                            }`}>
                              {b.serviceLocation === 'Doorstep Service' ? '🏠 Doorstep' : '🏢 Workshop'}
                            </span>
                            {b.serviceLocation === 'Doorstep Service' && b.doorstepCity && (
                              <span className="text-[10px] text-[var(--gm-text-muted)] truncate">
                                ({b.doorstepCity})
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Requested */}
                        <td className="px-4 py-3.5 align-middle">
                          <div
                            className="truncate text-xs text-[var(--gm-text-primary)]"
                            title={`Preferred: ${reqDate}${reqTime ? ` · ${reqTime}` : ''}`}
                          >
                            {reqDate || '—'}
                          </div>
                          {reqTime && (
                            <div
                              className="truncate text-[11px] text-[var(--gm-text-muted)]"
                              title={`Time: ${reqTime}`}
                            >
                              {reqTime}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                          <StatusBadge status={b.status} />
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openDetails(b)}
                            className="inline-flex items-center px-3 py-1.5 text-[11px] font-semibold tracking-[0.1em] uppercase text-[var(--gm-text-primary)] bg-[var(--gm-bg-surface)] hover:bg-[var(--gm-accent-primary)] hover:text-[var(--gm-accent-foreground)] border border-[var(--gm-border-subtle)] hover:border-[var(--gm-accent-primary)] rounded-lg transition-all cursor-pointer whitespace-nowrap"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Responsive Card Layout */}
            <div className="lg:hidden divide-y divide-[var(--gm-border-subtle)]">
              {filtered.map((b) => {
                const vehicleName = b.vehicle || `${b.vehicleMake || ''} ${b.vehicleModel || ''}`.trim() || '—';
                const categoryName = serviceTitle(b.serviceCategory);
                const phoneNum = b.phoneNumber || b.phone;
                const custName = b.customerName || b.fullName || '—';
                const repeatInfo = repeatCustomerMap.get(b.id);

                return (
                  <div
                    key={b.id}
                    className="p-4 sm:p-5 space-y-4 hover:bg-[var(--gm-bg-card-hover)] transition-colors"
                  >
                    {/* Card Top: ID & Status */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span
                          className="font-mono font-bold text-xs sm:text-sm text-[var(--gm-text-primary)] tracking-wide select-all"
                          title={`Booking ID: ${b.id}`}
                        >
                          {b.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider uppercase rounded ${
                          b.serviceLocation === 'Doorstep Service'
                            ? 'bg-[var(--gm-accent-muted)] text-[var(--gm-accent-primary)] border border-[var(--gm-accent-border)]'
                            : 'bg-[var(--gm-bg-surface)] text-[var(--gm-text-secondary)] border border-[var(--gm-border-subtle)]'
                        }`}>
                          {b.serviceLocation === 'Doorstep Service' ? '🏠 Doorstep' : '🏢 Workshop'}
                        </span>
                        <StatusBadge status={b.status} />
                      </div>
                    </div>

                    {/* Customer & Quick Contact */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3
                          className="text-sm sm:text-base font-semibold text-[var(--gm-text-primary)] truncate"
                          title={custName}
                        >
                          {custName}
                        </h3>
                        {b.email && (
                          <p className="text-xs text-[var(--gm-text-muted)] truncate" title={b.email}>
                            {b.email}
                          </p>
                        )}
                        {phoneNum && (
                          <p className="font-mono text-xs text-[var(--gm-text-secondary)] mt-0.5" title={phoneNum}>
                            {phoneNum}
                          </p>
                        )}
                      </div>
                      {phoneNum && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <a
                            href={telHref(phoneNum)}
                            className="px-2.5 py-1 text-[10px] font-semibold tracking-[0.1em] uppercase text-[var(--gm-text-primary)] bg-[var(--gm-bg-surface)] hover:bg-[var(--gm-bg-card-hover)] border border-[var(--gm-border-subtle)] rounded-md transition-colors"
                            title={`Call ${phoneNum}`}
                          >
                            Call
                          </a>
                          <a
                            href={waHref(phoneNum)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 text-[10px] font-semibold tracking-[0.1em] uppercase text-[#15803d] dark:text-[#25D366] bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 rounded-md transition-colors"
                            title={`WhatsApp ${phoneNum}`}
                          >
                            WA
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Repeat Customer Alert in Card */}
                    {repeatInfo?.isRepeatCustomer && (
                      <div className="p-3 rounded-lg bg-[#b45309]/10 dark:bg-[#E5A84B]/10 border border-[#b45309]/30 dark:border-[#E5A84B]/30 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 font-bold text-[10px] tracking-wider uppercase text-[#b45309] dark:text-[#E5A84B]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#b45309] dark:bg-[#E5A84B]" />
                            Multiple Bookings Found
                          </span>
                          <span className="text-[10px] font-semibold text-[var(--gm-text-primary)] bg-[var(--gm-bg-surface)] px-2 py-0.5 rounded-full border border-[var(--gm-border-subtle)]">
                            {repeatInfo.totalBookingCount} Total
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-[10px] text-[var(--gm-text-muted)]">Other Bookings:</span>
                          {repeatInfo.otherBookingIds.map((otherId) => {
                            const otherBooking = (bookings || []).find((x) => x.id === otherId);
                            return (
                              <button
                                key={otherId}
                                type="button"
                                onClick={() => {
                                  if (otherBooking) openDetails(otherBooking);
                                }}
                                className="px-2 py-0.5 rounded bg-[var(--gm-bg-surface)] border border-[var(--gm-border-subtle)] hover:border-[var(--gm-accent-primary)] font-mono text-[10px] font-medium text-[var(--gm-accent-primary)] hover:text-[var(--gm-accent-primary-hover)] transition-colors cursor-pointer"
                                title={`Open booking ${otherId}`}
                              >
                                {otherId}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-2.5 p-3 rounded-lg bg-[var(--gm-bg-surface)] border border-[var(--gm-border-subtle)] text-xs">
                      <div className="min-w-0">
                        <span className="block text-[9px] font-bold tracking-[0.16em] uppercase text-[var(--gm-text-muted)] mb-0.5">Vehicle</span>
                        <p className="text-[var(--gm-text-primary)] font-medium truncate" title={vehicleName}>
                          {vehicleName}
                        </p>
                        {(b.vehicleMake || b.vehicleModel) && (
                          <p className="text-[10px] text-[var(--gm-accent-primary)] truncate">
                            {b.vehicleMake || '—'} <span className="text-[var(--gm-text-muted)]">/</span> {b.vehicleModel || '—'}
                          </p>
                        )}
                        {b.fuelType && (
                          <p className="text-[10px] text-[#b45309] dark:text-[#E5A84B] truncate font-medium">
                            Fuel: {b.fuelType}
                          </p>
                        )}
                        {b.registrationNumber && (
                          <p className="font-mono text-[10px] text-[var(--gm-text-muted)] truncate mt-0.5" title={`Reg: ${b.registrationNumber}`}>
                            {b.registrationNumber}
                          </p>
                        )}
                      </div>

                      <div className="min-w-0">
                        <span className="block text-[9px] font-bold tracking-[0.16em] uppercase text-[var(--gm-text-muted)] mb-0.5">Service</span>
                        <p className="text-[var(--gm-text-primary)] font-medium truncate" title={categoryName}>
                          {categoryName}
                        </p>
                        {b.specificService && (
                          <p className="text-[10px] text-[var(--gm-text-muted)] truncate" title={b.specificService}>
                            {b.specificService}
                          </p>
                        )}
                      </div>

                      <div className="min-w-0">
                        <span className="block text-[9px] font-bold tracking-[0.16em] uppercase text-[var(--gm-text-muted)] mb-0.5">Requested</span>
                        <p className="text-[var(--gm-text-primary)] truncate" title={`${b.preferredDate}${b.preferredTime ? ` · ${b.preferredTime}` : ''}`}>
                          {b.preferredDate || '—'}
                        </p>
                        {b.preferredTime && (
                          <p className="text-[10px] text-[var(--gm-text-muted)] truncate">{b.preferredTime}</p>
                        )}
                      </div>

                      <div className="min-w-0">
                        <span className="block text-[9px] font-bold tracking-[0.16em] uppercase text-[var(--gm-text-muted)] mb-0.5">Location</span>
                        <p className="text-[var(--gm-text-primary)] truncate" title={b.serviceLocation || 'Workshop Visit'}>
                          {b.serviceLocation === 'Doorstep Service' ? `🏠 Doorstep (${b.doorstepCity || 'City'})` : '🏢 Workshop Bay'}
                        </p>
                      </div>
                    </div>

                    {/* Card Footer: View Action */}
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => openDetails(b)}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--gm-text-primary)] bg-[var(--gm-bg-surface)] hover:bg-[var(--gm-accent-primary)] hover:text-[var(--gm-accent-foreground)] border border-[var(--gm-border-subtle)] hover:border-[var(--gm-accent-primary)] rounded-lg transition-all cursor-pointer"
                      >
                        View Full Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Detail drawer */}
      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 sm:p-6 bg-black/60 dark:bg-[#040404]/85 backdrop-blur-md overflow-y-auto"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-[var(--gm-bg-card)] border border-[var(--gm-border-subtle)] rounded-2xl max-w-2xl w-full relative shadow-2xl my-auto text-[var(--gm-text-primary)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 px-6 sm:px-8 pt-6 pb-5 border-b border-[var(--gm-border-subtle)]">
              <div>
                <span className="text-[10px] font-semibold tracking-[0.22em] text-[var(--gm-accent-primary)] uppercase block mb-1">Booking Details</span>
                <h2 className="text-2xl font-mono font-bold text-[var(--gm-text-primary)] break-all">{selected.id}</h2>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={selected.status} />
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label="Close"
                  className="w-9 h-9 rounded-full border border-[var(--gm-border-subtle)] bg-[var(--gm-bg-surface)] hover:bg-[var(--gm-bg-card-hover)] flex items-center justify-center text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)] transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="px-6 sm:px-8 py-6 space-y-6">
              {(() => {
                const selectedRepeatInfo = repeatCustomerMap.get(selected.id);
                if (!selectedRepeatInfo?.isRepeatCustomer) return null;
                return (
                  <div className="p-4 rounded-xl bg-[#b45309]/10 dark:bg-[#E5A84B]/10 border border-[#b45309]/30 dark:border-[#E5A84B]/35 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#b45309] dark:bg-[#E5A84B] animate-pulse" />
                        <span className="text-xs font-bold tracking-wider uppercase text-[#b45309] dark:text-[#E5A84B]">
                          Multiple Bookings Found
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-[var(--gm-text-primary)] bg-[var(--gm-bg-surface)] px-2.5 py-0.5 rounded-full border border-[var(--gm-border-subtle)]">
                        {selectedRepeatInfo.totalBookingCount} Total Bookings
                      </span>
                    </div>
                    <p className="text-xs text-[var(--gm-text-secondary)] leading-relaxed">
                      This customer has {selectedRepeatInfo.totalBookingCount} bookings with matching normalized phone number or email address.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-xs font-semibold text-[var(--gm-text-muted)]">Switch to:</span>
                      {selectedRepeatInfo.otherBookingIds.map((otherId) => {
                        const other = (bookings || []).find((b) => b.id === otherId);
                        return (
                          <button
                            key={otherId}
                            type="button"
                            onClick={() => {
                              if (other) {
                                openDetails(other);
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-semibold text-[var(--gm-text-primary)] bg-[var(--gm-bg-surface)] hover:bg-[var(--gm-accent-primary)] hover:text-[var(--gm-accent-foreground)] border border-[var(--gm-border-subtle)] hover:border-[var(--gm-accent-primary)] rounded-lg transition-all cursor-pointer"
                            title={`Switch to booking ${otherId}`}
                          >
                            <span>{otherId}</span>
                            {other && (
                              <span className="text-[10px] font-sans opacity-80">
                                ({other.status})
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              <div className="grid sm:grid-cols-2 gap-x-10 gap-y-5 text-sm">
                <Field label="Customer Name" value={selected.customerName} />
                <Field label="Phone" value={selected.phoneNumber} mono />
                <Field label="Email" value={selected.email || '—'} />
                <Field label="Registration" value={selected.registrationNumber || '—'} mono />
                <Field label="Car Brand / Make" value={selected.vehicleMake || '—'} />
                <Field label="Car Model" value={selected.vehicleModel || '—'} />
                <Field label="Fuel Type" value={selected.fuelType || '—'} />
                <Field label="Vehicle (Combined)" value={`${selected.vehicleMake || ''} ${selected.vehicleModel || ''}`.trim() || selected.vehicle || '—'} />
                <Field label="Service Category" value={serviceTitle(selected.serviceCategory)} />
                <Field label="Specific Service" value={selected.specificService || '—'} />
                <Field label="Service Location" value={selected.serviceLocation || 'Workshop Visit'} />
                <Field label="Requested" value={`${selected.preferredDate}${selected.preferredTime ? ` · ${selected.preferredTime}` : ''}`} />
                <Field label="Created" value={formatDateTime(selected.createdAt)} />
              </div>

              {/* Doorstep Address in Admin Detail Drawer */}
              {selected.serviceLocation === 'Doorstep Service' && (
                <div className="p-5 rounded-xl bg-[var(--gm-bg-surface)] border border-[var(--gm-accent-border)] space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="block text-[10px] font-bold tracking-[0.18em] text-[var(--gm-accent-primary)] uppercase">
                      Doorstep Service Address
                    </span>
                    {selected.doorstepLatitude && selected.doorstepLongitude && (
                      <span className="text-[10px] font-mono text-[var(--gm-text-secondary)]">
                        GPS: {selected.doorstepLatitude}, {selected.doorstepLongitude}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-[var(--gm-text-primary)]">
                    {selected.doorstepHouseFlat}, {selected.doorstepStreetLocality}
                  </p>
                  <p className="text-xs text-[var(--gm-text-secondary)]">
                    {selected.doorstepCity} - {selected.doorstepPincode}
                  </p>
                  {selected.doorstepMapUrl && (
                    <div className="pt-2">
                      <a
                        href={selected.doorstepMapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold tracking-wider uppercase text-[var(--gm-accent-foreground)] bg-[var(--gm-accent-primary)] hover:bg-[var(--gm-accent-primary-hover)] rounded-lg transition-colors cursor-pointer shadow-sm"
                      >
                        <span>Open Location in Google Maps</span>
                        <span>↗</span>
                      </a>
                    </div>
                  )}
                </div>
              )}

              {selected.additionalMessage && (
                <div>
                  <span className="block text-[10px] font-bold tracking-[0.18em] text-[var(--gm-text-muted)] uppercase mb-1.5">Customer Notes</span>
                  <p className="text-sm text-[var(--gm-text-primary)] bg-[var(--gm-bg-surface)] border border-[var(--gm-border-subtle)] rounded-lg p-4 leading-relaxed break-words">
                    {selected.additionalMessage}
                  </p>
                </div>
              )}

              {/* Contact actions */}
              <div className="flex flex-wrap gap-3">
                <a
                  href={telHref(selected.phoneNumber)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--gm-accent-foreground)] bg-[var(--gm-accent-primary)] hover:bg-[var(--gm-accent-primary-hover)] rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  Call Customer
                </a>
                <a
                  href={waHref(selected.phoneNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] uppercase text-[#15803d] dark:text-[#25D366] bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 rounded-lg transition-colors cursor-pointer"
                >
                  WhatsApp
                </a>
              </div>

              {/* Status management */}
              <div className="pt-5 border-t border-[var(--gm-border-subtle)]">
                <span className="block text-[10px] font-bold tracking-[0.18em] text-[var(--gm-text-muted)] uppercase mb-2.5">Update Status</span>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={statusDraft}
                    onChange={(e) => { setStatusDraft(e.target.value as Status); setStatusFeedback(null); }}
                    className="flex-1 bg-[var(--gm-bg-surface)] border border-[var(--gm-border-subtle)] rounded-lg px-3 py-2.5 text-sm text-[var(--gm-text-primary)] focus:border-[var(--gm-accent-primary)] focus:outline-none transition-colors cursor-pointer"
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={saveStatus}
                    disabled={statusSaving || statusDraft === selected.status}
                    className="inline-flex items-center justify-center px-6 py-2.5 text-[11px] font-semibold tracking-[0.16em] uppercase text-[var(--gm-accent-foreground)] bg-[var(--gm-accent-primary)] hover:bg-[var(--gm-accent-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer shadow-sm"
                  >
                    {statusSaving ? 'Saving…' : 'Save'}
                  </button>
                </div>
                {statusFeedback && (
                  <p className={`mt-3 text-[13px] ${statusFeedback.ok ? 'text-[#15803d] dark:text-[#25D366]' : 'text-red-500 dark:text-red-300'}`}>
                    {statusFeedback.msg}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <span className="block text-[10px] font-bold tracking-[0.18em] text-[var(--gm-text-muted)] uppercase mb-1.5">{label}</span>
      <span className={`block text-[var(--gm-text-primary)] break-words ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
