import { useState, useEffect, useId } from 'react';
import { SERVICES } from './servicesData';
import {
  getCustomerBookings,
  getBookingById,
  saveBookingRecord,
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
          pill: 'text-[#E5A84B] border-[#E5A84B]/30 bg-[#E5A84B]/10',
          dot: 'bg-[#E5A84B] shadow-[0_0_8px_rgba(229,168,75,0.6)]',
          label: 'Pending Review',
        };
      case 'Confirmed':
        return {
          pill: 'text-[#B88952] border-[#B88952]/40 bg-[#B88952]/10',
          dot: 'bg-[#B88952] shadow-[0_0_8px_rgba(184,137,82,0.6)]',
          label: 'Confirmed',
        };
      case 'In Progress':
        return {
          pill: 'text-[#60A5FA] border-[#60A5FA]/30 bg-[#60A5FA]/10',
          dot: 'bg-[#60A5FA] shadow-[0_0_8px_rgba(96,165,250,0.6)] animate-pulse',
          label: 'In Progress',
        };
      case 'Completed':
        return {
          pill: 'text-[#25D366] border-[#25D366]/30 bg-[#25D366]/10',
          dot: 'bg-[#25D366] shadow-[0_0_8px_rgba(37,211,102,0.6)]',
          label: 'Completed',
        };
      case 'Cancelled':
        return {
          pill: 'text-[#FF5F5F] border-[#FF5F5F]/30 bg-[#FF5F5F]/10',
          dot: 'bg-[#FF5F5F] shadow-[0_0_8px_rgba(255,95,95,0.6)]',
          label: 'Cancelled',
        };
      default:
        return {
          pill: 'text-[#A7AAAD] border-white/10 bg-white/5',
          dot: 'bg-[#A7AAAD]',
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
      <div className="p-5 rounded-2xl bg-red-950/20 border border-red-500/20 backdrop-blur-md text-sm text-red-200 shadow-inner relative z-10 w-full">
        This service request was cancelled. Please call Grand Motors or book a new appointment.
      </div>
    );
  }

  const stepOrder = ['Pending', 'Confirmed', 'In Progress', 'Completed'];
  const currentIndex = stepOrder.indexOf(status);

  return (
    <div className="space-y-6 relative z-10 w-full pt-2 pb-4">
      <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#A7AAAD]/80 px-2">
        Live Service Stage
      </div>

      <div className="relative w-full max-w-full overflow-hidden sm:overflow-visible">
        {/* Continuous Line Background */}
        <div className="absolute top-5 left-[12.5%] right-[12.5%] h-[1px] bg-white/10" />

        {/* Active Line */}
        <div
          className="absolute top-5 left-[12.5%] origin-left h-[1px] bg-gradient-to-r from-[#B88952] to-[#F2F0EA] shadow-[0_0_8px_rgba(184,137,82,0.6)] transition-all duration-700 ease-out"
          style={{ width: `${(Math.max(0, currentIndex) / (stepOrder.length - 1)) * 75}%` }}
        />

        <div className="grid grid-cols-4 gap-2 text-center relative z-10">
          {TRACKING_STEPS.map((step, idx) => {
            const stepIndex = stepOrder.indexOf(step.key);
            const isCompleted = stepIndex < currentIndex;
            const isCurrent = stepIndex === currentIndex;

            return (
              <div key={step.key} className="flex flex-col items-center group">
                <div className="relative flex items-center justify-center w-10 h-10 mb-3 rounded-full bg-[#0a0c0e] backdrop-blur-xl border transition-all duration-500">
                   <div className={`w-full h-full rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-500 ${
                     isCurrent ? 'bg-gradient-to-br from-[#B88952] to-[#8a6534] border border-[#d6a563] text-black shadow-[0_0_15px_rgba(184,137,82,0.4)]' :
                     isCompleted ? 'bg-white/10 border border-white/20 text-[#F2F0EA]' :
                     'bg-transparent border border-white/10 text-[#A7AAAD]/40'
                   }`}>
                     {isCompleted ? (
                       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                     ) : (
                       idx + 1
                     )}
                   </div>
                </div>

                <span className={`text-[9px] sm:text-[10px] font-semibold tracking-widest uppercase transition-colors duration-300 px-1 ${
                  isCurrent ? 'text-[#eaddc1]' :
                  isCompleted ? 'text-[#A7AAAD]' :
                  'text-[#A7AAAD]/40'
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

  const refreshBookings = () => {
    const loaded = getCustomerBookings();
    setBookings(loaded);
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

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = trackInputId.trim();
    if (!clean) {
      setTrackError('Please enter a valid Booking ID.');
      return;
    }

    setIsSearching(true);
    setTrackError(null);

    setTimeout(() => {
      const result = getBookingById(clean);
      if (result) {
        // Auto-save to local list if not already present
        saveBookingRecord(result);
        refreshBookings();
        handleOpenDetails(result);
        setTrackInputId('');
      } else {
        setTrackError(
          `No active booking found for ID "${clean}". Please verify your reference code or contact workshop support.`
        );
      }
      setIsSearching(false);
    }, 350);
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
      {/* 1. TRACK BOOKING VIA BOOKING ID SEARCH BAR */}
      <div className="bg-[#111315] border border-white/8 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Subtle Gold Accent Glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-[#B88952]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-px bg-[#B88952]" />
              <span className="text-[10px] font-semibold tracking-[0.25em] text-[#B88952] uppercase">
                Track Service
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[#F2F0EA] uppercase tracking-tight">
              Track Your Service
            </h3>
            <p className="text-xs text-[#A7AAAD] leading-relaxed">
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
                  className="w-full bg-[#0A0C0D] border border-white/10 rounded-lg px-4 py-3 text-sm font-mono uppercase text-[#F2F0EA] placeholder-[#A7AAAD]/40 focus:border-[#B88952] focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isSearching}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-semibold tracking-[0.18em] uppercase text-[#0A0C0D] bg-[#B88952] hover:bg-[#caa066] active:bg-[#a67943] disabled:opacity-50 rounded-lg transition-all shadow-md shadow-[#B88952]/10 cursor-pointer shrink-0 font-bold"
              >
                <SearchIcon className="w-4 h-4" />
                <span>{isSearching ? 'Tracking...' : 'Track'}</span>
              </button>
            </div>

            {trackError && (
              <p className="mt-2.5 text-xs text-red-400 leading-snug">
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
          <div className="bg-[#111315] border border-white/10 rounded-2xl p-8 sm:p-12 relative overflow-hidden shadow-2xl">
            {/* Subtle accent glow */}
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-[#B88952]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-[#0A0C0D] border border-white/10 flex items-center justify-center text-[#B88952]">
              <WrenchIcon className="w-7 h-7" />
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold tracking-[-0.02em] text-[#F2F0EA] uppercase mb-2">
              No bookings yet
            </h3>

            <p className="text-xs sm:text-sm text-[#A7AAAD] leading-relaxed max-w-md mx-auto mb-6">
              Your Grand Motors service requests will appear here after you book a service.
            </p>

            <a
              href="/book-service"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-xs font-semibold tracking-[0.2em] uppercase text-[#0A0C0D] bg-[#B88952] hover:bg-[#caa066] active:bg-[#a67943] rounded-lg transition-all shadow-lg shadow-[#B88952]/15 cursor-pointer font-bold"
            >
              <span>BOOK A SERVICE</span>
              <ArrowRightIcon className="w-4 h-4" />
            </a>

            {/* Local device explanation */}
            <div className="mt-8 pt-5 border-t border-white/5 text-xs text-[#A7AAAD]/60 leading-relaxed">
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
          <div className="bg-[#0A0C0D] border border-white/8 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#A7AAAD]">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#B88952] shrink-0" />
              <span>
                Your recent service requests saved on this device.
              </span>
            </div>
            <a
              href="/book-service"
              className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.1em] uppercase text-[#B88952] hover:text-[#caa066] transition-colors shrink-0"
            >
              <span>+ Book Another Service</span>
            </a>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {bookings.map((booking) => {
              const serviceTitle = getServiceTitle(booking.serviceCategory);
              const isSelected = selectedBooking?.id === booking.id;

              return (
                <div
                  key={booking.id}
                  className={`group bg-[#111315] border rounded-2xl p-6 transition-all duration-300 relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#B88952] ring-1 ring-[#B88952]/40 bg-[#141619]'
                      : 'border-white/8 hover:border-white/20 hover:bg-[#15171a]'
                  }`}
                >
                  <div>
                    {/* Card Top: ID and Status */}
                    <div className="flex items-center justify-between gap-3 pb-4 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold tracking-[0.2em] text-[#A7AAAD] uppercase">
                          ID:
                        </span>
                        <span className="text-base sm:text-lg font-mono font-bold text-[#F2F0EA] tracking-wider">
                          {booking.id}
                        </span>
                      </div>
                      <StatusIndicator status={booking.status} />
                    </div>

                    {/* Card Body: Vehicle & Service */}
                    <div className="py-4 space-y-3">
                      <div>
                        <span className="text-[10px] font-semibold tracking-[0.2em] text-[#A7AAAD] uppercase block mb-1">
                          Vehicle
                        </span>
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <h4 className="text-lg font-bold text-[#F2F0EA]">
                            {booking.vehicle || `${booking.vehicleMake} ${booking.vehicleModel}`}
                          </h4>
                          {booking.registrationNumber && (
                            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-black/40 border border-white/10 text-[#D8D6D0]">
                              {booking.registrationNumber}
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold tracking-[0.2em] text-[#A7AAAD] uppercase block mb-1">
                          Service
                        </span>
                        <p className="text-sm font-medium text-[#F2F0EA]">
                          {serviceTitle}
                        </p>
                        {booking.specificService && (
                          <p className="text-xs text-[#A7AAAD] mt-0.5">
                            {booking.specificService}
                          </p>
                        )}
                      </div>

                      {/* Requested Date / Time */}
                      <div className="pt-2 flex items-center gap-2 text-xs text-[#A7AAAD]">
                        <ClockIcon className="w-4 h-4 text-[#B88952] shrink-0" />
                        <span>
                          {booking.requestedDate || booking.preferredDate} • {booking.requestedTime || booking.preferredTime}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Actions */}
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => handleCopy(booking.id)}
                      className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#A7AAAD] hover:text-[#F2F0EA] transition-colors cursor-pointer"
                    >
                      {copiedId === booking.id ? '✓ ID Copied' : 'Copy ID'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenDetails(booking)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold tracking-[0.12em] uppercase text-[#F2F0EA] bg-white/5 hover:bg-[#B88952] hover:text-[#0A0C0D] border border-white/10 hover:border-[#B88952] rounded-lg transition-all duration-200 cursor-pointer"
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

      {/* 3. BOOKING DETAILS & LIVE STAGE MODAL */}
      {selectedBooking && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#040404]/80 backdrop-blur-md overflow-y-auto"
          style={{ animation: 'fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
          onClick={handleCloseDetails}
        >
          <style>{`
            @keyframes fade-in {
              0% { opacity: 0; backdrop-filter: blur(0px); }
              100% { opacity: 1; backdrop-filter: blur(12px); }
            }
            @keyframes modal-enter {
              0% { opacity: 0; transform: scale(0.96) translateY(20px); }
              100% { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>
          <div
            className="bg-[#0c0d10]/60 backdrop-blur-2xl border border-white/5 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8),_0_0_0_1px_rgba(184,137,82,0.1)_inset] rounded-[2rem] max-w-[900px] w-full p-6 sm:p-10 relative overflow-hidden my-auto text-left"
            style={{ animation: 'modal-enter 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Soft Ambient Glows */}
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#B88952]/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#B88952]/5 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

            <div className="relative z-10 space-y-10">
              {/* Modal Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-0">
                <div>
                  <span className="text-[10px] font-semibold tracking-[0.3em] text-[#B88952] uppercase block mb-2 opacity-80">
                    Booking Tracking & Details
                  </span>
                  <div className="flex items-center gap-4">
                    <h2 className="text-3xl sm:text-4xl font-mono font-bold text-[#F2F0EA] tracking-tight drop-shadow-md">
                      {selectedBooking.id}
                    </h2>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedBooking.id)}
                      className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest rounded-full bg-white/5 border border-white/10 hover:border-[#B88952]/50 hover:bg-[#B88952]/10 text-[#A7AAAD] hover:text-[#F2F0EA] transition-all cursor-pointer backdrop-blur-md"
                    >
                      {copiedId === selectedBooking.id ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-start sm:self-center">
                  <StatusIndicator status={selectedBooking.status} />
                  <button
                    type="button"
                    onClick={handleCloseDetails}
                    aria-label="Close booking details"
                    className="w-10 h-10 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#A7AAAD] hover:text-[#F2F0EA] hover:scale-105 transition-all cursor-pointer backdrop-blur-md shadow-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Live Service Stage Timeline */}
              <div className="bg-black/20 rounded-3xl p-6 border border-white/5 shadow-inner">
                <TrackingStageTimeline status={selectedBooking.status} />
              </div>

              {/* Comprehensive Detail Grid */}
              <div className="grid sm:grid-cols-2 gap-x-12 gap-y-8 pt-2">
                {/* Customer Name */}
                <div className="group">
                  <span className="block text-[10px] font-bold tracking-[0.2em] text-[#A7AAAD]/60 uppercase mb-2">
                    Customer Name
                  </span>
                  <span className="text-lg text-[#F2F0EA] group-hover:text-white transition-colors block">
                    {selectedBooking.customerName || selectedBooking.fullName}
                  </span>
                </div>

                {/* Phone */}
                <div className="group">
                  <span className="block text-[10px] font-bold tracking-[0.2em] text-[#A7AAAD]/60 uppercase mb-2">
                    Contact Info
                  </span>
                  <span className="text-lg text-[#F2F0EA] font-mono group-hover:text-white transition-colors block">
                    {selectedBooking.phone || selectedBooking.phoneNumber}
                  </span>
                  {selectedBooking.email && (
                    <span className="text-sm text-[#A7AAAD]/80 mt-1 block">
                      {selectedBooking.email}
                    </span>
                  )}
                </div>

                {/* Vehicle */}
                <div className="group">
                  <span className="block text-[10px] font-bold tracking-[0.2em] text-[#A7AAAD]/60 uppercase mb-2">
                    Vehicle
                  </span>
                  <span className="text-lg text-[#F2F0EA] group-hover:text-white transition-colors block">
                    {selectedBooking.vehicle || `${selectedBooking.vehicleMake} ${selectedBooking.vehicleModel}`}
                  </span>
                </div>

                {/* Registration */}
                <div className="group">
                  <span className="block text-[10px] font-bold tracking-[0.2em] text-[#A7AAAD]/60 uppercase mb-2">
                    Registration Number
                  </span>
                  <span className="inline-block text-base font-mono font-bold px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 text-[#F2F0EA] shadow-inner">
                    {selectedBooking.registrationNumber}
                  </span>
                </div>

                {/* Service Category */}
                <div className="group">
                  <span className="block text-[10px] font-bold tracking-[0.2em] text-[#A7AAAD]/60 uppercase mb-2">
                    Service Category
                  </span>
                  <span className="text-lg text-[#F2F0EA] group-hover:text-white transition-colors block">
                    {getServiceTitle(selectedBooking.serviceCategory)}
                  </span>
                </div>

                {/* Specific Service */}
                <div className="group">
                  <span className="block text-[10px] font-bold tracking-[0.2em] text-[#A7AAAD]/60 uppercase mb-2">
                    Specific Service
                  </span>
                  <span className="text-lg text-[#b8a082] group-hover:text-[#dbbf9b] transition-colors block">
                    {selectedBooking.specificService || 'General Inspection / Custom Scope'}
                  </span>
                </div>

                {/* Requested Date */}
                <div className="group">
                  <span className="block text-[10px] font-bold tracking-[0.2em] text-[#A7AAAD]/60 uppercase mb-2">
                    Requested Date
                  </span>
                  <span className="text-lg text-[#F2F0EA] group-hover:text-white transition-colors block">
                    {selectedBooking.requestedDate || selectedBooking.preferredDate}
                  </span>
                </div>

                {/* Requested Time */}
                <div className="group">
                  <span className="block text-[10px] font-bold tracking-[0.2em] text-[#A7AAAD]/60 uppercase mb-2">
                    Requested Time Window
                  </span>
                  <span className="text-lg text-[#F2F0EA] group-hover:text-white transition-colors block">
                    {selectedBooking.requestedTime || selectedBooking.preferredTime}
                  </span>
                </div>

                {/* Additional Message / Notes */}
                {selectedBooking.additionalMessage && (
                  <div className="sm:col-span-2 group">
                    <span className="block text-[10px] font-bold tracking-[0.2em] text-[#A7AAAD]/60 uppercase mb-3">
                      Customer Notes / Symptoms
                    </span>
                    <div className="p-5 rounded-2xl bg-black/30 border border-white/5 text-sm md:text-base text-[#F2F0EA]/90 leading-relaxed shadow-inner">
                      {selectedBooking.additionalMessage}
                    </div>
                  </div>
                )}

                {/* Created Date */}
                <div className="sm:col-span-2 pt-2 flex justify-end">
                  <span className="text-[11px] text-[#A7AAAD]/40 font-medium">
                    Requested on: {new Date(selectedBooking.createdAt).toLocaleString(undefined, {
                      dateStyle: 'long',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
              </div>

              {/* Direct Workshop Contact Actions */}
              <div className="pt-6 mt-4 border-t border-white/5 space-y-5">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <a
                    href={`tel:${PHONE_TEL}`}
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 text-[11px] font-bold tracking-[0.2em] uppercase text-[#0A0C0D] bg-gradient-to-r from-[#cca16a] to-[#B88952] hover:opacity-90 rounded-xl transition-all text-center shadow-[0_0_20px_rgba(184,137,82,0.2)] cursor-pointer"
                  >
                    <PhoneIcon className="w-4 h-4" />
                    <span>CALL GRAND MOTORS</span>
                  </a>

                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 text-[11px] font-bold tracking-[0.2em] uppercase text-[#F2F0EA] bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 rounded-xl transition-all text-center cursor-pointer shadow-sm backdrop-blur-md"
                  >
                    <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
                    <span>WHATSAPP GRAND MOTORS</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCloseDetails}
                    className="inline-flex items-center justify-center px-6 py-4 text-[11px] font-bold tracking-[0.2em] uppercase text-[#A7AAAD] hover:text-[#F2F0EA] bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all cursor-pointer backdrop-blur-md"
                  >
                    Close
                  </button>
                </div>

                <p className="text-[10px] sm:text-[11px] font-medium text-center text-[#A7AAAD]/40 tracking-wider">
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

