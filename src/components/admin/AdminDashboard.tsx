import { useEffect, useMemo, useState } from 'react';
import { SERVICES } from '../site/servicesData';

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
  registrationNumber: string;
  serviceCategory: string;
  specificService: string;
  preferredDate: string;
  preferredTime: string;
  status: Status;
  additionalMessage: string;
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
      return 'text-[#E5A84B] border-[#E5A84B]/30 bg-[#E5A84B]/10';
    case 'Confirmed':
      return 'text-[#B88952] border-[#B88952]/40 bg-[#B88952]/10';
    case 'In Progress':
      return 'text-[#60A5FA] border-[#60A5FA]/30 bg-[#60A5FA]/10';
    case 'Completed':
      return 'text-[#25D366] border-[#25D366]/30 bg-[#25D366]/10';
    case 'Cancelled':
      return 'text-[#FF5F5F] border-[#FF5F5F]/30 bg-[#FF5F5F]/10';
    default:
      return 'text-[#A7AAAD] border-white/10 bg-white/5';
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

  const filtered = useMemo(() => {
    let list = [...(bookings || [])];
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((b) =>
        [b.id, b.customerName, b.phoneNumber, b.vehicle, b.registrationNumber]
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
            <span className="w-4 h-px bg-[#B88952]" />
            <span className="text-[10px] font-semibold tracking-[0.25em] text-[#B88952] uppercase">Workshop Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.02em] text-[#F2F0EA] uppercase">
            Bookings Dashboard
          </h1>
        </div>
        <button
          type="button"
          onClick={loadBookings}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] uppercase text-[#F2F0EA] bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
        >
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {([
          { label: 'Total', value: counts.total, accent: 'text-[#F2F0EA]' },
          { label: 'Pending', value: counts.Pending, accent: 'text-[#E5A84B]' },
          { label: 'Confirmed', value: counts.Confirmed, accent: 'text-[#B88952]' },
          { label: 'In Progress', value: counts['In Progress'], accent: 'text-[#60A5FA]' },
          { label: 'Completed', value: counts.Completed, accent: 'text-[#25D366]' },
          { label: 'Cancelled', value: counts.Cancelled, accent: 'text-[#FF5F5F]' },
        ]).map((card) => (
          <div key={card.label} className="rounded-xl border border-white/8 bg-[#111315] p-4">
            <div className={`text-2xl font-extrabold tracking-[-0.02em] ${card.accent}`}>
              {isLoading ? '—' : card.value}
            </div>
            <div className="mt-1 text-[10px] font-semibold tracking-[0.14em] uppercase text-[#A7AAAD]/70">
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-white/8 bg-[#111315] p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className="sr-only" htmlFor="admin-search">Search</label>
            <input
              id="admin-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ID, customer, phone, vehicle or reg. no."
              className="w-full bg-[#0A0C0D] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-[#F2F0EA] placeholder-[#A7AAAD]/40 focus:border-[#B88952] focus:outline-none transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'All' | Status)}
            className="w-full bg-[#0A0C0D] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-[#F2F0EA] focus:border-[#B88952] focus:outline-none transition-colors cursor-pointer"
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
              className="flex-1 min-w-0 bg-[#0A0C0D] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-[#F2F0EA] focus:border-[#B88952] focus:outline-none transition-colors cursor-pointer"
            />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              className="bg-[#0A0C0D] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-[#F2F0EA] focus:border-[#B88952] focus:outline-none transition-colors cursor-pointer"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>
        {(query || statusFilter !== 'All' || dateFilter) && (
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[12px] text-[#A7AAAD]">{filtered.length} result{filtered.length === 1 ? '' : 's'}</span>
            <button
              type="button"
              onClick={() => { setQuery(''); setStatusFilter('All'); setDateFilter(''); }}
              className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#B88952] hover:text-[#caa066] transition-colors cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Table / states */}
      <div className="rounded-xl border border-white/8 bg-[#111315] overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#B88952]/20 border-t-[#B88952] animate-spin" />
          </div>
        ) : error ? (
          <div className="py-12 px-6 text-center">
            <p className="text-sm text-red-300">{error}</p>
            <button
              type="button"
              onClick={loadBookings}
              className="mt-4 inline-flex items-center px-5 py-2.5 text-[11px] font-semibold tracking-[0.16em] uppercase text-[#0A0C0D] bg-[#B88952] hover:bg-[#caa066] rounded-lg transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <p className="text-sm text-[#A7AAAD]">
              {bookings && bookings.length === 0 ? 'No bookings have been created yet.' : 'No bookings match your filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/8 text-[10px] uppercase tracking-[0.14em] text-[#A7AAAD]/70">
                  <th className="px-4 py-3 font-semibold">Booking ID</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold hidden md:table-cell">Phone</th>
                  <th className="px-4 py-3 font-semibold hidden lg:table-cell">Vehicle</th>
                  <th className="px-4 py-3 font-semibold hidden lg:table-cell">Service</th>
                  <th className="px-4 py-3 font-semibold hidden xl:table-cell">Requested</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold hidden xl:table-cell">Created</th>
                  <th className="px-4 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-[#F2F0EA] whitespace-nowrap">{b.id}</td>
                    <td className="px-4 py-3 text-[#F2F0EA] whitespace-nowrap">{b.customerName}</td>
                    <td className="px-4 py-3 text-[#A7AAAD] font-mono whitespace-nowrap hidden md:table-cell">{b.phoneNumber}</td>
                    <td className="px-4 py-3 text-[#A7AAAD] whitespace-nowrap hidden lg:table-cell">{b.vehicle}</td>
                    <td className="px-4 py-3 text-[#A7AAAD] whitespace-nowrap hidden lg:table-cell">{serviceTitle(b.serviceCategory)}</td>
                    <td className="px-4 py-3 text-[#A7AAAD] whitespace-nowrap hidden xl:table-cell">
                      {b.preferredDate}{b.preferredTime ? ` · ${b.preferredTime}` : ''}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3 text-[#A7AAAD]/70 whitespace-nowrap hidden xl:table-cell">{formatDateTime(b.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openDetails(b)}
                        className="inline-flex items-center px-3 py-1.5 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#F2F0EA] bg-white/5 hover:bg-[#B88952] hover:text-[#0A0C0D] border border-white/10 hover:border-[#B88952] rounded-lg transition-all cursor-pointer whitespace-nowrap"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 sm:p-6 bg-[#040404]/85 backdrop-blur-md overflow-y-auto"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-[#0D0F12] border border-white/10 rounded-2xl max-w-2xl w-full relative shadow-2xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 px-6 sm:px-8 pt-6 pb-5 border-b border-white/8">
              <div>
                <span className="text-[10px] font-semibold tracking-[0.22em] text-[#B88952] uppercase block mb-1">Booking Details</span>
                <h2 className="text-2xl font-mono font-bold text-[#F2F0EA]">{selected.id}</h2>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={selected.status} />
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label="Close"
                  className="w-9 h-9 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#A7AAAD] hover:text-[#F2F0EA] transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="px-6 sm:px-8 py-6 space-y-6">
              <div className="grid sm:grid-cols-2 gap-x-10 gap-y-5 text-sm">
                <Field label="Customer Name" value={selected.customerName} />
                <Field label="Phone" value={selected.phoneNumber} mono />
                <Field label="Email" value={selected.email || '—'} />
                <Field label="Registration" value={selected.registrationNumber} mono />
                <Field label="Vehicle" value={`${selected.vehicleMake} ${selected.vehicleModel}`.trim()} />
                <Field label="Service Category" value={serviceTitle(selected.serviceCategory)} />
                <Field label="Specific Service" value={selected.specificService || '—'} />
                <Field label="Requested" value={`${selected.preferredDate}${selected.preferredTime ? ` · ${selected.preferredTime}` : ''}`} />
                <Field label="Created" value={formatDateTime(selected.createdAt)} />
              </div>

              {selected.additionalMessage && (
                <div>
                  <span className="block text-[10px] font-bold tracking-[0.18em] text-[#A7AAAD]/60 uppercase mb-1.5">Customer Notes</span>
                  <p className="text-sm text-[#F2F0EA]/90 bg-[#0A0C0D] border border-white/5 rounded-lg p-4 leading-relaxed">
                    {selected.additionalMessage}
                  </p>
                </div>
              )}

              {/* Contact actions */}
              <div className="flex flex-wrap gap-3">
                <a
                  href={telHref(selected.phoneNumber)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] uppercase text-[#0A0C0D] bg-[#B88952] hover:bg-[#caa066] rounded-lg transition-colors cursor-pointer"
                >
                  Call Customer
                </a>
                <a
                  href={waHref(selected.phoneNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] uppercase text-[#F2F0EA] bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 rounded-lg transition-colors cursor-pointer"
                >
                  WhatsApp
                </a>
              </div>

              {/* Status management */}
              <div className="pt-5 border-t border-white/8">
                <span className="block text-[10px] font-bold tracking-[0.18em] text-[#A7AAAD]/60 uppercase mb-2.5">Update Status</span>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={statusDraft}
                    onChange={(e) => { setStatusDraft(e.target.value as Status); setStatusFeedback(null); }}
                    className="flex-1 bg-[#0A0C0D] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-[#F2F0EA] focus:border-[#B88952] focus:outline-none transition-colors cursor-pointer"
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={saveStatus}
                    disabled={statusSaving || statusDraft === selected.status}
                    className="inline-flex items-center justify-center px-6 py-2.5 text-[11px] font-semibold tracking-[0.16em] uppercase text-[#0A0C0D] bg-[#B88952] hover:bg-[#caa066] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
                  >
                    {statusSaving ? 'Saving…' : 'Save'}
                  </button>
                </div>
                {statusFeedback && (
                  <p className={`mt-3 text-[13px] ${statusFeedback.ok ? 'text-[#25D366]' : 'text-red-300'}`}>
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
    <div>
      <span className="block text-[10px] font-bold tracking-[0.18em] text-[#A7AAAD]/60 uppercase mb-1.5">{label}</span>
      <span className={`block text-[#F2F0EA] ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
