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
  source?: string;
  isArchived?: boolean;
  archivedAt?: string | null;
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

function sourceStyles(source?: string) {
  switch (source) {
    case 'Google':
      return {
        badge:
          'text-[#2563eb] dark:text-[#93c5fd] border-[#3b82f6]/40 dark:border-[#60a5fa]/50 bg-[#3b82f6]/10 shadow-[0_0_12px_rgba(59,130,246,0.35)]',
        dot: 'bg-[#3b82f6] dark:bg-[#60a5fa] shadow-[0_0_8px_#3b82f6]',
      };
    case 'Facebook':
      return {
        badge:
          'text-[#4f46e5] dark:text-[#a5b4fc] border-[#6366f1]/40 dark:border-[#818cf8]/50 bg-[#6366f1]/10 shadow-[0_0_12px_rgba(99,102,241,0.35)]',
        dot: 'bg-[#6366f1] dark:bg-[#818cf8] shadow-[0_0_8px_#6366f1]',
      };
    case 'Instagram':
      return {
        badge:
          'text-[#db2777] dark:text-[#f9a8d4] border-[#ec4899]/40 dark:border-[#f472b6]/50 bg-[#ec4899]/10 shadow-[0_0_12px_rgba(236,72,153,0.35)]',
        dot: 'bg-[#ec4899] dark:bg-[#f472b6] shadow-[0_0_8px_#ec4899]',
      };
    case 'WhatsApp':
      return {
        badge:
          'text-[#059669] dark:text-[#6ee7b7] border-[#10b981]/40 dark:border-[#34d399]/50 bg-[#10b981]/10 shadow-[0_0_12px_rgba(16,185,129,0.35)]',
        dot: 'bg-[#10b981] dark:bg-[#34d399] shadow-[0_0_8px_#10b981]',
      };
    case 'Referral':
      return {
        badge:
          'text-[var(--gm-accent-primary)] border-[var(--gm-accent-border)] hover:border-[var(--gm-accent-border-hover)] bg-[var(--gm-accent-muted)] shadow-[0_0_12px_var(--gm-accent-glow)]',
        dot: 'bg-[var(--gm-accent-primary)] shadow-[0_0_8px_var(--gm-accent-primary)]',
      };
    case 'Direct/Unknown':
      return {
        badge:
          'text-[#0891b2] dark:text-[#67e8f9] border-[#06b6d4]/40 dark:border-[#22d3ee]/50 bg-[#06b6d4]/10 shadow-[0_0_12px_rgba(6,182,212,0.3)]',
        dot: 'bg-[#06b6d4] dark:bg-[#22d3ee] shadow-[0_0_8px_#22d3ee]',
      };
    case 'Unknown':
    default:
      return {
        badge:
          'text-[var(--gm-text-muted)] border-[var(--gm-border-medium)] bg-[var(--gm-bg-card-subtle)] shadow-[0_0_8px_rgba(255,255,255,0.06)]',
        dot: 'bg-[var(--gm-text-muted)] shadow-[0_0_4px_rgba(255,255,255,0.2)]',
      };
  }
}

function SourceBadge({ source }: { source?: string }) {
  const displaySource = source || 'Unknown';
  const styles = sourceStyles(displaySource);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold tracking-[0.1em] uppercase rounded-full border backdrop-blur-xs transition-all duration-200 shrink-0 max-w-full ${styles.badge}`}
      title={`Lead source: ${displaySource}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles.dot}`} />
      <span className="truncate">{displaySource}</span>
    </span>
  );
}

export function AdminDashboard({
  initialBookings,
  initialLoading,
}: {
  initialBookings?: AdminBooking[];
  initialLoading?: boolean;
} = {}) {
  const [bookings, setBookings] = useState<AdminBooking[] | null>(initialBookings ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(initialLoading ?? (initialBookings ? false : true));

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | Status>('All');
  const [dateFilter, setDateFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [viewTab, setViewTab] = useState<'active' | 'archived'>('active');

  const [selected, setSelected] = useState<AdminBooking | null>(null);
  const [statusDraft, setStatusDraft] = useState<Status | ''>('');
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deletingBooking, setDeletingBooking] = useState<AdminBooking | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

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
    if (!initialBookings) {
      loadBookings();
    }
  }, [initialBookings]);

  const overallCounts = useMemo(() => {
    let active = 0;
    let archived = 0;
    (bookings || []).forEach((b) => {
      if (b.isArchived) archived += 1;
      else active += 1;
    });
    return { active, archived };
  }, [bookings]);

  const counts = useMemo(() => {
    const isArchivedTab = viewTab === 'archived';
    const base = { total: 0, Pending: 0, Confirmed: 0, 'In Progress': 0, Completed: 0, Cancelled: 0 } as Record<string, number>;
    (bookings || []).forEach((b) => {
      if (Boolean(b.isArchived) === isArchivedTab) {
        base.total += 1;
        if (base[b.status] !== undefined) base[b.status] += 1;
      }
    });
    return base;
  }, [bookings, viewTab]);

  const repeatCustomerMap = useMemo(() => {
    return calculateRepeatCustomers(bookings || []);
  }, [bookings]);

  const filtered = useMemo(() => {
    let list = [...(bookings || [])];
    if (viewTab === 'active') {
      list = list.filter((b) => !b.isArchived);
    } else {
      list = list.filter((b) => Boolean(b.isArchived));
    }

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
          b.source,
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
  }, [bookings, viewTab, query, statusFilter, dateFilter, sortOrder]);

  const openDetails = (b: AdminBooking) => {
    setSelected(b);
    setStatusDraft(b.status);
    setStatusFeedback(null);
  };

  const handleArchive = async (booking: AdminBooking) => {
    setActionLoadingId(booking.id);
    try {
      const resp = await fetch(`/api/admin/bookings/${encodeURIComponent(booking.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: true }),
      });
      if (resp.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data.error || 'Failed to archive booking.');
      }
      const now = new Date().toISOString();
      setBookings((prev) =>
        (prev || []).map((b) =>
          b.id === booking.id ? { ...b, isArchived: true, archivedAt: now } : b
        )
      );
      setSelected((prev) =>
        prev && prev.id === booking.id ? { ...prev, isArchived: true, archivedAt: now } : prev
      );
      showToast('success', `Booking ${booking.id} archived. Accessible under Archived Bookings tab.`);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to archive booking.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRestore = async (booking: AdminBooking) => {
    setActionLoadingId(booking.id);
    try {
      const resp = await fetch(`/api/admin/bookings/${encodeURIComponent(booking.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: false }),
      });
      if (resp.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data.error || 'Failed to restore booking.');
      }
      setBookings((prev) =>
        (prev || []).map((b) =>
          b.id === booking.id ? { ...b, isArchived: false, archivedAt: null } : b
        )
      );
      setSelected((prev) =>
        prev && prev.id === booking.id ? { ...prev, isArchived: false, archivedAt: null } : prev
      );
      showToast('success', `Booking ${booking.id} restored to Active Bookings.`);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to restore booking.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openDeleteConfirm = (booking: AdminBooking) => {
    setDeletingBooking(booking);
    setDeleteConfirmInput('');
    setDeleteError(null);
  };

  const handleDelete = async () => {
    if (!deletingBooking) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const resp = await fetch(`/api/admin/bookings/${encodeURIComponent(deletingBooking.id)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (resp.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data.error || 'Failed to delete booking.');
      }
      const targetId = deletingBooking.id;
      setBookings((prev) => (prev || []).filter((b) => b.id !== targetId));
      if (selected?.id === targetId) {
        setSelected(null);
      }
      setDeletingBooking(null);
      setDeleteConfirmInput('');
      showToast('success', `Booking ${targetId} permanently deleted.`);
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete booking.');
    } finally {
      setIsDeleting(false);
    }
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

      {/* Toast alert */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-xs font-semibold backdrop-blur-md transition-all ${
            toast.type === 'success'
              ? 'bg-[#15803d]/90 text-white border-[#25D366]/40'
              : 'bg-red-900/90 text-white border-red-500/40'
          }`}
        >
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 text-white/80 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* View Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--gm-border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setViewTab('active'); }}
            className={`inline-flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold tracking-[0.12em] uppercase rounded-lg transition-all cursor-pointer ${
              viewTab === 'active'
                ? 'bg-[var(--gm-accent-primary)] text-[var(--gm-accent-foreground)] shadow-sm'
                : 'text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)] hover:bg-[var(--gm-bg-card)] border border-transparent hover:border-[var(--gm-border-subtle)]'
            }`}
          >
            <span>Active Bookings</span>
            <span className={`px-2 py-0.5 text-[10px] rounded-full font-mono font-semibold ${
              viewTab === 'active'
                ? 'bg-black/25 text-white'
                : 'bg-[var(--gm-bg-card)] text-[var(--gm-text-muted)] border border-[var(--gm-border-subtle)]'
            }`}>
              {isLoading ? '…' : overallCounts.active}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setViewTab('archived'); }}
            className={`inline-flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold tracking-[0.12em] uppercase rounded-lg transition-all cursor-pointer ${
              viewTab === 'archived'
                ? 'bg-[var(--gm-accent-primary)] text-[var(--gm-accent-foreground)] shadow-sm'
                : 'text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)] hover:bg-[var(--gm-bg-card)] border border-transparent hover:border-[var(--gm-border-subtle)]'
            }`}
          >
            <span>Archived Bookings</span>
            <span className={`px-2 py-0.5 text-[10px] rounded-full font-mono font-semibold ${
              viewTab === 'archived'
                ? 'bg-black/25 text-white'
                : 'bg-[var(--gm-bg-card)] text-[var(--gm-text-muted)] border border-[var(--gm-border-subtle)]'
            }`}>
              {isLoading ? '…' : overallCounts.archived}
            </span>
          </button>
        </div>

        {viewTab === 'archived' && (
          <span className="text-xs text-[var(--gm-text-muted)] italic">
            Customer tracking & service statuses remain active for archived bookings.
          </span>
        )}
      </div>

      {viewTab === 'archived' && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs leading-relaxed text-amber-700 dark:text-amber-300">
          <span className="text-base shrink-0">📁</span>
          <div>
            <strong className="font-semibold block uppercase tracking-wider text-[11px] mb-0.5">Archived Bookings Archive</strong>
            Archived bookings are removed from the active workshop workflow. They remain fully intact with customer details, vehicle data, and lead sources. Customers can still track them using their Booking ID. You can restore bookings back to the active list or permanently delete them when authorized.
          </div>
        </div>
      )}

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
      {isLoading ? (
        <div className="rounded-xl border border-[var(--gm-border-subtle)] bg-[var(--gm-bg-card)] overflow-hidden shadow-sm py-16 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--gm-accent-primary)]/20 border-t-[var(--gm-accent-primary)] animate-spin" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-[var(--gm-border-subtle)] bg-[var(--gm-bg-card)] overflow-hidden shadow-sm py-12 px-6 text-center">
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
        <div className="rounded-xl border border-[var(--gm-border-subtle)] bg-[var(--gm-bg-card)] overflow-hidden shadow-sm py-16 px-6 text-center">
          <p className="text-sm text-[var(--gm-text-secondary)]">
            {bookings && bookings.length === 0 ? 'No bookings have been created yet.' : 'No bookings match your filters.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table: fits expanded width with responsive horizontal scrolling fallback */}
          <div className="hidden lg:block rounded-xl border border-[var(--gm-border-subtle)] bg-[var(--gm-bg-card)] overflow-hidden shadow-sm">
            <div className="w-full overflow-x-auto [scrollbar-width:thin] [scrollbar-color:var(--gm-border-medium)_transparent]">
              <table className={`w-full table-fixed text-left text-sm divide-y divide-[var(--gm-border-subtle)] ${viewTab === 'active' ? 'min-w-[1180px]' : 'min-w-[1240px]'}`}>
                <thead className="bg-[var(--gm-bg-surface)]">
                  <tr className="text-[10px] uppercase tracking-[0.14em] text-[var(--gm-text-secondary)]">
                    <th className="w-[10%] min-w-[120px] px-3.5 py-3.5 font-semibold">Booking ID</th>
                    <th className={`${viewTab === 'active' ? 'w-[15%]' : 'w-[14%]'} min-w-[150px] px-3.5 py-3.5 font-semibold`}>Customer</th>
                    <th className="w-[9%] min-w-[110px] px-3.5 py-3.5 font-semibold">Phone</th>
                    <th className={`${viewTab === 'active' ? 'w-[14%]' : 'w-[13%]'} min-w-[145px] px-3.5 py-3.5 font-semibold`}>Vehicle</th>
                    <th className={`${viewTab === 'active' ? 'w-[14%]' : 'w-[13%]'} min-w-[145px] px-3.5 py-3.5 font-semibold`}>Service</th>
                    <th className={`${viewTab === 'active' ? 'w-[9%]' : 'w-[8%]'} min-w-[100px] px-3.5 py-3.5 font-semibold`}>Requested</th>
                    <th className="w-[9%] min-w-[115px] px-3.5 py-3.5 font-semibold">Status</th>
                    <th className={`${viewTab === 'active' ? 'w-[10%]' : 'w-[9%]'} min-w-[130px] px-3.5 py-3.5 font-semibold text-[var(--gm-text-primary)]`}>Source</th>
                    <th className={`${viewTab === 'active' ? 'w-[10%] min-w-[165px]' : 'w-[15%] min-w-[225px]'} px-3.5 py-3.5 font-semibold text-right`}>Actions</th>
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
                        <td className="px-3.5 py-3.5 align-middle">
                          <span
                            className="font-mono font-semibold text-xs text-[var(--gm-text-primary)] whitespace-nowrap tracking-wide select-all block truncate"
                            title={`Booking ID: ${b.id}`}
                          >
                            {b.id}
                          </span>
                        </td>

                        {/* Customer */}
                        <td className="px-3.5 py-3.5 align-middle">
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
                        <td className="px-3.5 py-3.5 align-middle">
                          <a
                            href={telHref(phoneNum)}
                            className="truncate block font-mono text-xs text-[var(--gm-text-secondary)] hover:text-[var(--gm-accent-primary)] transition-colors"
                            title={`Call ${phoneNum}`}
                          >
                            {phoneNum}
                          </a>
                        </td>

                        {/* Vehicle */}
                        <td className="px-3.5 py-3.5 align-middle">
                          <div
                            className="truncate text-xs font-medium text-[var(--gm-text-primary)]"
                            title={vehicleName}
                          >
                            {vehicleName}
                          </div>
                          {(b.vehicleMake || b.vehicleModel || b.fuelType) && (
                            <div className="flex items-center gap-1.5 text-[10px] text-[var(--gm-text-secondary)] mt-0.5 truncate">
                              <span className="text-[var(--gm-accent-primary)] font-semibold truncate" title={b.vehicleMake}>{b.vehicleMake || '—'}</span>
                              <span className="text-[var(--gm-border-medium)] shrink-0">•</span>
                              <span className="truncate" title={b.vehicleModel}>{b.vehicleModel || '—'}</span>
                              {b.fuelType && (
                                <>
                                  <span className="text-[var(--gm-border-medium)] shrink-0">•</span>
                                  <span className="text-[#b45309] dark:text-[#E5A84B] font-medium shrink-0" title={`Fuel: ${b.fuelType}`}>{b.fuelType}</span>
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
                        <td className="px-3.5 py-3.5 align-middle">
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
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider uppercase rounded shrink-0 ${
                              b.serviceLocation === 'Doorstep Service'
                                ? 'bg-[var(--gm-accent-muted)] text-[var(--gm-accent-primary)] border border-[var(--gm-accent-border)]'
                                : 'bg-[var(--gm-bg-surface)] text-[var(--gm-text-secondary)] border border-[var(--gm-border-subtle)]'
                            }`}>
                              {b.serviceLocation === 'Doorstep Service' ? '🏠 Doorstep' : '🏢 Workshop'}
                            </span>
                            {b.serviceLocation === 'Doorstep Service' && b.doorstepCity && (
                              <span className="text-[10px] text-[var(--gm-text-muted)] truncate" title={`Doorstep City: ${b.doorstepCity}`}>
                                ({b.doorstepCity})
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Requested */}
                        <td className="px-3.5 py-3.5 align-middle">
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
                        <td className="px-3.5 py-3.5 align-middle whitespace-nowrap">
                          <StatusBadge status={b.status} />
                        </td>

                        {/* Source */}
                        <td className="px-3.5 py-3.5 align-middle whitespace-nowrap">
                          <SourceBadge source={b.source} />
                        </td>

                        {/* Action */}
                        <td className="px-3.5 py-3.5 align-middle text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 sm:gap-2 justify-end shrink-0">
                            <button
                              type="button"
                              onClick={() => openDetails(b)}
                              className="inline-flex items-center justify-center px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--gm-text-primary)] bg-[var(--gm-bg-surface)] hover:bg-[var(--gm-accent-primary)] hover:text-[var(--gm-accent-foreground)] border border-[var(--gm-border-subtle)] hover:border-[var(--gm-accent-primary)] rounded-md transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-xs"
                              title="View full booking details"
                            >
                              View
                            </button>
                            {viewTab === 'active' ? (
                              <button
                                type="button"
                                onClick={() => handleArchive(b)}
                                disabled={actionLoadingId === b.id}
                                className="inline-flex items-center justify-center px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--gm-text-secondary)] hover:text-amber-500 dark:hover:text-amber-400 hover:border-amber-500/40 hover:bg-amber-500/10 bg-[var(--gm-bg-surface)] border border-[var(--gm-border-subtle)] rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50 shadow-xs"
                                title="Archive booking (removes from active view, keeps tracking)"
                              >
                                {actionLoadingId === b.id ? '…' : 'Archive'}
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleRestore(b)}
                                  disabled={actionLoadingId === b.id}
                                  className="inline-flex items-center justify-center px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] uppercase text-[#15803d] dark:text-[#25D366] bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50 shadow-xs"
                                  title="Restore booking to active list"
                                >
                                  {actionLoadingId === b.id ? '…' : 'Restore'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openDeleteConfirm(b)}
                                  className="inline-flex items-center justify-center px-2 py-1 text-[11px] font-semibold tracking-[0.08em] uppercase text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-xs"
                                  title="Permanently delete booking"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile / Tablet Responsive Separated Card Layout */}
          <div className="lg:hidden space-y-4">
            {filtered.map((b) => {
              const vehicleName = b.vehicle || `${b.vehicleMake || ''} ${b.vehicleModel || ''}`.trim() || '—';
              const categoryName = serviceTitle(b.serviceCategory);
              const phoneNum = b.phoneNumber || b.phone;
              const custName = b.customerName || b.fullName || '—';
              const repeatInfo = repeatCustomerMap.get(b.id);

              return (
                <article
                  key={b.id}
                  className="rounded-xl border border-[var(--gm-border-subtle)] bg-[var(--gm-bg-card)] p-4 sm:p-5 shadow-xs space-y-3.5 transition-all"
                >
                  {/* Card Header: Booking ID & Status */}
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--gm-border-subtle)]">
                    <div className="min-w-0">
                      <span className="block text-[9px] font-bold tracking-[0.18em] uppercase text-[var(--gm-text-muted)] mb-0.5">Booking ID</span>
                      <span
                        className="font-mono font-bold text-sm sm:text-base text-[var(--gm-text-primary)] tracking-wide select-all break-all"
                        title={`Booking ID: ${b.id}`}
                      >
                        {b.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-semibold tracking-wider uppercase rounded ${
                        b.serviceLocation === 'Doorstep Service'
                          ? 'bg-[var(--gm-accent-muted)] text-[var(--gm-accent-primary)] border border-[var(--gm-accent-border)]'
                          : 'bg-[var(--gm-bg-surface)] text-[var(--gm-text-secondary)] border border-[var(--gm-border-subtle)]'
                      }`}>
                        {b.serviceLocation === 'Doorstep Service' ? '🏠 Doorstep' : '🏢 Workshop'}
                      </span>
                      <StatusBadge status={b.status} />
                    </div>
                  </div>

                  {/* Customer Details & Quick Contact */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="block text-[9px] font-bold tracking-[0.18em] uppercase text-[var(--gm-text-muted)] mb-0.5">Customer</span>
                      <h3
                        className="text-sm font-semibold text-[var(--gm-text-primary)] break-words leading-snug"
                        title={custName}
                      >
                        {custName}
                      </h3>
                      {b.email && (
                        <p className="text-xs text-[var(--gm-text-muted)] break-all mt-0.5" title={b.email}>
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
                      <div className="flex items-center gap-1.5 shrink-0 pt-3">
                        <a
                          href={telHref(phoneNum)}
                          className="inline-flex items-center justify-center min-h-[30px] px-3 py-1 text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--gm-text-primary)] bg-[var(--gm-bg-surface)] hover:bg-[var(--gm-bg-card-hover)] border border-[var(--gm-border-subtle)] rounded-md transition-colors shadow-xs"
                          title={`Call ${phoneNum}`}
                        >
                          Call
                        </a>
                        <a
                          href={waHref(phoneNum)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center min-h-[30px] px-3 py-1 text-[11px] font-semibold tracking-[0.08em] uppercase text-[#15803d] dark:text-[#25D366] bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 rounded-md transition-colors shadow-xs"
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
                          <span className="w-1.5 h-1.5 rounded-full bg-[#b45309] dark:bg-[#E5A84B] animate-pulse" />
                          Multiple Bookings Found
                        </span>
                        <span className="text-[10px] font-semibold text-[var(--gm-text-primary)] bg-[var(--gm-bg-surface)] px-2 py-0.5 rounded-full border border-[var(--gm-border-subtle)]">
                          {repeatInfo.totalBookingCount} Total
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] text-[var(--gm-text-muted)] shrink-0">Other Bookings:</span>
                        {repeatInfo.otherBookingIds.map((otherId) => {
                          const otherBooking = (bookings || []).find((x) => x.id === otherId);
                          return (
                            <button
                              key={otherId}
                              type="button"
                              onClick={() => {
                                if (otherBooking) openDetails(otherBooking);
                              }}
                              className="inline-flex items-center min-h-[26px] px-2.5 py-0.5 rounded-md bg-[var(--gm-bg-surface)] border border-[var(--gm-border-subtle)] hover:border-[var(--gm-accent-primary)] font-mono text-[10px] font-semibold text-[var(--gm-accent-primary)] hover:text-[var(--gm-accent-primary-hover)] transition-colors cursor-pointer shrink-0"
                              title={`Open booking ${otherId}`}
                            >
                              {otherId}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Vehicle, Service, Schedule & Source Details */}
                  <div className="rounded-lg bg-[var(--gm-bg-surface)] border border-[var(--gm-border-subtle)] p-3 space-y-3 text-xs">
                    {/* Vehicle */}
                    <div className="min-w-0">
                      <span className="block text-[9px] font-bold tracking-[0.16em] uppercase text-[var(--gm-text-muted)] mb-0.5">Vehicle</span>
                      <p className="text-[var(--gm-text-primary)] font-semibold text-xs break-words" title={vehicleName}>
                        {vehicleName}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-[var(--gm-text-secondary)]">
                        {(b.vehicleMake || b.vehicleModel) && (
                          <span className="text-[var(--gm-accent-primary)] font-medium">
                            {b.vehicleMake || '—'} / {b.vehicleModel || '—'}
                          </span>
                        )}
                        {b.fuelType && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#b45309]/10 dark:bg-[#E5A84B]/15 text-[#b45309] dark:text-[#E5A84B] border border-[#b45309]/30">
                            Fuel: {b.fuelType}
                          </span>
                        )}
                        {b.registrationNumber && (
                          <span className="font-mono text-[10px] text-[var(--gm-text-muted)] bg-[var(--gm-bg-card)] px-1.5 py-0.5 rounded border border-[var(--gm-border-subtle)]" title={`Reg: ${b.registrationNumber}`}>
                            {b.registrationNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Service */}
                    <div className="min-w-0 pt-2.5 border-t border-[var(--gm-border-subtle)]">
                      <span className="block text-[9px] font-bold tracking-[0.16em] uppercase text-[var(--gm-text-muted)] mb-0.5">Service</span>
                      <p className="text-[var(--gm-text-primary)] font-semibold text-xs break-words" title={categoryName}>
                        {categoryName}
                      </p>
                      {b.specificService && (
                        <p className="text-[11px] text-[var(--gm-text-muted)] mt-0.5 break-words" title={b.specificService}>
                          {b.specificService}
                        </p>
                      )}
                      {b.serviceLocation === 'Doorstep Service' && b.doorstepCity && (
                        <p className="text-[10px] text-[var(--gm-text-muted)] mt-1">
                          Doorstep City: {b.doorstepCity}
                        </p>
                      )}
                    </div>

                    {/* Requested & Lead Source */}
                    <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-[var(--gm-border-subtle)]">
                      <div className="min-w-0">
                        <span className="block text-[9px] font-bold tracking-[0.16em] uppercase text-[var(--gm-text-muted)] mb-0.5">Requested</span>
                        <p className="font-mono text-xs text-[var(--gm-text-primary)]" title={`${b.preferredDate}${b.preferredTime ? ` · ${b.preferredTime}` : ''}`}>
                          {b.preferredDate || '—'}
                        </p>
                        {b.preferredTime && (
                          <p className="text-[10px] text-[var(--gm-text-muted)] truncate">{b.preferredTime}</p>
                        )}
                      </div>

                      <div className="min-w-0">
                        <span className="block text-[9px] font-bold tracking-[0.16em] uppercase text-[var(--gm-text-muted)] mb-1">Lead Source</span>
                        <SourceBadge source={b.source} />
                      </div>
                    </div>
                  </div>

                  {/* Card Dedicated Footer: View Details & Actions */}
                  <div className="pt-3 border-t border-[var(--gm-border-subtle)] flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => openDetails(b)}
                      className="flex-1 min-h-[38px] inline-flex items-center justify-center px-3 py-2 text-xs font-semibold tracking-[0.08em] uppercase text-[var(--gm-text-primary)] bg-[var(--gm-bg-surface)] hover:bg-[var(--gm-accent-primary)] hover:text-[var(--gm-accent-foreground)] border border-[var(--gm-border-subtle)] hover:border-[var(--gm-accent-primary)] rounded-lg transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                    >
                      View Details
                    </button>
                    {viewTab === 'active' ? (
                      <button
                        type="button"
                        onClick={() => handleArchive(b)}
                        disabled={actionLoadingId === b.id}
                        className="flex-1 min-h-[38px] inline-flex items-center justify-center px-3 py-2 text-xs font-semibold tracking-[0.08em] uppercase text-[var(--gm-text-secondary)] hover:text-amber-500 dark:hover:text-amber-400 hover:border-amber-500/40 hover:bg-amber-500/10 bg-[var(--gm-bg-surface)] border border-[var(--gm-border-subtle)] rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-xs active:scale-[0.98]"
                      >
                        {actionLoadingId === b.id ? 'Archiving…' : 'Archive'}
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleRestore(b)}
                          disabled={actionLoadingId === b.id}
                          className="flex-1 min-h-[38px] inline-flex items-center justify-center px-3 py-2 text-xs font-semibold tracking-[0.08em] uppercase text-[#15803d] dark:text-[#25D366] bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-xs active:scale-[0.98]"
                        >
                          {actionLoadingId === b.id ? 'Restoring…' : 'Restore'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteConfirm(b)}
                          className="flex-1 min-h-[38px] inline-flex items-center justify-center px-3 py-2 text-xs font-semibold tracking-[0.08em] uppercase text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

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
              <div className="flex items-center gap-2.5 flex-wrap">
                <StatusBadge status={selected.status} />
                {selected.isArchived && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Archived
                  </span>
                )}
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
              {selected.isArchived && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-3 text-xs text-amber-700 dark:text-amber-300">
                  <div className="space-y-0.5">
                    <span className="font-bold uppercase tracking-wider text-[10px] block">Archived Booking</span>
                    <p className="text-[11px] opacity-90">
                      This booking was archived on {formatDateTime(selected.archivedAt || selected.createdAt)}. Customer tracking remains active with all service details preserved.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRestore(selected)}
                    disabled={actionLoadingId === selected.id}
                    className="shrink-0 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--gm-accent-foreground)] bg-[var(--gm-accent-primary)] hover:bg-[var(--gm-accent-primary-hover)] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {actionLoadingId === selected.id ? 'Restoring…' : 'Restore'}
                  </button>
                </div>
              )}
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
                <Field label="Source">
                  <SourceBadge source={selected.source} />
                </Field>
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

              {/* Lifecycle Actions: Archive, Restore & Permanent Delete */}
              <div className="pt-5 border-t border-[var(--gm-border-subtle)] space-y-3">
                <span className="block text-[10px] font-bold tracking-[0.18em] text-[var(--gm-text-muted)] uppercase">
                  Lifecycle & Safety Management
                </span>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {selected.isArchived ? (
                    <button
                      type="button"
                      onClick={() => handleRestore(selected)}
                      disabled={actionLoadingId === selected.id}
                      className="inline-flex items-center gap-2 px-4 py-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-[#15803d] dark:text-[#25D366] bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>{actionLoadingId === selected.id ? 'Restoring…' : 'Restore to Active'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleArchive(selected)}
                      disabled={actionLoadingId === selected.id}
                      className="inline-flex items-center gap-2 px-4 py-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)] bg-[var(--gm-bg-surface)] hover:bg-[var(--gm-bg-card-hover)] border border-[var(--gm-border-subtle)] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                      <span>{actionLoadingId === selected.id ? 'Archiving…' : 'Archive Booking'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => openDeleteConfirm(selected)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Permanently Delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Confirmation Dialog */}
      {deletingBooking && (
        <div
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md"
          onClick={() => { if (!isDeleting) setDeletingBooking(null); }}
        >
          <div
            className="bg-[var(--gm-bg-card)] border border-red-500/40 rounded-2xl max-w-lg w-full relative shadow-2xl p-6 sm:p-8 space-y-6 text-[var(--gm-text-primary)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold uppercase tracking-tight text-red-500 dark:text-red-400">
                  Confirm Permanent Deletion
                </h3>
                <p className="text-xs text-[var(--gm-text-secondary)] leading-relaxed">
                  This action cannot be undone. This record will be permanently deleted from the database.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--gm-bg-surface)] border border-[var(--gm-border-subtle)] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--gm-text-muted)] font-semibold uppercase tracking-wider">Booking ID:</span>
                <span className="font-mono font-bold text-[var(--gm-text-primary)]">{deletingBooking.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--gm-text-muted)] font-semibold uppercase tracking-wider">Customer:</span>
                <span className="font-medium text-[var(--gm-text-primary)]">{deletingBooking.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--gm-text-muted)] font-semibold uppercase tracking-wider">Vehicle:</span>
                <span className="font-medium text-[var(--gm-text-primary)]">{deletingBooking.vehicle || `${deletingBooking.vehicleMake} ${deletingBooking.vehicleModel}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--gm-text-muted)] font-semibold uppercase tracking-wider">Status:</span>
                <StatusBadge status={deletingBooking.status} />
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs leading-relaxed">
              <strong>Tip:</strong> If you only wish to hide this booking from active views, use <strong>Archive</strong> instead to preserve customer tracking and audit trails.
            </div>

            <div className="space-y-2">
              <label htmlFor="delete-confirm-id" className="block text-xs font-semibold text-[var(--gm-text-primary)]">
                To confirm deletion, type <span className="font-mono font-bold text-red-500">{deletingBooking.id}</span> below:
              </label>
              <input
                id="delete-confirm-id"
                type="text"
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                placeholder={`Type ${deletingBooking.id} to confirm`}
                disabled={isDeleting}
                className="w-full bg-[var(--gm-bg-surface)] border border-[var(--gm-border-subtle)] rounded-lg px-4 py-2.5 text-sm font-mono text-[var(--gm-text-primary)] focus:border-red-500 focus:outline-none transition-colors"
                autoFocus
              />
            </div>

            {deleteError && (
              <p className="text-xs text-red-500 dark:text-red-400 font-medium">
                {deleteError}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { if (!isDeleting) setDeletingBooking(null); }}
                disabled={isDeleting}
                className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)] bg-[var(--gm-bg-surface)] hover:bg-[var(--gm-bg-card-hover)] border border-[var(--gm-border-subtle)] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || deleteConfirmInput.trim().toUpperCase() !== deletingBooking.id.toUpperCase()}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer shadow-md shadow-red-600/20"
              >
                {isDeleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  children,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <span className="block text-[10px] font-bold tracking-[0.18em] text-[var(--gm-text-muted)] uppercase mb-1.5">{label}</span>
      {children ? (
        children
      ) : (
        <span className={`block text-[var(--gm-text-primary)] break-words ${mono ? 'font-mono' : ''}`}>{value || '—'}</span>
      )}
    </div>
  );
}
