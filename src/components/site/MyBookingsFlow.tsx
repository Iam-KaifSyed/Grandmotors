import { useState, useId, useEffect } from 'react';
import { SERVICES } from './servicesData';
import { ArrowRightIcon } from './Icons';
import {
  verifyAndFetchBookings,
  type Booking,
} from '../../lib/bookings';

const StatusBadge = ({ status }: { status: Booking['status'] }) => {
  const getColors = () => {
    switch (status) {
      case 'Pending':
        return 'text-[#A7AAAD] border-[#A7AAAD]/30 bg-[#A7AAAD]/5';
      case 'Confirmed':
        return 'text-[#B88952] border-[#B88952]/30 bg-[#B88952]/5';
      case 'In Progress':
        return 'text-[#F2F0EA] border-[#F2F0EA]/30 bg-[#F2F0EA]/5';
      case 'Completed':
        return 'text-[#25D366] border-[#25D366]/30 bg-[#25D366]/5';
      case 'Cancelled':
        return 'text-[#FF5F5F] border-[#FF5F5F]/30 bg-[#FF5F5F]/5';
      default:
        return 'text-[#A7AAAD] border-[#A7AAAD]/30';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] uppercase px-2.5 py-1 rounded-full border ${getColors()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {status}
    </span>
  );
};

export const MyBookingsFlow = () => {
  const [phone, setPhone] = useState('');
  const [ref, setRef] = useState('');
  const [view, setView] = useState<'auth' | 'list' | 'detail'>('auth');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const phoneId = useId();
  const refId = useId();

  // Auto-verify if query parameters exist in URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const queryRef = urlParams.get('ref');
    const queryPhone = urlParams.get('phone');

    if (queryRef || queryPhone) {
      if (queryRef) setRef(queryRef);
      if (queryPhone) setPhone(queryPhone);

      const result = verifyAndFetchBookings(queryRef || '', queryPhone || '');
      if (!result.error && result.bookings.length > 0) {
        setBookings(result.bookings);
        if (result.matchedBooking) {
          setSelectedBooking(result.matchedBooking);
          setView('detail');
        } else {
          setView('list');
        }
      }
    }
  }, []);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const result = verifyAndFetchBookings(ref, phone);

      if (result.error) {
        setErrorMessage(result.error);
        setIsLoading(false);
        return;
      }

      setBookings(result.bookings);

      if (result.bookings.length === 0) {
        setView('list');
      } else if (result.matchedBooking && result.bookings.length === 1) {
        setSelectedBooking(result.matchedBooking);
        setView('detail');
      } else {
        setView('list');
      }

      setIsLoading(false);
    }, 450);
  };

  const handleReset = () => {
    setErrorMessage(null);
    setView('auth');
  };

  // State 1: Verification Form
  if (view === 'auth') {
    return (
      <div className="max-w-md mx-auto bg-[#111315] border border-white/8 rounded-2xl p-6 sm:p-10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-4 h-px bg-[#B88952]"></span>
            <span className="text-[10px] font-semibold tracking-[0.25em] text-[#B88952] uppercase">
              Access Control
            </span>
            <span className="w-4 h-px bg-[#B88952]"></span>
          </div>
          <h3 className="text-lg font-extrabold tracking-[-0.01em] text-[#F2F0EA] uppercase">
            Customer Verification
          </h3>
          <p className="mt-2 text-xs text-[#A7AAAD] leading-relaxed">
            Enter your booking reference and registered phone number to view your service status and history.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-lg bg-red-950/40 border border-red-500/30 text-red-200 text-xs leading-relaxed flex items-start gap-2.5">
            <span className="text-red-400 font-bold shrink-0">✕</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label
              htmlFor={refId}
              className="block text-[11px] font-semibold tracking-[0.1em] text-[#F2F0EA] uppercase mb-2"
            >
              Booking Reference <span className="text-[#B88952]">*</span>
            </label>
            <input
              id={refId}
              type="text"
              value={ref}
              onChange={(e) => {
                setRef(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="e.g. GM-842910"
              required
              className="w-full bg-[#0A0C0D] border border-white/10 rounded-lg px-4 py-3 text-sm text-[#F2F0EA] placeholder-[#A7AAAD]/40 focus:border-[#B88952] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor={phoneId}
              className="block text-[11px] font-semibold tracking-[0.1em] text-[#F2F0EA] uppercase mb-2"
            >
              Registered Phone Number <span className="text-[#B88952]">*</span>
            </label>
            <input
              id={phoneId}
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="e.g. +91 98765 43210"
              required
              className="w-full bg-[#0A0C0D] border border-white/10 rounded-lg px-4 py-3 text-sm text-[#F2F0EA] placeholder-[#A7AAAD]/40 focus:border-[#B88952] focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 inline-flex items-center justify-center px-6 py-4 text-xs font-semibold tracking-[0.2em] uppercase text-[#0A0C0D] bg-[#B88952] hover:bg-[#caa066] active:bg-[#a67943] disabled:opacity-50 rounded-lg transition-all shadow-lg shadow-[#B88952]/10 cursor-pointer"
          >
            {isLoading ? 'Verifying Details...' : 'View Booking Status'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/5 text-center space-y-2">
          <p className="text-[11px] text-[#A7AAAD]/70">
            Demo Reference: <code className="text-[#B88952] font-mono">GM-842910</code> &bull; Phone: <code className="text-[#B88952] font-mono">9876543210</code>
          </p>
          <p className="text-[11px] text-[#A7AAAD]/50">
            Have a new requirement? <a href="/book-service" className="text-[#B88952] hover:underline">Book a service here</a>
          </p>
        </div>
      </div>
    );
  }

  // State 2: Booking List View / Empty State
  if (view === 'list') {
    if (bookings.length === 0) {
      return (
        <div className="max-w-xl mx-auto text-center py-16 px-6 bg-[#111315] border border-white/8 rounded-2xl relative overflow-hidden">
          <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 mx-auto mb-6 flex items-center justify-center text-[#A7AAAD]">
            <span className="text-xl">?</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold tracking-[-0.01em] text-[#F2F0EA] uppercase mb-3">
            No Bookings Found
          </h3>

          <p className="text-sm text-[#A7AAAD] leading-relaxed max-w-md mx-auto mb-8">
            We couldn't find any service records matching your search details. Please check your Booking ID or submit a new service request.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/book-service"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase text-[#0A0C0D] bg-[#B88952] hover:bg-[#caa066] rounded-lg transition-colors"
            >
              Book a Service
            </a>

            <button
              onClick={handleReset}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase text-[#A7AAAD] hover:text-[#F2F0EA] bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    const activeBookings = bookings.filter((b) =>
      ['Pending', 'Confirmed', 'In Progress'].includes(b.status)
    );
    const pastBookings = bookings.filter((b) =>
      ['Completed', 'Cancelled'].includes(b.status)
    );

    return (
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Actions Bar */}
        <div className="flex justify-between items-center pb-4 border-b border-white/5">
          <button
            onClick={handleReset}
            className="text-xs font-semibold tracking-[0.15em] uppercase text-[#A7AAAD] hover:text-[#F2F0EA] transition-colors flex items-center gap-2 cursor-pointer"
          >
            ← Verify Another Number
          </button>

          <a
            href="/book-service"
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold tracking-[0.15em] uppercase text-[#0A0C0D] bg-[#B88952] hover:bg-[#caa066] rounded-md transition-colors"
          >
            + New Booking
          </a>
        </div>

        {/* Active Bookings Section */}
        {activeBookings.length > 0 && (
          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <span className="w-5 h-px bg-[#B88952]"></span>
              <h3 className="text-xs font-semibold tracking-[0.25em] text-[#B88952] uppercase">
                Active Service Requests ({activeBookings.length})
              </h3>
            </div>

            <div className="grid gap-4">
              {activeBookings.map((b) => (
                <div
                  key={b.id}
                  className="bg-[#111315] border border-white/8 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-[#B88952]/40 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-base font-mono font-bold text-[#F2F0EA]">
                        {b.id}
                      </span>
                      <StatusBadge status={b.status} />
                    </div>
                    <div className="text-sm font-semibold text-[#F2F0EA]">
                      {b.vehicleMake} {b.vehicleModel} ({b.registrationNumber})
                    </div>
                    <div className="text-xs text-[#A7AAAD]">
                      {SERVICES.find((s) => s.id === b.serviceCategory)?.title || b.serviceCategory} &bull; Scheduled: {b.preferredDate} ({b.preferredTime})
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedBooking(b);
                      setView('detail');
                    }}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold tracking-[0.15em] uppercase text-[#F2F0EA] bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors shrink-0 cursor-pointer"
                  >
                    View Details
                    <ArrowRightIcon className="w-3.5 h-3.5 text-[#B88952]" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Booking History Section */}
        {pastBookings.length > 0 && (
          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <span className="w-5 h-px bg-[#A7AAAD]/40"></span>
              <h3 className="text-xs font-semibold tracking-[0.25em] text-[#A7AAAD] uppercase">
                Past Booking History ({pastBookings.length})
              </h3>
            </div>

            <div className="grid gap-4 opacity-80">
              {pastBookings.map((b) => (
                <div
                  key={b.id}
                  className="bg-[#111315]/60 border border-white/5 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-white/15 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-base font-mono font-bold text-[#D8D6D0]">
                        {b.id}
                      </span>
                      <StatusBadge status={b.status} />
                    </div>
                    <div className="text-sm font-semibold text-[#D8D6D0]">
                      {b.vehicleMake} {b.vehicleModel} ({b.registrationNumber})
                    </div>
                    <div className="text-xs text-[#A7AAAD]/80">
                      {SERVICES.find((s) => s.id === b.serviceCategory)?.title || b.serviceCategory} &bull; Completed: {b.preferredDate}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedBooking(b);
                      setView('detail');
                    }}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold tracking-[0.15em] uppercase text-[#A7AAAD] hover:text-[#F2F0EA] bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-colors shrink-0 cursor-pointer"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // State 3: Booking Details View
  if (view === 'detail' && selectedBooking) {
    const categoryTitle =
      SERVICES.find((s) => s.id === selectedBooking.serviceCategory)?.title ||
      selectedBooking.serviceCategory;

    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8">
          {bookings.length > 1 ? (
            <button
              onClick={() => setView('list')}
              className="text-xs font-semibold tracking-[0.15em] uppercase text-[#A7AAAD] hover:text-[#F2F0EA] transition-colors flex items-center gap-2 cursor-pointer"
            >
              ← Back to Booking List
            </button>
          ) : (
            <button
              onClick={handleReset}
              className="text-xs font-semibold tracking-[0.15em] uppercase text-[#A7AAAD] hover:text-[#F2F0EA] transition-colors flex items-center gap-2 cursor-pointer"
            >
              ← Check Another Booking
            </button>
          )}

          <a
            href="/book-service"
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold tracking-[0.15em] uppercase text-[#0A0C0D] bg-[#B88952] hover:bg-[#caa066] rounded-md transition-colors"
          >
            + New Booking
          </a>
        </div>

        <div className="bg-[#111315] border border-white/8 rounded-2xl p-6 sm:p-10 space-y-10 shadow-2xl">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-white/5">
            <div>
              <span className="text-xs font-semibold tracking-[0.15em] uppercase text-[#A7AAAD]">
                Service Request Details
              </span>
              <h2 className="text-2xl sm:text-3xl font-mono font-bold text-[#F2F0EA] mt-1">
                {selectedBooking.id}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-[#A7AAAD]">Status:</span>
              <StatusBadge status={selectedBooking.status} />
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid sm:grid-cols-2 gap-8 text-sm">
            <div>
              <span className="block text-xs font-semibold tracking-[0.1em] text-[#A7AAAD] uppercase mb-1">
                Customer Name
              </span>
              <span className="text-base text-[#F2F0EA] font-medium">
                {selectedBooking.fullName}
              </span>
            </div>

            <div>
              <span className="block text-xs font-semibold tracking-[0.1em] text-[#A7AAAD] uppercase mb-1">
                Vehicle Details
              </span>
              <span className="text-base text-[#F2F0EA] font-medium">
                {selectedBooking.vehicleMake} {selectedBooking.vehicleModel}
              </span>
              <span className="block text-xs text-[#A7AAAD] mt-0.5">
                Reg: {selectedBooking.registrationNumber}
              </span>
            </div>

            <div>
              <span className="block text-xs font-semibold tracking-[0.1em] text-[#A7AAAD] uppercase mb-1">
                Service Category
              </span>
              <span className="text-base text-[#F2F0EA] font-medium">
                {categoryTitle}
              </span>
              {selectedBooking.specificService && (
                <span className="block text-xs text-[#A7AAAD] mt-0.5">
                  Specific: {selectedBooking.specificService}
                </span>
              )}
            </div>

            <div>
              <span className="block text-xs font-semibold tracking-[0.1em] text-[#A7AAAD] uppercase mb-1">
                Appointment Date & Slot
              </span>
              <span className="text-base text-[#F2F0EA] font-medium">
                {selectedBooking.preferredDate}
              </span>
              <span className="block text-xs text-[#A7AAAD] mt-0.5">
                {selectedBooking.preferredTime}
              </span>
            </div>

            <div>
              <span className="block text-xs font-semibold tracking-[0.1em] text-[#A7AAAD] uppercase mb-1">
                Contact Phone & Email
              </span>
              <span className="text-base text-[#F2F0EA] font-medium">
                {selectedBooking.phoneNumber}
              </span>
              {selectedBooking.email && (
                <span className="block text-xs text-[#A7AAAD] mt-0.5">
                  {selectedBooking.email}
                </span>
              )}
            </div>

            <div>
              <span className="block text-xs font-semibold tracking-[0.1em] text-[#A7AAAD] uppercase mb-1">
                Booking Created On
              </span>
              <span className="text-base text-[#F2F0EA] font-medium">
                {new Date(selectedBooking.createdAt).toLocaleDateString()}
              </span>
            </div>

            {selectedBooking.additionalMessage && (
              <div className="sm:col-span-2 pt-4 border-t border-white/5">
                <span className="block text-xs font-semibold tracking-[0.1em] text-[#A7AAAD] uppercase mb-1">
                  Additional Notes
                </span>
                <p className="text-sm text-[#F2F0EA] bg-[#0A0C0D] p-4 rounded-lg border border-white/5">
                  {selectedBooking.additionalMessage}
                </p>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-[#A7AAAD]">
              Need to reschedule or make changes?
            </span>
            <div className="flex gap-4">
              <a
                href="tel:+918623948898"
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold tracking-[0.15em] uppercase text-[#F2F0EA] bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
              >
                Call Support
              </a>
              <a
                href="https://wa.me/918623948898"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold tracking-[0.15em] uppercase text-[#F2F0EA] bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
              >
                WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
