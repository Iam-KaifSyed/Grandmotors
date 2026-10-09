import { useState, useId, useEffect } from 'react';
import { SERVICES } from './servicesData';
import { getBookingById, type BookingRecord } from '../../lib/bookingStore';

const STATUS_STEPS: Array<{ key: BookingRecord['status']; label: string; desc: string }> = [
  { key: 'Pending', label: 'Request Received', desc: 'Awaiting workshop review' },
  { key: 'Confirmed', label: 'Confirmed', desc: 'Bay & slot scheduled' },
  { key: 'In Progress', label: 'In Progress', desc: 'Technicians at work' },
  { key: 'Completed', label: 'Completed', desc: 'Ready for pickup' },
];

const StatusBadge = ({ status }: { status: BookingRecord['status'] }) => {
  const getColors = () => {
    switch (status) {
      case 'Pending':
        return 'text-[#A7AAAD] border-[#A7AAAD]/30 bg-[#A7AAAD]/10';
      case 'Confirmed':
        return 'text-[#B88952] border-[#B88952]/40 bg-[#B88952]/10';
      case 'In Progress':
        return 'text-[#F2F0EA] border-[#F2F0EA]/40 bg-white/10';
      case 'Completed':
        return 'text-[#25D366] border-[#25D366]/40 bg-[#25D366]/10';
      case 'Cancelled':
        return 'text-[#FF5F5F] border-[#FF5F5F]/40 bg-[#FF5F5F]/10';
      default:
        return 'text-[#A7AAAD] border-[#A7AAAD]/30';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full border ${getColors()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {status}
    </span>
  );
};

export const TrackBookingFlow = () => {
  const [bookingIdInput, setBookingIdInput] = useState('');
  const [activeBooking, setActiveBooking] = useState<BookingRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const inputId = useId();

  // Auto-search if ?id= is in the URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const queryId = params.get('id');
    if (queryId) {
      setBookingIdInput(queryId);
      performSearch(queryId);
    }
  }, []);

  const performSearch = async (idToSearch: string) => {
    const trimmed = idToSearch.trim();
    if (!trimmed) {
      setErrorMessage('Please enter a Booking ID.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const resp = await fetch(`/api/bookings/${encodeURIComponent(trimmed)}`);
      if (resp.ok) {
        const data = await resp.json();
        setActiveBooking(data);
        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Backend fetch failed, falling back to local DB', err);
    }

    // Fallback block if backend isn't ready or ID is from local/demo mockup
    const match = getBookingById(trimmed);
    if (match) {
      setActiveBooking(match);
    } else {
      setActiveBooking(null);
      setErrorMessage(
        `No active booking found for ID "${trimmed}". Please double-check your reference code or contact support.`
      );
    }
    setIsLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(bookingIdInput);
  };

  const handleCopyId = async (id: string) => {
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
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy ID', err);
    }
  };

  const handleReset = () => {
    setActiveBooking(null);
    setErrorMessage(null);
    setBookingIdInput('');
  };

  // Helper to calculate active step index
  const getStepStatus = (stepKey: BookingRecord['status'], currentStatus: BookingRecord['status']) => {
    if (currentStatus === 'Cancelled') return 'cancelled';
    const stepOrder = ['Pending', 'Confirmed', 'In Progress', 'Completed'];
    const currentIndex = stepOrder.indexOf(currentStatus);
    const stepIndex = stepOrder.indexOf(stepKey);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {/* Search Input Bar (Always accessible or when searching) */}
      {!activeBooking && (
        <div className="bg-[#111315] border border-white/8 rounded-2xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          {/* Subtle accent glow */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-[#B88952]/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="w-4 h-px bg-[#B88952]"></span>
              <span className="text-[10px] font-semibold tracking-[0.25em] text-[#B88952] uppercase">
                Real-Time Service Tracking
              </span>
              <span className="w-4 h-px bg-[#B88952]"></span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-[-0.01em] text-[#F2F0EA] uppercase">
              Check Your Service Status
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[#A7AAAD] leading-relaxed max-w-md mx-auto">
              Enter the unique Booking ID provided when your service request was scheduled.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs leading-relaxed flex items-start gap-3">
              <span className="text-red-400 font-bold shrink-0 text-sm">✕</span>
              <div className="space-y-1">
                <p>{errorMessage}</p>
                <p className="text-[11px] text-red-300/70">
                  Tip: Try demo ID <code className="text-[#B88952] font-mono">GM-229397</code> or <code className="text-[#B88952] font-mono">GM-842910</code>.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor={inputId}
                className="block text-[11px] font-semibold tracking-[0.1em] text-[#F2F0EA] uppercase mb-2"
              >
                Booking ID <span className="text-[#B88952]">*</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  id={inputId}
                  type="text"
                  value={bookingIdInput}
                  onChange={(e) => {
                    setBookingIdInput(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="e.g. GM-229397"
                  required
                  className="flex-1 bg-[#0A0C0D] border border-white/10 rounded-lg px-4 py-3.5 text-base sm:text-sm font-mono uppercase text-[#F2F0EA] placeholder-[#A7AAAD]/40 focus:border-[#B88952] focus:outline-none transition-colors"
                />

                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center justify-center px-8 py-3.5 text-xs font-semibold tracking-[0.2em] uppercase text-[#0A0C0D] bg-[#B88952] hover:bg-[#caa066] active:bg-[#a67943] disabled:opacity-50 rounded-lg transition-all shadow-lg shadow-[#B88952]/10 cursor-pointer shrink-0 font-bold"
                >
                  {isLoading ? 'Searching...' : 'Track Status'}
                </button>
              </div>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#A7AAAD]/70 gap-3">
            <span>Demo Reference: <code className="text-[#B88952] font-mono">GM-229397</code></span>
            <a href="/book-service" className="text-[#B88952] hover:underline">Need a new appointment? Book here &rarr;</a>
          </div>
        </div>
      )}

      {/* Active Booking Detail View */}
      {activeBooking && (
        <div className="space-y-8 animate-fade-in">
          {/* Top Actions */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handleReset}
              className="text-xs font-semibold tracking-[0.15em] uppercase text-[#A7AAAD] hover:text-[#F2F0EA] transition-colors flex items-center gap-2 cursor-pointer"
            >
              &larr; Track Another Booking
            </button>

            <a
              href="/book-service"
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold tracking-[0.15em] uppercase text-[#0A0C0D] bg-[#B88952] hover:bg-[#caa066] rounded-md transition-colors"
            >
              + New Booking
            </a>
          </div>

          {/* Main Card */}
          <div className="bg-[#111315] border border-white/8 rounded-2xl p-6 sm:p-10 space-y-10 shadow-2xl relative overflow-hidden">
            {/* Subtle accent glow */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-[#B88952]/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Header / ID Hero */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-white/5">
              <div>
                <span className="text-[11px] font-semibold tracking-[0.2em] text-[#A7AAAD] uppercase block mb-1">
                  Service Tracking
                </span>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl sm:text-4xl font-mono font-extrabold text-[#F2F0EA]">
                    {activeBooking.id}
                  </h2>
                  <button
                    onClick={() => handleCopyId(activeBooking.id)}
                    title="Copy Booking ID"
                    className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded border border-white/10 hover:border-[#B88952] text-[#A7AAAD] hover:text-[#F2F0EA] transition-colors cursor-pointer"
                  >
                    {isCopied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-[#A7AAAD]">Status:</span>
                <StatusBadge status={activeBooking.status} />
              </div>
            </div>

            {/* Visual Step Progress Indicator — connected timeline */}
            {activeBooking.status !== 'Cancelled' ? (
              <div>
                <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#A7AAAD] mb-8">
                  Service Stage
                </div>

                {(() => {
                  const stepOrder = ['Pending', 'Confirmed', 'In Progress', 'Completed'];
                  const currentIndex = stepOrder.indexOf(activeBooking.status);
                  // Fill fraction of the connecting line (0 at first dot, 1 at last dot)
                  const fillPct =
                    STATUS_STEPS.length > 1
                      ? (Math.max(0, currentIndex) / (STATUS_STEPS.length - 1)) * 100
                      : 0;

                  return (
                    <>
                      {/* ---------- Desktop / tablet: horizontal timeline ---------- */}
                      <div className="hidden sm:block">
                        <div className="relative">
                          {/* Base + progress line (sits behind the dots, centered on them) */}
                          <div className="absolute left-0 right-0 top-5 h-[3px] mx-[11%]">
                            <div className="absolute inset-0 rounded-full bg-white/10" />
                            <div
                              className="absolute inset-y-0 left-0 rounded-full bg-[#B88952] transition-[width] duration-700 ease-out"
                              style={{ width: `${fillPct}%` }}
                            />
                          </div>

                          <div className="relative grid grid-cols-4 gap-4">
                            {STATUS_STEPS.map((step, idx) => {
                              const stepState = getStepStatus(step.key, activeBooking.status);
                              return (
                                <div key={step.key} className="flex flex-col items-center text-center">
                                  <span
                                    className={`relative z-10 grid place-items-center w-10 h-10 rounded-full transition-all duration-300 ${
                                      stepState === 'current'
                                        ? 'bg-[#B88952]/15 border-2 border-[#B88952] text-[#B88952]'
                                        : stepState === 'completed'
                                        ? 'bg-[#B88952] text-[#0A0C0D] border-2 border-[#B88952]'
                                        : 'bg-[#0A0C0D] border border-white/15 text-[#A7AAAD]/50'
                                    }`}
                                  >
                                    {stepState === 'current' && (
                                      <span className="absolute inset-0 rounded-full border-2 border-[#B88952]/50 animate-ping" />
                                    )}
                                    {stepState === 'completed' ? (
                                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="m4 12 5 5L20 6" />
                                      </svg>
                                    ) : stepState === 'current' ? (
                                      <span className="w-2.5 h-2.5 rounded-full bg-[#B88952]" />
                                    ) : (
                                      <span className="text-[12px] font-bold">{idx + 1}</span>
                                    )}
                                  </span>
                                  <span
                                    className={`mt-4 text-[13px] font-bold tracking-tight ${
                                      stepState === 'upcoming' ? 'text-[#A7AAAD]/50' : 'text-[#F2F0EA]'
                                    }`}
                                  >
                                    {step.label}
                                  </span>
                                  <span
                                    className={`mt-1 text-[11px] leading-tight ${
                                      stepState === 'upcoming' ? 'text-[#A7AAAD]/40' : 'text-[#A7AAAD]/80'
                                    }`}
                                  >
                                    {step.desc}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* ---------- Mobile: vertical connected timeline ---------- */}
                      <ol className="sm:hidden relative pl-2">
                        {STATUS_STEPS.map((step, idx) => {
                          const stepState = getStepStatus(step.key, activeBooking.status);
                          const isLast = idx === STATUS_STEPS.length - 1;
                          const nextDone =
                            getStepStatus(STATUS_STEPS[Math.min(idx + 1, STATUS_STEPS.length - 1)].key, activeBooking.status) !== 'upcoming';
                          return (
                            <li key={step.key} className="relative flex gap-4 pb-7 last:pb-0">
                              {/* Connector line */}
                              {!isLast && (
                                <span
                                  className={`absolute left-[19px] top-10 bottom-0 w-[2px] ${
                                    nextDone ? 'bg-[#B88952]' : 'bg-white/10'
                                  }`}
                                />
                              )}
                              <span
                                className={`relative z-10 grid place-items-center w-10 h-10 shrink-0 rounded-full transition-all duration-300 ${
                                  stepState === 'current'
                                    ? 'bg-[#B88952]/15 border-2 border-[#B88952] text-[#B88952]'
                                    : stepState === 'completed'
                                    ? 'bg-[#B88952] text-[#0A0C0D] border-2 border-[#B88952]'
                                    : 'bg-[#0A0C0D] border border-white/15 text-[#A7AAAD]/50'
                                }`}
                              >
                                {stepState === 'completed' ? (
                                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="m4 12 5 5L20 6" />
                                  </svg>
                                ) : stepState === 'current' ? (
                                  <span className="w-2.5 h-2.5 rounded-full bg-[#B88952]" />
                                ) : (
                                  <span className="text-[12px] font-bold">{idx + 1}</span>
                                )}
                              </span>
                              <div className="pt-1">
                                <span
                                  className={`block text-[14px] font-bold tracking-tight ${
                                    stepState === 'upcoming' ? 'text-[#A7AAAD]/50' : 'text-[#F2F0EA]'
                                  }`}
                                >
                                  {step.label}
                                </span>
                                <span
                                  className={`block mt-0.5 text-[12px] leading-tight ${
                                    stepState === 'upcoming' ? 'text-[#A7AAAD]/40' : 'text-[#A7AAAD]/80'
                                  }`}
                                >
                                  {step.desc}
                                </span>
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 text-xs text-red-200">
                This service request has been cancelled. Please contact our service advisor if you would like to reschedule.
              </div>
            )}

            {/* Detailed Breakdown Grid */}
            <div className="grid sm:grid-cols-2 gap-8 text-xs sm:text-sm pt-4 border-t border-white/5">
              <div>
                <span className="block text-[11px] font-semibold tracking-[0.1em] text-[#A7AAAD] uppercase mb-1">
                  Customer
                </span>
                <span className="text-base text-[#F2F0EA] font-medium block">
                  {activeBooking.fullName}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-semibold tracking-[0.1em] text-[#A7AAAD] uppercase mb-1">
                  Vehicle
                </span>
                <span className="text-base text-[#F2F0EA] font-medium block">
                  {activeBooking.vehicleMake} {activeBooking.vehicleModel}
                </span>
                <span className="block text-xs text-[#A7AAAD] mt-0.5 font-mono">
                  Reg: {activeBooking.registrationNumber}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-semibold tracking-[0.1em] text-[#A7AAAD] uppercase mb-1">
                  Service Category
                </span>
                <span className="text-base text-[#F2F0EA] font-medium block">
                  {SERVICES.find((s) => s.id === activeBooking.serviceCategory)?.title || activeBooking.serviceCategory}
                </span>
                {activeBooking.specificService && (
                  <span className="block text-xs text-[#A7AAAD] mt-0.5">
                    Specific: {activeBooking.specificService}
                  </span>
                )}
              </div>

              <div>
                <span className="block text-[11px] font-semibold tracking-[0.1em] text-[#A7AAAD] uppercase mb-1">
                  Scheduled Appointment
                </span>
                <span className="text-base text-[#F2F0EA] font-medium block">
                  {activeBooking.preferredDate}
                </span>
                <span className="block text-xs text-[#A7AAAD] mt-0.5">
                  Slot: {activeBooking.preferredTime}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-semibold tracking-[0.1em] text-[#A7AAAD] uppercase mb-1">
                  Registered Contact
                </span>
                <span className="text-base text-[#F2F0EA] font-medium block font-mono">
                  {activeBooking.phoneNumber}
                </span>
                {activeBooking.email && (
                  <span className="block text-xs text-[#A7AAAD] mt-0.5">
                    {activeBooking.email}
                  </span>
                )}
              </div>

              <div>
                <span className="block text-[11px] font-semibold tracking-[0.1em] text-[#A7AAAD] uppercase mb-1">
                  Service Location
                </span>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold tracking-wider uppercase rounded-md border ${
                    activeBooking.serviceLocation === 'Doorstep Service'
                      ? 'text-[#B88952] border-[#B88952]/40 bg-[#B88952]/10'
                      : 'text-[#F2F0EA] border-white/20 bg-white/5'
                  }`}>
                    {activeBooking.serviceLocation === 'Doorstep Service' ? '🏠 Doorstep Service' : '🏢 Workshop Visit'}
                  </span>
                </div>
                {activeBooking.serviceLocation === 'Doorstep Service' ? (
                  <div className="mt-2 text-xs text-[#F2F0EA] space-y-1 bg-[#0A0C0D] p-3 rounded-lg border border-white/5">
                    {(activeBooking.doorstepHouseFlat || activeBooking.doorstepStreetLocality) && (
                      <p className="font-medium">
                        {[activeBooking.doorstepHouseFlat, activeBooking.doorstepStreetLocality].filter(Boolean).join(', ')}
                      </p>
                    )}
                    <p className="text-[#A7AAAD]">
                      {[activeBooking.doorstepCity, activeBooking.doorstepPincode].filter(Boolean).join(' - ')}
                    </p>
                    {activeBooking.doorstepMapUrl && (
                      <a
                        href={activeBooking.doorstepMapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B88952] hover:text-[#caa066] pt-1 transition-colors"
                      >
                        <span>View Map Location</span>
                        <span>↗</span>
                      </a>
                    )}
                  </div>
                ) : (
                  <span className="block text-xs text-[#A7AAAD] mt-1">
                    Moosapet Workshop Bay • Hyderabad
                  </span>
                )}
              </div>

              <div>
                <span className="block text-[11px] font-semibold tracking-[0.1em] text-[#A7AAAD] uppercase mb-1">
                  Date Requested
                </span>
                <span className="text-base text-[#F2F0EA] font-medium block">
                  {new Date(activeBooking.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>

              {activeBooking.additionalMessage && (
                <div className="sm:col-span-2 pt-4 border-t border-white/5">
                  <span className="block text-[11px] font-semibold tracking-[0.1em] text-[#A7AAAD] uppercase mb-1">
                    Special Instructions
                  </span>
                  <p className="text-sm text-[#F2F0EA] bg-[#0A0C0D] p-4 rounded-lg border border-white/5">
                    {activeBooking.additionalMessage}
                  </p>
                </div>
              )}
            </div>

            {/* Footer Support Actions */}
            <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-[#A7AAAD]">
                Questions regarding your booking?
              </span>
              <div className="flex gap-3">
                <a
                  href="tel:+918623948898"
                  className="inline-flex items-center justify-center px-4 py-2.5 text-xs font-semibold tracking-[0.15em] uppercase text-[#F2F0EA] bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
                >
                  Call Workshop
                </a>
                <a
                  href="https://wa.me/918623948898"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-4 py-2.5 text-xs font-semibold tracking-[0.15em] uppercase text-[#F2F0EA] bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
                >
                  WhatsApp Us
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
