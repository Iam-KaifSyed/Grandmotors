import { useState, useId } from 'react';
import { SERVICES } from './servicesData';
import { saveBookingRecord, type BookingRecord } from '../../lib/bookingStore';
import {
  DEFAULT_BOOKING_FORM_CONFIG,
  type BookingFormConfig,
} from '../../lib/bookingFormConfigStore';

export interface BookingFormData {
  fullName: string;
  phoneNumber: string;
  email: string;
  vehicleMake: string;
  vehicleModel: string;
  registrationNumber: string;
  serviceCategory: string;
  specificService: string;
  preferredDate: string;
  preferredTime: string;
  additionalMessage: string;
  serviceLocation: 'Workshop Visit' | 'Doorstep Service';
  doorstepHouseFlat?: string;
  doorstepStreetLocality?: string;
  doorstepCity?: string;
  doorstepPincode?: string;
  doorstepLatitude?: number | null;
  doorstepLongitude?: number | null;
  doorstepMapUrl?: string;
  customAnswers?: Record<string, string>;
  submittedAt?: string;
  bookingRef?: string;
}

interface ServiceOption {
  id: string;
  title: string;
  items: string[];
}

interface BookServiceFormProps {
  onSubmit?: (data: BookingFormData) => void;
  services?: ServiceOption[];
  config?: BookingFormConfig;
}

export const BookServiceForm = ({
  onSubmit,
  services = SERVICES,
  config = DEFAULT_BOOKING_FORM_CONFIG,
}: BookServiceFormProps = {}) => {
  const [formState, setFormState] = useState<BookingFormData>({
    fullName: '',
    phoneNumber: '',
    email: '',
    vehicleMake: '',
    vehicleModel: '',
    registrationNumber: '',
    serviceCategory: '',
    specificService: '',
    preferredDate: '',
    preferredTime: '',
    additionalMessage: '',
    serviceLocation: 'Workshop Visit',
    doorstepHouseFlat: '',
    doorstepStreetLocality: '',
    doorstepCity: '',
    doorstepPincode: '',
    doorstepLatitude: null,
    doorstepLongitude: null,
    doorstepMapUrl: '',
    customAnswers: {},
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<BookingFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Geolocation states
  const [isLocating, setIsLocating] = useState(false);
  const [locationFeedback, setLocationFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Generate unique IDs for fields
  const fullNameId = useId();
  const phoneNumberId = useId();
  const emailId = useId();
  const vehicleMakeId = useId();
  const vehicleModelId = useId();
  const registrationNumberId = useId();
  const serviceCategoryId = useId();
  const specificServiceId = useId();
  const preferredDateId = useId();
  const preferredTimeId = useId();
  const additionalMessageId = useId();
  const doorstepHouseFlatId = useId();
  const doorstepStreetLocalityId = useId();
  const doorstepCityId = useId();
  const doorstepPincodeId = useId();

  const labels = { ...DEFAULT_BOOKING_FORM_CONFIG.fieldLabels, ...(config?.fieldLabels || {}) };
  const optionalVis = {
    ...DEFAULT_BOOKING_FORM_CONFIG.optionalFieldVisibility,
    ...(config?.optionalFieldVisibility || {}),
  };
  const appointmentSlots =
    config?.appointmentSlots && config.appointmentSlots.length > 0
      ? config.appointmentSlots
      : DEFAULT_BOOKING_FORM_CONFIG.appointmentSlots;
  const customQuestions = config?.customQuestions || [];

  // Selected Category's specific items
  const selectedCategoryObj = services.find((s) => s.id === formState.serviceCategory);
  const specificServiceOptions = selectedCategoryObj ? selectedCategoryObj.items : [];

  const handleShareLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationFeedback({
        type: 'error',
        message: 'Geolocation is not supported by your browser. Please enter your address manually.',
      });
      return;
    }

    setIsLocating(true);
    setLocationFeedback(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;

        setFormState((prev) => ({
          ...prev,
          doorstepLatitude: lat,
          doorstepLongitude: lng,
          doorstepMapUrl: mapUrl,
        }));

        setLocationFeedback({
          type: 'success',
          message: `Location detected (${lat}, ${lng}). You can also fine-tune your street and flat number below.`,
        });
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        let msg = 'Could not detect your location. Please enter your address details manually below.';
        if (err.code === 1) {
          msg = 'Location permission was denied. Please enter your address manually below.';
        } else if (err.code === 2) {
          msg = 'Location coordinates are currently unavailable. Please enter your address manually.';
        } else if (err.code === 3) {
          msg = 'Location detection timed out. Please enter your address manually.';
        }
        setLocationFeedback({
          type: 'info',
          message: msg,
        });
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleClearLocation = () => {
    setFormState((prev) => ({
      ...prev,
      doorstepLatitude: null,
      doorstepLongitude: null,
      doorstepMapUrl: '',
    }));
    setLocationFeedback(null);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formState.fullName.trim()) {
      newErrors.fullName = `${labels.fullName || 'Full Name'} is required`;
    }

    if (!formState.phoneNumber.trim()) {
      newErrors.phoneNumber = `${labels.phoneNumber || 'Phone Number'} is required`;
    } else if (!/^\+?[\d\s-]{8,18}$/.test(formState.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Enter a valid phone number (8-18 digits)';
    }

    if (formState.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim())) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!formState.vehicleMake.trim()) {
      newErrors.vehicleMake = `${labels.vehicleMake || 'Vehicle Make'} is required`;
    }

    if (!formState.vehicleModel.trim()) {
      newErrors.vehicleModel = `${labels.vehicleModel || 'Vehicle Model'} is required`;
    }

    if (!formState.registrationNumber.trim()) {
      newErrors.registrationNumber = `${labels.registrationNumber || 'Registration Number'} is required`;
    }

    if (!formState.serviceCategory) {
      newErrors.serviceCategory = `Please select a ${labels.serviceCategory || 'Service Category'}`;
    }

    // Validate Doorstep Address fields if Doorstep Service is selected
    if (formState.serviceLocation === 'Doorstep Service') {
      if (!formState.doorstepHouseFlat?.trim()) {
        newErrors.doorstepHouseFlat = 'House / Flat / Building No. is required';
      }

      if (!formState.doorstepStreetLocality?.trim()) {
        newErrors.doorstepStreetLocality = 'Street / Locality is required';
      }

      if (!formState.doorstepCity?.trim()) {
        newErrors.doorstepCity = 'City is required';
      }

      if (!formState.doorstepPincode?.trim()) {
        newErrors.doorstepPincode = 'PIN code is required';
      } else if (!/^[1-9][0-9]{5}$/.test(formState.doorstepPincode.trim())) {
        newErrors.doorstepPincode = 'Enter a valid 6-digit Indian PIN code (e.g. 500018)';
      }
    }

    if (!formState.preferredDate) {
      newErrors.preferredDate = `${labels.preferredDate || 'Preferred Date'} is required`;
    }

    if (!formState.preferredTime) {
      newErrors.preferredTime = `${labels.preferredTime || 'Preferred Time'} is required`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCopyBookingId = async () => {
    if (!submittedData?.bookingRef) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(submittedData.bookingRef);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = submittedData.bookingRef;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy booking ID', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setServerError(null);

    if (validate()) {
      setIsSubmitting(true);

      try {
        let combinedMessage = formState.additionalMessage.trim();
        if (formState.customAnswers && Object.keys(formState.customAnswers).length > 0) {
          const customLines = Object.entries(formState.customAnswers)
            .map(([qLabel, ans]) => `${qLabel}: ${ans}`)
            .join('\n');
          combinedMessage = combinedMessage
            ? `${combinedMessage}\n\nAdditional Details:\n${customLines}`
            : `Additional Details:\n${customLines}`;
        }

        const isDoorstep = formState.serviceLocation === 'Doorstep Service';

        const payload = {
          fullName: formState.fullName.trim(),
          phoneNumber: formState.phoneNumber.trim(),
          email: formState.email.trim(),
          vehicleMake: formState.vehicleMake.trim(),
          vehicleModel: formState.vehicleModel.trim(),
          registrationNumber: formState.registrationNumber.trim().toUpperCase(),
          serviceCategory: formState.serviceCategory,
          specificService: formState.specificService,
          preferredDate: formState.preferredDate,
          preferredTime: formState.preferredTime,
          additionalMessage: combinedMessage,
          serviceLocation: formState.serviceLocation,
          doorstepHouseFlat: isDoorstep ? formState.doorstepHouseFlat?.trim() : '',
          doorstepStreetLocality: isDoorstep ? formState.doorstepStreetLocality?.trim() : '',
          doorstepCity: isDoorstep ? formState.doorstepCity?.trim() : '',
          doorstepPincode: isDoorstep ? formState.doorstepPincode?.trim() : '',
          doorstepLatitude: isDoorstep ? formState.doorstepLatitude : null,
          doorstepLongitude: isDoorstep ? formState.doorstepLongitude : null,
          doorstepMapUrl: isDoorstep ? formState.doorstepMapUrl : '',
        };

        const resp = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await resp.json().catch(() => ({}));

        if (!resp.ok) {
          setServerError(
            data.error ||
              'Unable to schedule booking on the server. Please check your information and try again.'
          );
          setIsSubmitting(false);
          return;
        }

        const serverId = data.id || data.booking?.id;
        const confirmedRecord: BookingRecord = data.booking || {
          id: serverId,
          bookingId: serverId,
          fullName: payload.fullName,
          customerName: payload.fullName,
          phoneNumber: payload.phoneNumber,
          phone: payload.phoneNumber,
          email: payload.email,
          vehicle: `${payload.vehicleMake} ${payload.vehicleModel}`.trim(),
          vehicleMake: payload.vehicleMake,
          vehicleModel: payload.vehicleModel,
          registrationNumber: payload.registrationNumber,
          serviceCategory: payload.serviceCategory,
          specificService: payload.specificService,
          preferredDate: payload.preferredDate,
          requestedDate: payload.preferredDate,
          preferredTime: payload.preferredTime,
          requestedTime: payload.preferredTime,
          status: 'Pending',
          additionalMessage: payload.additionalMessage,
          serviceLocation: payload.serviceLocation,
          doorstepHouseFlat: payload.doorstepHouseFlat,
          doorstepStreetLocality: payload.doorstepStreetLocality,
          doorstepCity: payload.doorstepCity,
          doorstepPincode: payload.doorstepPincode,
          doorstepLatitude: payload.doorstepLatitude,
          doorstepLongitude: payload.doorstepLongitude,
          doorstepMapUrl: payload.doorstepMapUrl,
          createdAt: new Date().toISOString(),
        };

        const finalData: BookingFormData = {
          ...formState,
          submittedAt: confirmedRecord.createdAt,
          bookingRef: serverId,
        };

        saveBookingRecord(confirmedRecord);
        setSubmittedData(finalData);
        setIsSubmitting(false);

        if (onSubmit) {
          onSubmit(finalData);
        }
      } catch (err) {
        console.error('Network or server error submitting booking:', err);
        setServerError(
          'A network connection error occurred. Please check your connection and try again.'
        );
        setIsSubmitting(false);
      }
    }
  };

  const clearError = (field: string) => {
    if (serverError) setServerError(null);
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  if (submittedData) {
    return (
      <div className="bg-[#111315] border border-white/10 rounded-2xl p-6 sm:p-10 md:p-12 text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 bg-[#B88952]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-3 text-[#B88952] mb-6">
          <span className="w-8 h-8 rounded-full border border-[#B88952]/40 bg-[#B88952]/10 flex items-center justify-center font-bold text-sm">
            ✓
          </span>
          <span className="text-xs font-semibold tracking-[0.25em] uppercase">Request Confirmed</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.02em] text-[#F2F0EA] uppercase mb-3">
          Service Request Received
        </h2>
        <p className="text-sm sm:text-base text-[#A7AAAD] leading-relaxed max-w-2xl mb-8">
          {config?.confirmationMessage ||
            `Thank you, ${submittedData.fullName}. Your service request has been received and saved to your device. Our workshop team will review the requirements and contact you to confirm your appointment.`}
        </p>

        {/* Booking ID Hero Card */}
        <div className="bg-[#0A0C0D] border border-[#B88952]/30 rounded-xl p-6 sm:p-8 mb-8 relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold tracking-[0.25em] text-[#B88952] uppercase block">
                YOUR BOOKING ID
              </span>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-mono font-black tracking-wider text-[#F2F0EA]">
                {submittedData.bookingRef}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleCopyBookingId}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-xs font-semibold tracking-[0.18em] uppercase text-[#0A0C0D] bg-[#B88952] hover:bg-[#caa066] active:bg-[#a67943] rounded-lg transition-all shadow-lg shadow-[#B88952]/15 cursor-pointer shrink-0"
              >
                {isCopied ? (
                  <>
                    <span className="font-bold">✓</span>
                    <span>COPIED</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <span>COPY BOOKING ID</span>
                  </>
                )}
              </button>

              <a
                href={`/my-bookings?id=${encodeURIComponent(submittedData.bookingRef || '')}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-xs font-semibold tracking-[0.18em] uppercase text-[#F2F0EA] bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors cursor-pointer"
              >
                View My Bookings &rarr;
              </a>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm text-[#A7AAAD]">
            <p className="leading-relaxed">
              Saved to <span className="text-[#F2F0EA] font-medium">My Bookings</span> on this device
              for instant access.
            </p>
            <span className="text-[11px] text-[#B88952] uppercase tracking-wider font-semibold">
              No Login Required
            </span>
          </div>
        </div>

        {/* Booking Summary */}
        <div className="bg-[#0A0C0D] border border-white/5 rounded-xl p-6 sm:p-8 mb-8 space-y-4">
          <div className="pb-3 border-b border-white/5">
            <span className="text-xs font-semibold tracking-[0.18em] uppercase text-[#F2F0EA]">
              Booking Summary
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-5 text-xs sm:text-sm">
            <div>
              <span className="block text-[11px] font-semibold tracking-[0.1em] text-[#A7AAAD] uppercase mb-1">
                Service Location
              </span>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                  submittedData.serviceLocation === 'Doorstep Service'
                    ? 'bg-[#B88952]/15 text-[#B88952] border border-[#B88952]/30'
                    : 'bg-white/10 text-[#F2F0EA] border border-white/15'
                }`}>
                  {submittedData.serviceLocation === 'Doorstep Service' ? '🏠 Doorstep Service' : '🏢 Workshop Visit'}
                </span>
              </div>
              {submittedData.serviceLocation === 'Doorstep Service' ? (
                <div className="mt-2 text-xs text-[#F2F0EA] leading-relaxed bg-[#0A0C0D] p-2.5 rounded-lg border border-white/5">
                  <p className="font-medium">
                    {submittedData.doorstepHouseFlat}, {submittedData.doorstepStreetLocality}
                  </p>
                  <p className="text-[#A7AAAD]">
                    {submittedData.doorstepCity} - {submittedData.doorstepPincode}
                  </p>
                  {submittedData.doorstepMapUrl && (
                    <a
                      href={submittedData.doorstepMapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B88952] hover:text-[#caa066] mt-1.5 transition-colors"
                    >
                      <span>View Map Location</span>
                      <span className="text-xs">&rarr;</span>
                    </a>
                  )}
                </div>
              ) : (
                <span className="block text-xs text-[#A7AAAD]/80 mt-1">
                  Grand Motors Workshop • Metro Pillar 842, Moosapet, Hyderabad
                </span>
              )}
            </div>

            <div>
              <span className="block text-[11px] font-semibold tracking-[0.1em] text-[#A7AAAD] uppercase mb-1">
                {labels.serviceCategory || 'Service'}
              </span>
              <span className="font-semibold text-[#F2F0EA]">
                {services.find((s) => s.id === submittedData.serviceCategory)?.title ||
                  submittedData.serviceCategory}
              </span>
              {submittedData.specificService && (
                <span className="block text-xs text-[#A7AAAD]/80 mt-0.5">
                  ({submittedData.specificService})
                </span>
              )}
            </div>

            <div>
              <span className="block text-[11px] font-semibold tracking-[0.1em] text-[#A7AAAD] uppercase mb-1">
                Vehicle
              </span>
              <span className="font-semibold text-[#F2F0EA]">
                {submittedData.vehicleMake} {submittedData.vehicleModel} (
                {submittedData.registrationNumber})
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-semibold tracking-[0.1em] text-[#A7AAAD] uppercase mb-1">
                Requested Date & Time
              </span>
              <span className="font-semibold text-[#F2F0EA]">
                {submittedData.preferredDate} at {submittedData.preferredTime}
              </span>
            </div>

            <div className="sm:col-span-2">
              <span className="block text-[11px] font-semibold tracking-[0.1em] text-[#A7AAAD] uppercase mb-1">
                Contact Information
              </span>
              <span className="font-semibold text-[#F2F0EA]">{submittedData.phoneNumber}</span>
              {submittedData.email && (
                <span className="block text-xs text-[#A7AAAD]/80 mt-0.5">{submittedData.email}</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <a
            href="/my-bookings"
            className="inline-flex items-center justify-center px-6 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase text-[#0A0C0D] bg-[#B88952] hover:bg-[#caa066] rounded-lg transition-colors text-center font-bold"
          >
            Go to My Bookings
          </a>

          <button
            type="button"
            onClick={() => {
              setSubmittedData(null);
              setServerError(null);
            }}
            className="inline-flex items-center justify-center px-6 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase text-[#F2F0EA] bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-center cursor-pointer"
          >
            + Book Another Service
          </button>

          <a
            href="tel:+918623948898"
            className="inline-flex items-center justify-center px-6 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase text-[#F2F0EA] bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-center"
          >
            Call Grand Motors
          </a>

          <a
            href="https://wa.me/918623948898"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase text-[#F2F0EA] bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-center"
          >
            WhatsApp Grand Motors
          </a>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-[#111315] border border-white/8 rounded-2xl p-6 sm:p-10 md:p-12 space-y-10"
    >
      {/* Server Error Notification Banner */}
      {serverError && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 flex items-start gap-3.5 shadow-lg animate-fade-in">
          <div className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
            ✕
          </div>
          <div className="space-y-1 text-xs sm:text-sm">
            <p className="font-semibold text-red-100">Booking Submission Unsuccessful</p>
            <p className="text-red-200/90 leading-relaxed">{serverError}</p>
            <p className="text-[11px] text-red-300/70 pt-1">
              Your details are preserved below. Please correct any issues and click{' '}
              <strong>Request Service</strong> to retry.
            </p>
          </div>
        </div>
      )}

      {/* 1. Customer Details */}
      <div>
        <div className="flex items-center gap-2.5 mb-6">
          <span className="w-5 h-px bg-[#B88952]"></span>
          <h3 className="text-xs font-semibold tracking-[0.25em] text-[#B88952] uppercase">
            01. Customer Information
          </h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Full Name */}
          <div>
            <label
              htmlFor={fullNameId}
              className="block text-xs font-semibold tracking-[0.1em] text-[#F2F0EA] uppercase mb-2"
            >
              {labels.fullName || 'Full Name'} <span className="text-[#B88952]">*</span>
            </label>
            <input
              id={fullNameId}
              type="text"
              value={formState.fullName}
              onChange={(e) => {
                setFormState({ ...formState, fullName: e.target.value });
                clearError('fullName');
              }}
              placeholder="e.g. Rahul Sharma"
              className={`w-full bg-[#0A0C0D] border ${
                errors.fullName ? 'border-red-500/80' : 'border-white/10 focus:border-[#B88952]'
              } rounded-lg px-4 py-3 text-sm text-[#F2F0EA] placeholder-[#A7AAAD]/40 focus:outline-none transition-colors`}
            />
            {errors.fullName && <p className="mt-1.5 text-xs text-red-400">{errors.fullName}</p>}
          </div>

          {/* Phone Number */}
          <div>
            <label
              htmlFor={phoneNumberId}
              className="block text-xs font-semibold tracking-[0.1em] text-[#F2F0EA] uppercase mb-2"
            >
              {labels.phoneNumber || 'Phone Number'} <span className="text-[#B88952]">*</span>
            </label>
            <input
              id={phoneNumberId}
              type="tel"
              value={formState.phoneNumber}
              onChange={(e) => {
                setFormState({ ...formState, phoneNumber: e.target.value });
                clearError('phoneNumber');
              }}
              placeholder="+91 98765 43210"
              className={`w-full bg-[#0A0C0D] border ${
                errors.phoneNumber ? 'border-red-500/80' : 'border-white/10 focus:border-[#B88952]'
              } rounded-lg px-4 py-3 text-sm text-[#F2F0EA] placeholder-[#A7AAAD]/40 focus:outline-none transition-colors`}
            />
            {errors.phoneNumber && <p className="mt-1.5 text-xs text-red-400">{errors.phoneNumber}</p>}
          </div>

          {/* Email Address (Optional) */}
          {optionalVis.email !== false && (
            <div className="md:col-span-2">
              <label
                htmlFor={emailId}
                className="block text-xs font-semibold tracking-[0.1em] text-[#F2F0EA] uppercase mb-2"
              >
                {labels.email || 'Email Address'}{' '}
                <span className="text-xs text-[#A7AAAD]/60 font-normal lowercase">(optional)</span>
              </label>
              <input
                id={emailId}
                type="email"
                value={formState.email}
                onChange={(e) => {
                  setFormState({ ...formState, email: e.target.value });
                  clearError('email');
                }}
                placeholder="rahul@example.com"
                className={`w-full bg-[#0A0C0D] border ${
                  errors.email ? 'border-red-500/80' : 'border-white/10 focus:border-[#B88952]'
                } rounded-lg px-4 py-3 text-sm text-[#F2F0EA] placeholder-[#A7AAAD]/40 focus:outline-none transition-colors`}
              />
              {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>}
            </div>
          )}
        </div>
      </div>

      {/* 2. Vehicle Details */}
      <div className="pt-6 border-t border-white/5">
        <div className="flex items-center gap-2.5 mb-6">
          <span className="w-5 h-px bg-[#B88952]"></span>
          <h3 className="text-xs font-semibold tracking-[0.25em] text-[#B88952] uppercase">
            02. Vehicle Details
          </h3>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {/* Vehicle Make */}
          <div>
            <label
              htmlFor={vehicleMakeId}
              className="block text-xs font-semibold tracking-[0.1em] text-[#F2F0EA] uppercase mb-2"
            >
              {labels.vehicleMake || 'Make'} <span className="text-[#B88952]">*</span>
            </label>
            <input
              id={vehicleMakeId}
              type="text"
              value={formState.vehicleMake}
              onChange={(e) => {
                setFormState({ ...formState, vehicleMake: e.target.value });
                clearError('vehicleMake');
              }}
              placeholder="e.g. Mercedes-Benz"
              className={`w-full bg-[#0A0C0D] border ${
                errors.vehicleMake ? 'border-red-500/80' : 'border-white/10 focus:border-[#B88952]'
              } rounded-lg px-4 py-3 text-sm text-[#F2F0EA] placeholder-[#A7AAAD]/40 focus:outline-none transition-colors`}
            />
            {errors.vehicleMake && <p className="mt-1.5 text-xs text-red-400">{errors.vehicleMake}</p>}
          </div>

          {/* Vehicle Model */}
          <div>
            <label
              htmlFor={vehicleModelId}
              className="block text-xs font-semibold tracking-[0.1em] text-[#F2F0EA] uppercase mb-2"
            >
              {labels.vehicleModel || 'Model'} <span className="text-[#B88952]">*</span>
            </label>
            <input
              id={vehicleModelId}
              type="text"
              value={formState.vehicleModel}
              onChange={(e) => {
                setFormState({ ...formState, vehicleModel: e.target.value });
                clearError('vehicleModel');
              }}
              placeholder="e.g. C-Class / AMG"
              className={`w-full bg-[#0A0C0D] border ${
                errors.vehicleModel ? 'border-red-500/80' : 'border-white/10 focus:border-[#B88952]'
              } rounded-lg px-4 py-3 text-sm text-[#F2F0EA] placeholder-[#A7AAAD]/40 focus:outline-none transition-colors`}
            />
            {errors.vehicleModel && (
              <p className="mt-1.5 text-xs text-red-400">{errors.vehicleModel}</p>
            )}
          </div>

          {/* Registration Number */}
          <div>
            <label
              htmlFor={registrationNumberId}
              className="block text-xs font-semibold tracking-[0.1em] text-[#F2F0EA] uppercase mb-2"
            >
              {labels.registrationNumber || 'Registration No.'}{' '}
              <span className="text-[#B88952]">*</span>
            </label>
            <input
              id={registrationNumberId}
              type="text"
              value={formState.registrationNumber}
              onChange={(e) => {
                setFormState({ ...formState, registrationNumber: e.target.value });
                clearError('registrationNumber');
              }}
              placeholder="e.g. TS 09 AB 1234"
              className={`w-full bg-[#0A0C0D] border ${
                errors.registrationNumber
                  ? 'border-red-500/80'
                  : 'border-white/10 focus:border-[#B88952]'
              } rounded-lg px-4 py-3 text-sm text-[#F2F0EA] placeholder-[#A7AAAD]/40 focus:outline-none transition-colors`}
            />
            {errors.registrationNumber && (
              <p className="mt-1.5 text-xs text-red-400">{errors.registrationNumber}</p>
            )}
          </div>
        </div>
      </div>

      {/* 3. Service Category & Specific Service */}
      <div className="pt-6 border-t border-white/5">
        <div className="flex items-center gap-2.5 mb-6">
          <span className="w-5 h-px bg-[#B88952]"></span>
          <h3 className="text-xs font-semibold tracking-[0.25em] text-[#B88952] uppercase">
            03. Service Selection
          </h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Category */}
          <div>
            <label
              htmlFor={serviceCategoryId}
              className="block text-xs font-semibold tracking-[0.1em] text-[#F2F0EA] uppercase mb-2"
            >
              {labels.serviceCategory || 'Service'}{' '}
              <span className="text-[#B88952]">*</span>
            </label>
            <select
              id={serviceCategoryId}
              value={formState.serviceCategory}
              onChange={(e) => {
                const categoryId = e.target.value;
                const catObj = services.find((s) => s.id === categoryId);
                setFormState({
                  ...formState,
                  serviceCategory: categoryId,
                  specificService: catObj ? catObj.items[0] || '' : '',
                });
                clearError('serviceCategory');
              }}
              className={`w-full bg-[#0A0C0D] border ${
                errors.serviceCategory
                  ? 'border-red-500/80'
                  : 'border-white/10 focus:border-[#B88952]'
              } rounded-lg px-4 py-3 text-sm text-[#F2F0EA] focus:outline-none transition-colors cursor-pointer`}
            >
              <option value="" disabled>
                Select a service
              </option>
              {services.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-[#111315] text-[#F2F0EA]">
                  {cat.title}
                </option>
              ))}
            </select>
            {errors.serviceCategory && (
              <p className="mt-1.5 text-xs text-red-400">{errors.serviceCategory}</p>
            )}
          </div>

          {/* Specific Service */}
          {optionalVis.specificService !== false && (
            <div>
              <label
                htmlFor={specificServiceId}
                className="block text-xs font-semibold tracking-[0.1em] text-[#F2F0EA] uppercase mb-2"
              >
                {labels.specificService || 'Specific Service / Work'}{' '}
                <span className="text-xs text-[#A7AAAD]/60 font-normal lowercase">(optional)</span>
              </label>
              <select
                id={specificServiceId}
                value={formState.specificService}
                onChange={(e) => setFormState({ ...formState, specificService: e.target.value })}
                disabled={!formState.serviceCategory}
                className="w-full bg-[#0A0C0D] border border-white/10 focus:border-[#B88952] disabled:opacity-50 rounded-lg px-4 py-3 text-sm text-[#F2F0EA] focus:outline-none transition-colors cursor-pointer"
              >
                {!formState.serviceCategory ? (
                  <option value="">Select a service first</option>
                ) : (
                  <>
                    <option value="">General Inspection / Other</option>
                    {specificServiceOptions.map((item, idx) => (
                      <option key={idx} value={item} className="bg-[#111315] text-[#F2F0EA]">
                        {item}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 4. Service Location */}
      <div className="pt-6 border-t border-white/5">
        <div className="flex items-center gap-2.5 mb-6">
          <span className="w-5 h-px bg-[#B88952]"></span>
          <h3 className="text-xs font-semibold tracking-[0.25em] text-[#B88952] uppercase">
            04. Service Location
          </h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          {/* Option: Workshop Visit */}
          <button
            type="button"
            onClick={() => {
              setFormState({ ...formState, serviceLocation: 'Workshop Visit' });
              clearError('doorstepHouseFlat');
              clearError('doorstepStreetLocality');
              clearError('doorstepCity');
              clearError('doorstepPincode');
            }}
            className={`p-5 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
              formState.serviceLocation === 'Workshop Visit'
                ? 'bg-[#141619] border-[#B88952] ring-1 ring-[#B88952]/40 shadow-lg shadow-[#B88952]/5'
                : 'bg-[#0A0C0D] border-white/10 hover:border-white/20 hover:bg-[#111315]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    formState.serviceLocation === 'Workshop Visit' ? 'bg-[#B88952]/20 text-[#B88952]' : 'bg-white/5 text-[#A7AAAD]'
                  }`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold tracking-tight text-[#F2F0EA]">
                    Workshop Visit
                  </span>
                </div>
                <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  formState.serviceLocation === 'Workshop Visit'
                    ? 'border-[#B88952] bg-[#B88952]'
                    : 'border-white/30 bg-transparent'
                }`}>
                  {formState.serviceLocation === 'Workshop Visit' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0A0C0D]" />
                  )}
                </span>
              </div>
              <p className="text-xs text-[#A7AAAD] leading-relaxed">
                Visit our state-of-the-art diagnostic bays, precision lifts, and executive lounge at Moosapet, Hyderabad.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-[#A7AAAD]/80 font-mono">
              <span>Metro Pillar 842, Moosapet</span>
              <span className="text-[#B88952] font-sans font-semibold">Center Bay</span>
            </div>
          </button>

          {/* Option: Doorstep Service */}
          <button
            type="button"
            onClick={() => setFormState({ ...formState, serviceLocation: 'Doorstep Service' })}
            className={`p-5 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
              formState.serviceLocation === 'Doorstep Service'
                ? 'bg-[#141619] border-[#B88952] ring-1 ring-[#B88952]/40 shadow-lg shadow-[#B88952]/5'
                : 'bg-[#0A0C0D] border-white/10 hover:border-white/20 hover:bg-[#111315]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    formState.serviceLocation === 'Doorstep Service' ? 'bg-[#B88952]/20 text-[#B88952]' : 'bg-white/5 text-[#A7AAAD]'
                  }`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold tracking-tight text-[#F2F0EA]">
                    Doorstep Service
                  </span>
                </div>
                <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  formState.serviceLocation === 'Doorstep Service'
                    ? 'border-[#B88952] bg-[#B88952]'
                    : 'border-white/30 bg-transparent'
                }`}>
                  {formState.serviceLocation === 'Doorstep Service' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0A0C0D]" />
                  )}
                </span>
              </div>
              <p className="text-xs text-[#A7AAAD] leading-relaxed">
                Certified technicians arrive at your home, apartment or workplace with mobile servicing equipment & tools.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-[#A7AAAD]/80 font-mono">
              <span>At Your Home / Office</span>
              <span className="text-[#B88952] font-sans font-semibold">Mobile Unit</span>
            </div>
          </button>
        </div>

        {/* Doorstep Service Address Section */}
        {formState.serviceLocation === 'Doorstep Service' && (
          <div className="p-6 rounded-xl bg-[#0A0C0D] border border-[#B88952]/30 space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
              <div>
                <h4 className="text-sm font-bold text-[#F2F0EA] uppercase tracking-wide">
                  Doorstep Service Address
                </h4>
                <p className="text-xs text-[#A7AAAD] mt-0.5">
                  Provide your address or share GPS location for precise navigation.
                </p>
              </div>

              {/* Share Location Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShareLocation}
                  disabled={isLocating}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold tracking-[0.14em] uppercase text-[#0A0C0D] bg-[#B88952] hover:bg-[#caa066] active:bg-[#a67943] disabled:opacity-50 rounded-lg transition-all shadow-md shadow-[#B88952]/10 cursor-pointer shrink-0 font-bold"
                >
                  {isLocating ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      <span>Detecting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Share Current Location</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Geolocation Feedback / Coordinates Display */}
            {locationFeedback && (
              <div className={`p-3.5 rounded-lg text-xs leading-relaxed flex items-start justify-between gap-3 ${
                locationFeedback.type === 'success'
                  ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-200'
                  : locationFeedback.type === 'error'
                  ? 'bg-red-950/40 border border-red-500/30 text-red-200'
                  : 'bg-amber-950/30 border border-amber-500/30 text-amber-200'
              }`}>
                <div className="flex items-start gap-2.5">
                  <span className="font-bold text-sm shrink-0 mt-[-1px]">
                    {locationFeedback.type === 'success' ? '✓' : 'ℹ'}
                  </span>
                  <span>{locationFeedback.message}</span>
                </div>
                {formState.doorstepLatitude && formState.doorstepLongitude && (
                  <button
                    type="button"
                    onClick={handleClearLocation}
                    className="text-[10px] uppercase font-bold tracking-wider underline hover:text-white shrink-0 cursor-pointer ml-2"
                  >
                    Clear GPS
                  </button>
                )}
              </div>
            )}

            {/* GPS Captured Badge & Map Preview Link */}
            {formState.doorstepLatitude !== null && formState.doorstepLongitude !== null && (
              <div className="p-3.5 rounded-lg bg-black/40 border border-[#B88952]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#B88952] animate-pulse" />
                  <span className="text-[#F2F0EA] font-mono">
                    GPS Coordinates: {formState.doorstepLatitude}, {formState.doorstepLongitude}
                  </span>
                </div>
                {formState.doorstepMapUrl && (
                  <a
                    href={formState.doorstepMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B88952] hover:text-[#caa066] transition-colors"
                  >
                    <span>Preview on Google Maps</span>
                    <span className="text-xs">&rarr;</span>
                  </a>
                )}
              </div>
            )}

            {/* Address Input Grid */}
            <div className="grid gap-6 sm:grid-cols-2">
              {/* House / Flat / Building No. */}
              <div>
                <label
                  htmlFor={doorstepHouseFlatId}
                  className="block text-xs font-semibold tracking-[0.1em] text-[#F2F0EA] uppercase mb-2"
                >
                  House / Flat / Building No. <span className="text-[#B88952]">*</span>
                </label>
                <input
                  id={doorstepHouseFlatId}
                  type="text"
                  value={formState.doorstepHouseFlat || ''}
                  onChange={(e) => {
                    setFormState({ ...formState, doorstepHouseFlat: e.target.value });
                    clearError('doorstepHouseFlat');
                  }}
                  placeholder="e.g. Villa 14, Lotus Palms / Flat 402"
                  className={`w-full bg-[#111315] border ${
                    errors.doorstepHouseFlat ? 'border-red-500/80' : 'border-white/10 focus:border-[#B88952]'
                  } rounded-lg px-4 py-3 text-sm text-[#F2F0EA] placeholder-[#A7AAAD]/40 focus:outline-none transition-colors`}
                />
                {errors.doorstepHouseFlat && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.doorstepHouseFlat}</p>
                )}
              </div>

              {/* Street / Locality / Landmark */}
              <div>
                <label
                  htmlFor={doorstepStreetLocalityId}
                  className="block text-xs font-semibold tracking-[0.1em] text-[#F2F0EA] uppercase mb-2"
                >
                  Street / Area / Landmark <span className="text-[#B88952]">*</span>
                </label>
                <input
                  id={doorstepStreetLocalityId}
                  type="text"
                  value={formState.doorstepStreetLocality || ''}
                  onChange={(e) => {
                    setFormState({ ...formState, doorstepStreetLocality: e.target.value });
                    clearError('doorstepStreetLocality');
                  }}
                  placeholder="e.g. Road No. 36, Jubilee Hills"
                  className={`w-full bg-[#111315] border ${
                    errors.doorstepStreetLocality ? 'border-red-500/80' : 'border-white/10 focus:border-[#B88952]'
                  } rounded-lg px-4 py-3 text-sm text-[#F2F0EA] placeholder-[#A7AAAD]/40 focus:outline-none transition-colors`}
                />
                {errors.doorstepStreetLocality && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.doorstepStreetLocality}</p>
                )}
              </div>

              {/* City */}
              <div>
                <label
                  htmlFor={doorstepCityId}
                  className="block text-xs font-semibold tracking-[0.1em] text-[#F2F0EA] uppercase mb-2"
                >
                  City <span className="text-[#B88952]">*</span>
                </label>
                <input
                  id={doorstepCityId}
                  type="text"
                  value={formState.doorstepCity || ''}
                  onChange={(e) => {
                    setFormState({ ...formState, doorstepCity: e.target.value });
                    clearError('doorstepCity');
                  }}
                  placeholder="e.g. Hyderabad"
                  className={`w-full bg-[#111315] border ${
                    errors.doorstepCity ? 'border-red-500/80' : 'border-white/10 focus:border-[#B88952]'
                  } rounded-lg px-4 py-3 text-sm text-[#F2F0EA] placeholder-[#A7AAAD]/40 focus:outline-none transition-colors`}
                />
                {errors.doorstepCity && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.doorstepCity}</p>
                )}
              </div>

              {/* PIN Code */}
              <div>
                <label
                  htmlFor={doorstepPincodeId}
                  className="block text-xs font-semibold tracking-[0.1em] text-[#F2F0EA] uppercase mb-2"
                >
                  6-Digit PIN Code <span className="text-[#B88952]">*</span>
                </label>
                <input
                  id={doorstepPincodeId}
                  type="text"
                  maxLength={6}
                  value={formState.doorstepPincode || ''}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setFormState({ ...formState, doorstepPincode: cleaned });
                    clearError('doorstepPincode');
                  }}
                  placeholder="e.g. 500033"
                  className={`w-full bg-[#111315] border font-mono ${
                    errors.doorstepPincode ? 'border-red-500/80' : 'border-white/10 focus:border-[#B88952]'
                  } rounded-lg px-4 py-3 text-sm text-[#F2F0EA] placeholder-[#A7AAAD]/40 focus:outline-none transition-colors`}
                />
                {errors.doorstepPincode && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.doorstepPincode}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Preferred Schedule */}
      <div className="pt-6 border-t border-white/5">
        <div className="flex items-center gap-2.5 mb-6">
          <span className="w-5 h-px bg-[#B88952]"></span>
          <h3 className="text-xs font-semibold tracking-[0.25em] text-[#B88952] uppercase">
            05. Preferred Date & Time
          </h3>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Preferred Date */}
          <div>
            <label
              htmlFor={preferredDateId}
              className="block text-xs font-semibold tracking-[0.1em] text-[#F2F0EA] uppercase mb-2"
            >
              {labels.preferredDate || 'Preferred Date'} <span className="text-[#B88952]">*</span>
            </label>
            <input
              id={preferredDateId}
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={formState.preferredDate}
              onChange={(e) => {
                setFormState({ ...formState, preferredDate: e.target.value });
                clearError('preferredDate');
              }}
              className={`w-full bg-[#0A0C0D] border ${
                errors.preferredDate ? 'border-red-500/80' : 'border-white/10 focus:border-[#B88952]'
              } rounded-lg px-4 py-3 text-sm text-[#F2F0EA] focus:outline-none transition-colors [color-scheme:dark]`}
            />
            {errors.preferredDate && (
              <p className="mt-1.5 text-xs text-red-400">{errors.preferredDate}</p>
            )}
          </div>

          {/* Preferred Time Slot */}
          <div>
            <label
              htmlFor={preferredTimeId}
              className="block text-xs font-semibold tracking-[0.1em] text-[#F2F0EA] uppercase mb-2"
            >
              {labels.preferredTime || 'Preferred Time Slot'}{' '}
              <span className="text-[#B88952]">*</span>
            </label>
            <select
              id={preferredTimeId}
              value={formState.preferredTime}
              onChange={(e) => {
                setFormState({ ...formState, preferredTime: e.target.value });
                clearError('preferredTime');
              }}
              className={`w-full bg-[#0A0C0D] border ${
                errors.preferredTime ? 'border-red-500/80' : 'border-white/10 focus:border-[#B88952]'
              } rounded-lg px-4 py-3 text-sm text-[#F2F0EA] focus:outline-none transition-colors cursor-pointer`}
            >
              <option value="" disabled>
                Select a time window
              </option>
              {appointmentSlots.map((slot) => (
                <option key={slot} value={slot} className="bg-[#111315]">
                  {slot}
                </option>
              ))}
            </select>
            {errors.preferredTime && (
              <p className="mt-1.5 text-xs text-red-400">{errors.preferredTime}</p>
            )}
          </div>
        </div>
      </div>

      {/* 6. Custom Questions (if any) */}
      {customQuestions.length > 0 && (
        <div className="pt-6 border-t border-white/5 space-y-4">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="w-5 h-px bg-[#B88952]"></span>
            <h3 className="text-xs font-semibold tracking-[0.25em] text-[#B88952] uppercase">
              06. Additional Questions
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {customQuestions.map((q) => (
              <div key={q.id}>
                <label className="block text-xs font-semibold tracking-[0.1em] text-[#F2F0EA] uppercase mb-2">
                  {q.label}
                </label>
                <input
                  type="text"
                  value={formState.customAnswers?.[q.label] || ''}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      customAnswers: {
                        ...(formState.customAnswers || {}),
                        [q.label]: e.target.value,
                      },
                    })
                  }
                  placeholder="Your answer..."
                  className="w-full bg-[#0A0C0D] border border-white/10 focus:border-[#B88952] rounded-lg px-4 py-3 text-sm text-[#F2F0EA] placeholder-[#A7AAAD]/40 focus:outline-none transition-colors"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Additional Message (Optional) */}
      {optionalVis.additionalMessage !== false && (
        <div className="pt-6 border-t border-white/5">
          <label
            htmlFor={additionalMessageId}
            className="block text-xs font-semibold tracking-[0.1em] text-[#F2F0EA] uppercase mb-2"
          >
            {labels.additionalMessage || 'Additional Notes / Special Instructions'}{' '}
            <span className="text-xs text-[#A7AAAD]/60 font-normal lowercase">(optional)</span>
          </label>
          <textarea
            id={additionalMessageId}
            rows={3}
            value={formState.additionalMessage}
            onChange={(e) => setFormState({ ...formState, additionalMessage: e.target.value })}
            placeholder="Mention any specific issues, noise symptoms, or custom requirements..."
            className="w-full bg-[#0A0C0D] border border-white/10 focus:border-[#B88952] rounded-lg px-4 py-3 text-sm text-[#F2F0EA] placeholder-[#A7AAAD]/40 focus:outline-none transition-colors resize-none"
          />
        </div>
      )}

      {/* Submit Controls & Alternate Contact */}
      <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6">
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-xs font-semibold tracking-[0.2em] uppercase text-[#0A0C0D] bg-[#B88952] hover:bg-[#caa066] active:bg-[#a67943] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all shadow-lg shadow-[#B88952]/10 cursor-pointer"
          >
            {isSubmitting ? 'Processing Request...' : 'Request Service'}
          </button>
        </div>

        <div className="text-xs text-[#A7AAAD] text-center sm:text-right space-y-1">
          <p>Need urgent assistance?</p>
          <div className="flex items-center justify-center sm:justify-end gap-3 font-medium">
            <a
              href="tel:+918623948898"
              className="text-[#F2F0EA] hover:text-[#B88952] transition-colors"
            >
              Call +91 86239 48898
            </a>
            <span className="text-white/20">•</span>
            <a
              href="https://wa.me/918623948898"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#F2F0EA] hover:text-[#B88952] transition-colors"
            >
              WhatsApp Us
            </a>
          </div>
        </div>
      </div>
    </form>
  );
};
