import { useState, useId } from 'react';
import { SERVICES } from './servicesData';
import { saveBooking, type Booking } from '../../lib/bookings';

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
  submittedAt?: string;
  bookingRef?: string;
}

interface BookServiceFormProps {
  onSubmit?: (data: BookingFormData) => void;
}

export const BookServiceForm = ({ onSubmit }: BookServiceFormProps = {}) => {
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
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedData, setSubmittedData] = useState<BookingFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Selected Category's specific items
  const selectedCategoryObj = SERVICES.find((s) => s.id === formState.serviceCategory);
  const specificServiceOptions = selectedCategoryObj ? selectedCategoryObj.items : [];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formState.fullName.trim()) {
      newErrors.fullName = 'Full Name is required';
    }

    if (!formState.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone Number is required';
    } else if (!/^\+?[\d\s-]{8,15}$/.test(formState.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Enter a valid phone number';
    }

    if (formState.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim())) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!formState.vehicleMake.trim()) {
      newErrors.vehicleMake = 'Vehicle Make is required';
    }

    if (!formState.vehicleModel.trim()) {
      newErrors.vehicleModel = 'Vehicle Model is required';
    }

    if (!formState.registrationNumber.trim()) {
      newErrors.registrationNumber = 'Registration Number is required';
    }

    if (!formState.serviceCategory) {
      newErrors.serviceCategory = 'Please select a Service Category';
    }

    if (!formState.preferredDate) {
      newErrors.preferredDate = 'Preferred Date is required';
    }

    if (!formState.preferredTime) {
      newErrors.preferredTime = 'Preferred Time is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (validate()) {
      setIsSubmitting(true);

      // Simulate submission delay
      setTimeout(() => {
        const refNum = `GM-${Math.floor(100000 + Math.random() * 900000)}`;
        const finalData: BookingFormData = {
          ...formState,
          submittedAt: new Date().toISOString(),
          bookingRef: refNum,
        };

        const newBookingRecord: Booking = {
          id: refNum,
          status: 'Pending',
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
          additionalMessage: formState.additionalMessage.trim(),
          createdAt: new Date().toISOString(),
        };

        saveBooking(newBookingRecord);
        setSubmittedData(finalData);
        setIsSubmitting(false);

        if (onSubmit) {
          onSubmit(finalData);
        }
      }, 600);
    }
  };

  const clearError = (field: string) => {
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
        {/* Subtle accent glow */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-[#B88952]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-3 text-[#B88952] mb-6">
          <span className="w-8 h-8 rounded-full border border-[#B88952]/40 bg-[#B88952]/10 flex items-center justify-center font-bold text-sm">
            ✓
          </span>
          <span className="text-xs font-semibold tracking-[0.25em] uppercase">Request Confirmed</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.02em] text-[#F2F0EA] uppercase mb-4">
          Service Request Received
        </h2>
        <p className="text-sm sm:text-base text-[#A7AAAD] leading-relaxed max-w-2xl mb-8">
          Thank you, <span className="text-[#F2F0EA] font-semibold">{submittedData.fullName}</span>. We have received your booking request for your <span className="text-[#F2F0EA] font-semibold">{submittedData.vehicleMake} {submittedData.vehicleModel}</span>. Our team will review the details and contact you shortly to finalize your appointment.
        </p>

        {/* Summary Card */}
        <div className="bg-[#0A0C0D] border border-white/5 rounded-xl p-6 mb-8 space-y-4">
          <div className="flex flex-wrap justify-between items-center pb-4 border-b border-white/5 gap-2">
            <span className="text-xs font-semibold tracking-[0.15em] uppercase text-[#A7AAAD]">
              Booking Reference
            </span>
            <span className="text-base font-mono font-bold text-[#B88952]">
              {submittedData.bookingRef}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <span className="block text-[#A7AAAD] mb-1">Service Category</span>
              <span className="font-semibold text-[#F2F0EA]">
                {SERVICES.find((s) => s.id === submittedData.serviceCategory)?.title || submittedData.serviceCategory}
              </span>
              {submittedData.specificService && (
                <span className="block text-xs text-[#A7AAAD]/80 mt-0.5">
                  ({submittedData.specificService})
                </span>
              )}
            </div>

            <div>
              <span className="block text-[#A7AAAD] mb-1">Vehicle</span>
              <span className="font-semibold text-[#F2F0EA]">
                {submittedData.vehicleMake} {submittedData.vehicleModel} ({submittedData.registrationNumber})
              </span>
            </div>

            <div>
              <span className="block text-[#A7AAAD] mb-1">Requested Date & Time</span>
              <span className="font-semibold text-[#F2F0EA]">
                {submittedData.preferredDate} at {submittedData.preferredTime}
              </span>
            </div>

            <div>
              <span className="block text-[#A7AAAD] mb-1">Contact Info</span>
              <span className="font-semibold text-[#F2F0EA]">
                {submittedData.phoneNumber}
              </span>
              {submittedData.email && (
                <span className="block text-xs text-[#A7AAAD]/80 mt-0.5">
                  {submittedData.email}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Next Steps / Direct Contact Options */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <a
            href="/"
            className="inline-flex items-center justify-center px-6 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase text-[#0A0C0D] bg-[#B88952] hover:bg-[#caa066] rounded-lg transition-colors text-center"
          >
            Back to Home
          </a>

          <a
            href={`/my-bookings?ref=${encodeURIComponent(submittedData.bookingRef || '')}&phone=${encodeURIComponent(submittedData.phoneNumber || '')}`}
            className="inline-flex items-center justify-center px-6 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase text-[#F2F0EA] bg-[#B88952]/10 hover:bg-[#B88952]/20 text-[#B88952] border border-[#B88952]/20 rounded-lg transition-colors text-center"
          >
            View My Bookings
          </a>

          <a
            href="tel:+918623948898"
            className="inline-flex items-center justify-center px-6 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase text-[#F2F0EA] bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-center"
          >
            Call Us Directly
          </a>

          <a
            href="https://wa.me/918623948898"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase text-[#F2F0EA] bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-center"
          >
            WhatsApp Support
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
            <label htmlFor={fullNameId} className="block text-xs font-semibold tracking-[0.1em] text-[#F2F0EA] uppercase mb-2">
              Full Name <span className="text-[#B88952]">*</span>
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
            <label htmlFor={phoneNumberId} className="block text-xs font-semibold tracking-[0.1em] text-[#F2F0EA] uppercase mb-2">
              Phone Number <span className="text-[#B88952]">*</span>
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

          {/* Email Address */}
          <div className="md:col-span-2">
            <label htmlFor={emailId} className="block text-xs font-semibold tracking-[0.1em] text-[#F2F0EA] uppercase mb-2">
              Email Address <span className="text-xs text-[#A7AAAD]/60 font-normal lowercase">(optional)</span>
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
            <label htmlFor={vehicleMakeId} className="block text-xs font-semibold tracking-[0.1em] text-[#F2F0EA] uppercase mb-2">
              Make <span className="text-[#B88952]">*</span>
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
            <label htmlFor={vehicleModelId} className="block text-xs font-semibold tracking-[0.1em] text-[#F2F0EA] uppercase mb-2">
              Model <span className="text-[#B88952]">*</span>
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
            {errors.vehicleModel && <p className="mt-1.5 text-xs text-red-400">{errors.vehicleModel}</p>}
          </div>

          {/* Registration Number */}
          <div>
            <label htmlFor={registrationNumberId} className="block text-xs font-semibold tracking-[0.1em] text-[#F2F0EA] uppercase mb-2">
              Registration No. <span className="text-[#B88952]">*</span>
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
                errors.registrationNumber ? 'border-red-500/80' : 'border-white/10 focus:border-[#B88952]'
              } rounded-lg px-4 py-3 text-sm text-[#F2F0EA] placeholder-[#A7AAAD]/40 focus:outline-none transition-colors`}
            />
            {errors.registrationNumber && <p className="mt-1.5 text-xs text-red-400">{errors.registrationNumber}</p>}
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
            <label htmlFor={serviceCategoryId} className="block text-xs font-semibold tracking-[0.1em] text-[#F2F0EA] uppercase mb-2">
              Service Category <span className="text-[#B88952]">*</span>
            </label>
            <select
              id={serviceCategoryId}
              value={formState.serviceCategory}
              onChange={(e) => {
                const categoryId = e.target.value;
                const catObj = SERVICES.find((s) => s.id === categoryId);
                setFormState({
                  ...formState,
                  serviceCategory: categoryId,
                  specificService: catObj ? catObj.items[0] || '' : '',
                });
                clearError('serviceCategory');
              }}
              className={`w-full bg-[#0A0C0D] border ${
                errors.serviceCategory ? 'border-red-500/80' : 'border-white/10 focus:border-[#B88952]'
              } rounded-lg px-4 py-3 text-sm text-[#F2F0EA] focus:outline-none transition-colors cursor-pointer`}
            >
              <option value="" disabled>Select a service category</option>
              {SERVICES.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-[#111315] text-[#F2F0EA]">
                  {cat.title}
                </option>
              ))}
            </select>
            {errors.serviceCategory && <p className="mt-1.5 text-xs text-red-400">{errors.serviceCategory}</p>}
          </div>

          {/* Specific Service */}
          <div>
            <label htmlFor={specificServiceId} className="block text-xs font-semibold tracking-[0.1em] text-[#F2F0EA] uppercase mb-2">
              Specific Service / Work <span className="text-xs text-[#A7AAAD]/60 font-normal lowercase">(optional)</span>
            </label>
            <select
              id={specificServiceId}
              value={formState.specificService}
              onChange={(e) => setFormState({ ...formState, specificService: e.target.value })}
              disabled={!formState.serviceCategory}
              className="w-full bg-[#0A0C0D] border border-white/10 focus:border-[#B88952] disabled:opacity-50 rounded-lg px-4 py-3 text-sm text-[#F2F0EA] focus:outline-none transition-colors cursor-pointer"
            >
              {!formState.serviceCategory ? (
                <option value="">Select a category first</option>
              ) : (
                <>
                  <option value="">General Category Inspection / Other</option>
                  {specificServiceOptions.map((item, idx) => (
                    <option key={idx} value={item} className="bg-[#111315] text-[#F2F0EA]">
                      {item}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* 4. Preferred Schedule */}
      <div className="pt-6 border-t border-white/5">
        <div className="flex items-center gap-2.5 mb-6">
          <span className="w-5 h-px bg-[#B88952]"></span>
          <h3 className="text-xs font-semibold tracking-[0.25em] text-[#B88952] uppercase">
            04. Preferred Date & Time
          </h3>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Preferred Date */}
          <div>
            <label htmlFor={preferredDateId} className="block text-xs font-semibold tracking-[0.1em] text-[#F2F0EA] uppercase mb-2">
              Preferred Date <span className="text-[#B88952]">*</span>
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
            {errors.preferredDate && <p className="mt-1.5 text-xs text-red-400">{errors.preferredDate}</p>}
          </div>

          {/* Preferred Time Slot */}
          <div>
            <label htmlFor={preferredTimeId} className="block text-xs font-semibold tracking-[0.1em] text-[#F2F0EA] uppercase mb-2">
              Preferred Time Slot <span className="text-[#B88952]">*</span>
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
              <option value="" disabled>Select a time window</option>
              <option value="Morning (9:00 AM - 12:00 PM)" className="bg-[#111315]">Morning (9:00 AM - 12:00 PM)</option>
              <option value="Afternoon (12:00 PM - 3:00 PM)" className="bg-[#111315]">Afternoon (12:00 PM - 3:00 PM)</option>
              <option value="Evening (3:00 PM - 6:00 PM)" className="bg-[#111315]">Evening (3:00 PM - 6:00 PM)</option>
              <option value="Flexible / Any Time" className="bg-[#111315]">Flexible / Any Time</option>
            </select>
            {errors.preferredTime && <p className="mt-1.5 text-xs text-red-400">{errors.preferredTime}</p>}
          </div>
        </div>
      </div>

      {/* 5. Additional Message */}
      <div className="pt-6 border-t border-white/5">
        <label htmlFor={additionalMessageId} className="block text-xs font-semibold tracking-[0.1em] text-[#F2F0EA] uppercase mb-2">
          Additional Notes / Special Instructions <span className="text-xs text-[#A7AAAD]/60 font-normal lowercase">(optional)</span>
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

      {/* Submit Controls & Alternate Contact */}
      <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6">
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-xs font-semibold tracking-[0.2em] uppercase text-[#0A0C0D] bg-[#B88952] hover:bg-[#caa066] active:bg-[#a67943] disabled:opacity-50 rounded-lg transition-all shadow-lg shadow-[#B88952]/10 cursor-pointer"
          >
            {isSubmitting ? 'Processing Request...' : 'Request Service'}
          </button>
        </div>

        <div className="text-xs text-[#A7AAAD] text-center sm:text-right space-y-1">
          <p>Need urgent assistance?</p>
          <div className="flex items-center justify-center sm:justify-end gap-3 font-medium">
            <a href="tel:+918623948898" className="text-[#F2F0EA] hover:text-[#B88952] transition-colors">
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
