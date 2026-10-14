import { useState, useEffect, useId } from 'react';
import { SERVICES } from './servicesData';
import {
  getCustomerBookings,
  getBookingById,
  saveBookingRecord,
  STORAGE_KEY,
  type BookingRecord,
  type BookingStatus,
} from '../../lib/bookingStore';
import {
  PhoneIcon,
  WhatsAppIcon,
  ClockIcon,
  WrenchIcon,
  ArrowRightIcon,
  SearchIcon,
} from './Icons';

const PHONE_DISPLAY = '+91 86239 48898';
const PHONE_TEL = '+918623948898';
const WHATSAPP_URL = 'https://wa.me/918623948898';

const TRACKING_STEPS: Array<{ key: BookingStatus; label: string; desc: string }> = [
  { key: 'Pending', label: 'Request Received', desc: 'Awaiting workshop review' },
  { key: 'Confirmed', label: 'Bay Scheduled', desc: 'Slot & advisor assigned' },
  { key: 'In Progress', label: 'In Service', desc: 'Technicians at work on bay' },
  { key: 'Completed', label: 'Ready for Pickup', desc: 'Quality inspected & tested' },
];

function getServiceTitle(categoryId: string): string {
  const match = SERVICES.find((s) => s.id === categoryId);
  return match ? match.title : categoryId;
}

function StatusIndicator({ status }: { status: BookingStatus }) {
  const config = (() => {
    switch (status) {
      case 'Pending':
        return {
          pill: 'text-[#b45309] dark:text-[#E5A84B] border-[#b45309]/30 dark:border-[#E5A84B]/30 bg-[#b45309]/10 dark:bg-[#E5A84B]/10',
          dot: 'bg-[#b45309] dark:bg-[#E5A84B] shadow-[0_0_8px_rgba(229,168,75,0.6)]',
          label: 'Pending Review',
        };
      case 'Confirmed':
        return {
          pill: 'text-[var(--gm-accent-primary)] border-[var(--gm-accent-border)] bg-[var(--gm-accent-muted)]',
          dot: 'bg-[var(--gm-accent-primary)] shadow-[0_0_8px_var(--gm-accent-glow)]',
          label: 'Confirmed',
        };
      case 'In Progress':
        return {
          pill: 'text-[#2563eb] dark:text-[#60A5FA] border-[#2563eb]/30 dark:border-[#60A5FA]/30 bg-[#2563eb]/10 dark:bg-[#60A5FA]/10',
          dot: 'bg-[#2563eb] dark:bg-[#60A5FA] shadow-[0_0_8px_rgba(96,165,250,0.6)] animate-pulse',
          label: 'In Progress',
        };
      case 'Completed':
        return {
          pill: 'text-[#15803d] dark:text-[#25D366] border-[#15803d]/30 dark:border-[#25D366]/30 bg-[#15803d]/10 dark:bg-[#25D366]/10',
          dot: 'bg-[#15803d] dark:bg-[#25D366] shadow-[0_0_8px_rgba(37,211,102,0.6)]',
          label: 'Completed',
        };
      case 'Cancelled':
        return {
          pill: 'text-[#dc2626] dark:text-[#FF5F5F] border-[#dc2626]/30 dark:border-[#FF5F5F]/30 bg-[#dc2626]/10 dark:bg-[#FF5F5F]/10',
          dot: 'bg-[#dc2626] dark:bg-[#FF5F5F] shadow-[0_0_8px_rgba(255,95,95,0.6)]',
          label: 'Cancelled',
        };
      default:
        return {
          pill: 'text-[var(--gm-text-secondary)] border-[var(--gm-border-subtle)] bg-[var(--gm-bg-card-subtle)]',
          dot: 'bg-[var(--gm-text-secondary)]',
          label: status,
        };
    }
  })();

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 text-[11px] font-semibold tracking-[0.15em] uppercase rounded-full border ${config.pill} transition-colors`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
}

function TrackingStageTimeline({ status }: { status: BookingStatus }) {
  if (status === 'Cancelled') {
    return (
      <div className="p-4 sm:p-5 rounded-2xl bg-red-500/10 border border-red-500/25 text-xs sm:text-sm text-red-700 dark:text-red-200 shadow-inner relative z-10 w-full">
        This service request was cancelled. Please call Grand Motors or book a new appointment.
      </div>
    );
  }

  const stepOrder = ['Pending', 'Confirmed', 'In Progress', 'Completed'];
  const currentIndex = stepOrder.indexOf(status);

  return (
    <div className="space-y-4 sm:space-y-6 relative z-10 w-full pt-1 pb-2 sm:pb-4">
      <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--gm-text-secondary)] px-1">
        Live Service Stage
      </div>

      <div className="relative w-full max-w-full overflow-hidden sm:overflow-visible">
        {/* Continuous Line Background */}
        <div className="absolute top-4 sm:top-5 left-[12.5%] right-[12.5%] h-[1px] bg-[var(--gm-border-medium)]" />

        {/* Active Line */}
        <div
          className="absolute top-4 sm:top-5 left-[12.5%] origin-left h-[1px] bg-[var(--gm-accent-primary)] shadow-[0_0_8px_var(--gm-accent-glow)] transition-all duration-700 ease-out"
          style={{ width: `${(Math.max(0, currentIndex) / (stepOrder.length - 1)) * 75}%` }}
        />

        <div className="grid grid-cols-4 gap-1 sm:gap-2 text-center relative z-10">
          {TRACKING_STEPS.map((step, idx) => {
            const stepIndex = stepOrder.indexOf(step.key);
            const isCompleted = stepIndex < currentIndex;
            const isCurrent = stepIndex === currentIndex;

            return (
              <div key={step.key} className="flex flex-col items-center group">
                <div className="relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 mb-2 sm:mb-3 rounded-full bg-[var(--gm-bg-surface)] backdrop-blur-xl border border-[var(--gm-border-medium)] transition-all duration-500">
                   <div className={`w-full h-full rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-bold transition-all duration-500 ${
                     isCurrent ? 'bg-[var(--gm-accent-primary)] text-[var(--gm-accent-foreground)] border border-[var(--gm-accent-border)] shadow-[0_0_15px_var(--gm-accent-glow)]' :
                     isCompleted ? 'bg-[var(--gm-accent-muted)] border border-[var(--gm-accent-border)] text-[var(--gm-accent-primary)]' :
                     'bg-[var(--gm-bg-card)] border border-[var(--gm-border-subtle)] text-[var(--gm-text-muted)]'
                   }`}>
                     {isCompleted ? (
                       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                     ) : (
                       idx + 1
                     )}
                   </div>
                </div>

                <span className={`text-[8px] xs:text-[9px] sm:text-[10px] font-semibold tracking-wider sm:tracking-widest uppercase transition-colors duration-300 px-0.5 leading-tight ${
                  isCurrent ? 'text-[var(--gm-accent-primary)] font-bold' :
                  isCompleted ? 'text-[var(--gm-text-primary)] font-medium' :
                  'text-[var(--gm-text-muted)]'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function MyBookingsView() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Track Booking by ID state
  const [trackInputId, setTrackInputId] = useState('');
  const [trackError, setTrackError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const searchInputId = useId();

  const refreshBookings = async () => {
    const loaded = getCustomerBookings();
    setBookings(loaded);

    if (loaded.length > 0) {
      // Sync local bookings silently with backend
      let modified = false;
      const synced = await Promise.all(loaded.map(async (bk) => {
        try {
          const resp = await fetch(`/api/bookings/${encodeURIComponent(bk.id)}`);
          if (resp.ok) {
            const data = await resp.json();
            let changed = false;
            const updated: BookingRecord = { ...bk };

            // Server-managed fields to synchronize if provided by server
            const syncableFields: Array<keyof BookingRecord> = [
              'status',
              'preferredDate',
              'requestedDate',
              'preferredTime',
              'requestedTime',
              'specificService',
              'serviceCategory',
              'vehicleMake',
              'vehicleModel',
              'fuelType',
              'registrationNumber',
              'serviceLocation',
              'doorstepHouseFlat',
              'doorstepStreetLocality',
              'doorstepCity',
              'doorstepPincode',
              'doorstepLatitude',
              'doorstepLongitude',
              'doorstepMapUrl',
            ];

            for (const key of syncableFields) {
              if (data[key] !== undefined && data[key] !== '' && data[key] !== bk[key]) {
                (updated as any)[key] = data[key];
                changed = true;
              }
            }

            if (changed) {
              modified = true;
              return updated;
            }
          }
        } catch (e) {
          // ignore offline / network errors
        }
        return bk;
      }));

      if (modified) {
        // save the synced list directly to preserve user booking ordering
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(synced));
        }
        setBookings(synced);
      }
    }
  };

  useEffect(() => {
    setIsMounted(true);
    refreshBookings();

    // Check if query parameter specifies an ID (e.g. from redirect)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const requestedId = params.get('id');
      if (requestedId) {
        const found = getBookingById(requestedId);
        if (found) {
          setSelectedBooking(found);
        }
      }
    }

    // Listen for cross-tab or external storage updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'grandmotors_bookings') {
        refreshBookings();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleCopy = async (id: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(id);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = id;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2200);
    } catch (err) {
      console.error('Failed to copy booking ID', err);
    }
  };

  const handleOpenDetails = (booking: BookingRecord) => {
    setSelectedBooking(booking);
    if (typeof window !== 'undefined' && window.history.pushState) {
      const url = new URL(window.location.href);
      url.searchParams.set('id', booking.id);
      window.history.pushState({}, '', url.toString());
    }
  };

  const handleCloseDetails = () => {
    setSelectedBooking(null);
    if (typeof window !== 'undefined' && window.history.pushState) {
      const url = new URL(window.location.href);
      url.searchParams.delete('id');
      window.history.pushState({}, '', url.toString());
    }
  };

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = trackInputId.trim();
    if (!clean) {
      setTrackError('Please enter a valid Booking ID.');
      return;
    }

    setIsSearching(true);
    setTrackError(null);

    const normalized = clean.toUpperCase();
    const queryId = normalized.startsWith('GM-') ? normalized : `GM-${normalized}`;

    try {
      const resp = await fetch(`/api/bookings/${encodeURIComponent(queryId)}`);
      if (resp.ok) {
        const data = await resp.json();
        saveBookingRecord(data);
        refreshBookings();
        handleOpenDetails(data);
        setTrackInputId('');
        setIsSearching(false);
        return;
      }
    } catch (err) {
      console.warn('Backend fetch failed, checking local backup', err);
    }

    // Fallback check in local storage / demo records
    const localMatch = getBookingById(clean);
    if (localMatch) {
      handleOpenDetails(localMatch);
      setTrackInputId('');
    } else {
      setTrackError(`No active booking found for ID "${clean}". Please verify your code.`);
    }
    setIsSearching(false);
  };

  if (!isMounted) {
    return (
      <div className="min-h-[360px] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#B88952]/20 border-t-[#B88952] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* ============================================================ */}
      {/* SEARCH + LIST (shown only when no booking is selected)       */}
      {/* ============================================================ */}
      {!selectedBooking && (
      <>
      {/* 1. TRACK BOOKING VIA BOOKING ID SEARCH BAR */}
      <div className="bg-[var(--gm-bg-card)] border border-[var(--gm-border-subtle)] rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Subtle Accent Glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-[var(--gm-accent-muted)] rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-px bg-[var(--gm-accent-primary)]" />
              <span className="text-[10px] font-semibold tracking-[0.25em] text-[var(--gm-accent-primary)] uppercase">
                Track Service
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[var(--gm-text-primary)] uppercase tracking-tight">
              Track Your Service
            </h3>
            <p className="text-xs text-[var(--gm-text-secondary)] leading-relaxed">
              Enter any Booking ID to track live workshop bay progress, schedule, or view status.
            </p>
          </div>

          <form onSubmit={handleTrackSubmit} className="w-full">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1 min-w-0">
                <label htmlFor={searchInputId} className="sr-only">
                  Booking ID
                </label>
                <input
                  id={searchInputId}
                  type="text"
                  value={trackInputId}
                  onChange={(e) => {
                    setTrackInputId(e.target.value);
                    if (trackError) setTrackError(null);
                  }}
                  placeholder="e.g. GM-229397"
                  className="w-full bg-[var(--gm-bg-input)] border border-[var(--gm-border-medium)] rounded-lg px-4 py-3 text-sm font-mono uppercase text-[var(--gm-text-primary)] placeholder-[var(--gm-text-muted)] focus:border-[var(--gm-accent-primary)] focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isSearching}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-semibold tracking-[0.18em] uppercase text-[var(--gm-accent-foreground)] bg-[var(--gm-accent-primary)] hover:bg-[var(--gm-accent-hover)] active:bg-[var(--gm-accent-active)] disabled:opacity-50 rounded-lg transition-all shadow-md shadow-[var(--gm-accent-primary)]/10 cursor-pointer shrink-0 font-bold"
              >
                <SearchIcon className="w-4 h-4" />
                <span>{isSearching ? 'Tracking...' : 'Track'}</span>
              </button>
            </div>

            {trackError && (
              <p className="mt-2.5 text-xs text-red-500 dark:text-red-400 leading-snug">
                {trackError}
              </p>
            )}
          </form>
        </div>
      </div>

      {/* 2. SAVED BOOKINGS LIST OR EMPTY STATE */}
      {bookings.length === 0 ? (
        /* Empty State */
        <div className="max-w-2xl mx-auto text-center py-8 px-4">
          <div className="bg-[var(--gm-bg-card)] border border-[var(--gm-border-subtle)] rounded-2xl p-8 sm:p-12 relative overflow-hidden shadow-2xl">
            {/* Subtle accent glow */}
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-[var(--gm-accent-muted)] rounded-full blur-3xl pointer-events-none" />

            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-[var(--gm-bg-surface)] border border-[var(--gm-border-subtle)] flex items-center justify-center text-[var(--gm-accent-primary)]">
              <WrenchIcon className="w-7 h-7" />
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold tracking-[-0.02em] text-[var(--gm-text-primary)] uppercase mb-2">
              No bookings yet
            </h3>

            <p className="text-xs sm:text-sm text-[var(--gm-text-secondary)] leading-relaxed max-w-md mx-auto mb-6">
              Your Grand Motors service requests will appear here after you book a service.
            </p>

            <a
              href="/book-service"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-xs font-semibold tracking-[0.2em] uppercase text-[var(--gm-accent-foreground)] bg-[var(--gm-accent-primary)] hover:bg-[var(--gm-accent-hover)] active:bg-[var(--gm-accent-active)] rounded-lg transition-all shadow-lg shadow-[var(--gm-accent-primary)]/15 cursor-pointer font-bold"
            >
              <span>BOOK A SERVICE</span>
              <ArrowRightIcon className="w-4 h-4" />
            </a>

            {/* Local device explanation */}
            <div className="mt-8 pt-5 border-t border-[var(--gm-border-subtle)] text-xs text-[var(--gm-text-muted)] leading-relaxed">
              <p>
                Grand Motors saves your recent bookings directly on this device for instant access. No passwords or account setup required.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Active Bookings Grid */
        <div className="space-y-6">
          {/* Storage & Action Header */}
          <div className="bg-[var(--gm-bg-surface)] border border-[var(--gm-border-subtle)] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[var(--gm-text-secondary)]">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[var(--gm-accent-primary)] shrink-0" />
              <span>
                Your recent service requests saved on this device.
              </span>
            </div>
            <a
              href="/book-service"
              className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.1em] uppercase text-[var(--gm-accent-primary)] hover:text-[var(--gm-accent-hover)] transition-colors shrink-0"
            >
              <span>+ Book Another Service</span>
            </a>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {bookings.map((booking) => {
              const serviceTitle = getServiceTitle(booking.serviceCategory);
              const isSelected = (selectedBooking as BookingRecord | null)?.id === booking.id;

              return (
                <div
                  key={booking.id}
                  className={`group bg-[var(--gm-bg-card)] border rounded-2xl p-6 transition-all duration-300 relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-[var(--gm-accent-primary)] ring-1 ring-[var(--gm-accent-border)] bg-[var(--gm-bg-card-hover)]'
                      : 'border-[var(--gm-border-subtle)] hover:border-[var(--gm-accent-border)] hover:bg-[var(--gm-bg-card-hover)]'
                  }`}
                >
                  <div>
                    {/* Card Top: ID and Status */}
                    <div className="flex items-center justify-between gap-3 pb-4 border-b border-[var(--gm-border-subtle)]">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold tracking-[0.2em] text-[var(--gm-text-muted)] uppercase">
                          ID:
                        </span>
                        <span className="text-base sm:text-lg font-mono font-bold text-[var(--gm-text-primary)] tracking-wider">
                          {booking.id}
                        </span>
                      </div>
                      <StatusIndicator status={booking.status} />
                    </div>

                    {/* Card Body: Vehicle & Service */}
                    <div className="py-4 space-y-3">
                      <div>
                        <span className="text-[10px] font-semibold tracking-[0.2em] text-[var(--gm-text-muted)] uppercase block mb-1">
                          Vehicle
                        </span>
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <h4 className="text-lg font-bold text-[var(--gm-text-primary)]">
                            {booking.vehicle || `${booking.vehicleMake} ${booking.vehicleModel}`}
                          </h4>
                          {booking.fuelType && (
                            <span className="text-xs px-2 py-0.5 rounded bg-[var(--gm-accent-muted)] border border-[var(--gm-accent-border)] text-[var(--gm-accent-primary)] font-semibold">
                              {booking.fuelType}
                            </span>
                          )}
                          {booking.registrationNumber && (
                            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[var(--gm-bg-surface)] border border-[var(--gm-border-subtle)] text-[var(--gm-text-secondary)]">
                              {booking.registrationNumber}
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold tracking-[0.2em] text-[var(--gm-text-muted)] uppercase block mb-1">
                          Service
                        </span>
                        <p className="text-sm font-medium text-[var(--gm-text-primary)]">
                          {serviceTitle}
                        </p>
                        {booking.specificService && (
                          <p className="text-xs text-[var(--gm-text-secondary)] mt-0.5">
                            {booking.specificService}
                          </p>
                        )}
                      </div>

                      {/* Requested Date / Time & Service Location */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--gm-text-secondary)]">
                        <div className="flex items-center gap-2">
                          <ClockIcon className="w-4 h-4 text-[var(--gm-accent-primary)] shrink-0" />
                          <span>
                            {booking.requestedDate || booking.preferredDate} • {booking.requestedTime || booking.preferredTime}
                          </span>
                        </div>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded border ${
                          booking.serviceLocation === 'Doorstep Service'
                            ? 'text-[var(--gm-accent-primary)] border-[var(--gm-accent-border)] bg-[var(--gm-accent-muted)]'
                            : 'text-[var(--gm-text-secondary)] border-[var(--gm-border-subtle)] bg-[var(--gm-bg-card-subtle)]'
                        }`}>
                          {booking.serviceLocation === 'Doorstep Service' ? '🏠 Doorstep' : '🏢 Workshop'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Actions */}
                  <div className="pt-4 border-t border-[var(--gm-border-subtle)] flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => handleCopy(booking.id)}
                      className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)] transition-colors cursor-pointer"
                    >
                      {copiedId === booking.id ? '✓ ID Copied' : 'Copy ID'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenDetails(booking)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold tracking-[0.12em] uppercase text-[var(--gm-text-primary)] bg-[var(--gm-bg-surface)] hover:bg-[var(--gm-accent-primary)] hover:text-[var(--gm-accent-foreground)] border border-[var(--gm-border-subtle)] hover:border-[var(--gm-accent-primary)] rounded-lg transition-all duration-200 cursor-pointer"
                      >
                        <span>Track / Details</span>
                        <ArrowRightIcon className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </>
      )}

      {/* ============================================================ */}
      {/* BOOKING DETAILS — inline panel (replaces list, like Track)   */}
      {/* ============================================================ */}
      {selectedBooking && (
        <div className="space-y-6" style={{ animation: 'detail-enter 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
          <style>{`
            @keyframes detail-enter {
              0% { opacity: 0; transform: translateY(14px); }
              100% { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Top actions: back + new booking */}
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleCloseDetails}
              className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.15em] uppercase text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)] transition-colors cursor-pointer"
            >
              <ArrowRightIcon className="w-4 h-4 rotate-180" />
              <span>Back to My Bookings</span>
            </button>

            <a
              href="/book-service"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold tracking-[0.14em] uppercase text-[var(--gm-accent-foreground)] bg-[var(--gm-accent-primary)] hover:bg-[var(--gm-accent-primary-hover)] rounded-lg transition-colors cursor-pointer font-bold shadow-sm"
            >
              <span>+ New Booking</span>
            </a>
          </div>

          {/* Detail Card */}
          <div className="bg-[var(--gm-bg-card)] border border-[var(--gm-border-subtle)] rounded-[1.75rem] relative overflow-hidden shadow-2xl text-left">
            {/* Soft Ambient Glows */}
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[var(--gm-accent-glow)] rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--gm-accent-glow)] rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 px-6 sm:px-10 pt-6 sm:pt-9 pb-6 border-b border-[var(--gm-border-subtle)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-0">
                <div>
                  <span className="text-[10px] font-semibold tracking-[0.3em] text-[var(--gm-accent-primary)] uppercase block mb-2 opacity-90">
                    Booking Tracking & Details
                  </span>
                  <div className="flex items-center gap-4">
                    <h2 className="text-3xl sm:text-4xl font-mono font-bold text-[var(--gm-text-primary)] tracking-tight drop-shadow-md">
                      {selectedBooking.id}
                    </h2>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedBooking.id)}
                      className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest rounded-full bg-[var(--gm-bg-card-subtle)] border border-[var(--gm-border-subtle)] hover:border-[var(--gm-accent-primary)] hover:bg-[var(--gm-accent-muted)] text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)] transition-all cursor-pointer backdrop-blur-md"
                    >
                      {copiedId === selectedBooking.id ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-start sm:self-center">
                  <StatusIndicator status={selectedBooking.status} />
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="relative z-10 px-6 sm:px-10 py-8 sm:py-10 space-y-10">
              {/* Live Service Stage Timeline */}
              <div className="bg-[var(--gm-bg-surface)] rounded-3xl p-6 border border-[var(--gm-border-subtle)] shadow-inner">
                <TrackingStageTimeline status={selectedBooking.status} />
              </div>

              {/* Comprehensive Detail Grid */}
              <div className="grid sm:grid-cols-2 gap-x-12 gap-y-8 pt-2">
                {/* Customer Name */}
                <div className="group">
                  <span className="block text-[10px] font-bold tracking-[0.2em] text-[var(--gm-text-muted)] uppercase mb-2">
                    Customer Name
                  </span>
                  <span className="text-lg font-medium text-[var(--gm-text-primary)] group-hover:text-[var(--gm-accent-primary)] transition-colors block">
                    {selectedBooking.customerName || selectedBooking.fullName}
                  </span>
                </div>

                {/* Phone */}
                <div className="group">
                  <span className="block text-[10px] font-bold tracking-[0.2em] text-[var(--gm-text-muted)] uppercase mb-2">
                    Contact Info
                  </span>
                  <span className="text-lg text-[var(--gm-text-primary)] font-mono group-hover:text-[var(--gm-accent-primary)] transition-colors block">
                    {selectedBooking.phone || selectedBooking.phoneNumber}
                  </span>
                  {selectedBooking.email && (
                    <span className="text-sm text-[var(--gm-text-secondary)] mt-1 block">
                      {selectedBooking.email}
                    </span>
                  )}
                </div>

                {/* Vehicle */}
                <div className="group">
                  <span className="block text-[10px] font-bold tracking-[0.2em] text-[var(--gm-text-muted)] uppercase mb-2">
                    Vehicle
                  </span>
                  <span className="text-lg font-medium text-[var(--gm-text-primary)] group-hover:text-[var(--gm-accent-primary)] transition-colors block">
                    {selectedBooking.vehicle || `${selectedBooking.vehicleMake} ${selectedBooking.vehicleModel}`}
                  </span>
                  {selectedBooking.fuelType && (
                    <span className="text-xs text-[var(--gm-accent-primary)] font-medium mt-1 inline-block">
                      Fuel Type: {selectedBooking.fuelType}
                    </span>
                  )}
                </div>

                {/* Registration */}
                <div className="group">
                  <span className="block text-[10px] font-bold tracking-[0.2em] text-[var(--gm-text-muted)] uppercase mb-2">
                    Registration Number
                  </span>
                  <span className="inline-block text-base font-mono font-bold px-3 py-1.5 rounded-lg bg-[var(--gm-bg-surface)] border border-[var(--gm-border-subtle)] text-[var(--gm-text-primary)] shadow-inner">
                    {selectedBooking.registrationNumber || '—'}
                  </span>
                </div>

                {/* Service Category */}
                <div className="group">
                  <span className="block text-[10px] font-bold tracking-[0.2em] text-[var(--gm-text-muted)] uppercase mb-2">
                    Service Category
                  </span>
                  <span className="text-lg font-medium text-[var(--gm-text-primary)] group-hover:text-[var(--gm-accent-primary)] transition-colors block">
                    {getServiceTitle(selectedBooking.serviceCategory)}
                  </span>
                </div>

                {/* Specific Service */}
                <div className="group">
                  <span className="block text-[10px] font-bold tracking-[0.2em] text-[var(--gm-text-muted)] uppercase mb-2">
                    Specific Service
                  </span>
                  <span className="text-lg text-[var(--gm-accent-primary)] font-medium transition-colors block">
                    {selectedBooking.specificService || 'General Inspection / Custom Scope'}
                  </span>
                </div>

                {/* Requested Date */}
                <div className="group">
                  <span className="block text-[10px] font-bold tracking-[0.2em] text-[var(--gm-text-muted)] uppercase mb-2">
                    Requested Date
                  </span>
                  <span className="text-lg text-[var(--gm-text-primary)] group-hover:text-[var(--gm-accent-primary)] transition-colors block">
                    {selectedBooking.requestedDate || selectedBooking.preferredDate}
                  </span>
                </div>

                {/* Requested Time */}
                <div className="group">
                  <span className="block text-[10px] font-bold tracking-[0.2em] text-[var(--gm-text-muted)] uppercase mb-2">
                    Requested Time Window
                  </span>
                  <span className="text-lg text-[var(--gm-text-primary)] group-hover:text-[var(--gm-accent-primary)] transition-colors block">
                    {selectedBooking.requestedTime || selectedBooking.preferredTime}
                  </span>
                </div>

                {/* Service Location */}
                <div className="sm:col-span-2 group">
                  <span className="block text-[10px] font-bold tracking-[0.2em] text-[var(--gm-text-muted)] uppercase mb-2">
                    Service Location & Address
                  </span>
                  <div className="p-5 rounded-2xl bg-[var(--gm-bg-surface)] border border-[var(--gm-border-subtle)] space-y-3">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold tracking-wider uppercase rounded-full border ${
                        selectedBooking.serviceLocation === 'Doorstep Service'
                          ? 'text-[var(--gm-accent-primary)] border-[var(--gm-accent-border)] bg-[var(--gm-accent-muted)]'
                          : 'text-[var(--gm-text-primary)] border-[var(--gm-border-subtle)] bg-[var(--gm-bg-card)]'
                      }`}>
                        {selectedBooking.serviceLocation === 'Doorstep Service' ? '🏠 Doorstep Service' : '🏢 Workshop Visit'}
                      </span>
                    </div>

                    {selectedBooking.serviceLocation === 'Doorstep Service' ? (
                      <div className="space-y-2 pt-1 text-sm text-[var(--gm-text-primary)]">
                        <p className="font-semibold text-base">
                          {selectedBooking.doorstepHouseFlat}, {selectedBooking.doorstepStreetLocality}
                        </p>
                        <p className="text-[var(--gm-text-secondary)]">
                          {selectedBooking.doorstepCity} - {selectedBooking.doorstepPincode}
                        </p>
                        {selectedBooking.doorstepMapUrl && (
                          <div className="pt-2">
                            <a
                              href={selectedBooking.doorstepMapUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--gm-accent-foreground)] bg-[var(--gm-accent-primary)] hover:bg-[var(--gm-accent-primary-hover)] rounded-lg transition-colors shadow-sm"
                            >
                              <span>View on Google Maps</span>
                              <span>↗</span>
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--gm-text-secondary)]">
                        Grand Motors Workshop • Metro Pillar 842, Moosapet, Hyderabad, Telangana 500018
                      </p>
                    )}
                  </div>
                </div>

                {/* Additional Message / Notes */}
                {selectedBooking.additionalMessage && (
                  <div className="sm:col-span-2 group">
                    <span className="block text-[10px] font-bold tracking-[0.2em] text-[var(--gm-text-muted)] uppercase mb-3">
                      Customer Notes / Symptoms
                    </span>
                    <div className="p-5 rounded-2xl bg-[var(--gm-bg-surface)] border border-[var(--gm-border-subtle)] text-sm md:text-base text-[var(--gm-text-primary)] leading-relaxed shadow-inner">
                      {selectedBooking.additionalMessage}
                    </div>
                  </div>
                )}

                {/* Created Date */}
                <div className="sm:col-span-2 pt-2 flex justify-end">
                  <span className="text-[11px] text-[var(--gm-text-muted)] font-medium">
                    Requested on: {new Date(selectedBooking.createdAt).toLocaleString(undefined, {
                      dateStyle: 'long',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
              </div>

              {/* Direct Workshop Contact Actions */}
              <div className="pt-6 mt-4 border-t border-[var(--gm-border-subtle)] space-y-5">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <a
                    href={`tel:${PHONE_TEL}`}
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 text-[11px] font-bold tracking-[0.2em] uppercase text-[var(--gm-accent-foreground)] bg-[var(--gm-accent-primary)] hover:bg-[var(--gm-accent-primary-hover)] rounded-xl transition-all text-center shadow-md cursor-pointer"
                  >
                    <PhoneIcon className="w-4 h-4" />
                    <span>CALL GRAND MOTORS</span>
                  </a>

                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 text-[11px] font-bold tracking-[0.2em] uppercase text-[#15803d] dark:text-[#25D366] bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 rounded-xl transition-all text-center cursor-pointer shadow-sm backdrop-blur-md"
                  >
                    <WhatsAppIcon className="w-4 h-4 text-[#15803d] dark:text-[#25D366]" />
                    <span>WHATSAPP GRAND MOTORS</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCloseDetails}
                    className="inline-flex items-center justify-center px-6 py-4 text-[11px] font-bold tracking-[0.2em] uppercase text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)] bg-[var(--gm-bg-surface)] hover:bg-[var(--gm-bg-card-hover)] border border-[var(--gm-border-subtle)] rounded-xl transition-all cursor-pointer"
                  >
                    Back to My Bookings
                  </button>
                </div>

                <p className="text-[10px] sm:text-[11px] font-medium text-center text-[var(--gm-text-muted)] tracking-wider">
                  WORKSHOP LOCATION: METRO PILLAR NO. 842, MOOSAPET, HYDERABAD • DIRECT LINE: {PHONE_DISPLAY}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

