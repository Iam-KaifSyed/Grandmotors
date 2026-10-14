import { useEffect, useState } from 'react';
import type { BookingFormConfig, CustomQuestion } from '../../lib/bookingFormConfigStore';
import { ESSENTIAL_FIELDS } from '../../lib/bookingFormConfigStore';

export function BookingFormEditor() {
  const [config, setConfig] = useState<BookingFormConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  // New slot and new custom question inputs
  const [newSlot, setNewSlot] = useState('');
  const [newQuestion, setNewQuestion] = useState('');

  const loadConfig = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/cms/booking-form-config', {
        headers: { Accept: 'application/json' },
      });

      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to load booking form config');
      }

      const data = await res.json();
      setConfig(data.config);
    } catch (err: any) {
      setError(err?.message || 'Failed to load configuration');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    setSaveFeedback(null);

    try {
      const res = await fetch('/api/admin/cms/booking-form-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update config');
      }

      setConfig(data.config);
      setSaveFeedback({ ok: true, msg: 'Booking form settings updated successfully.' });
    } catch (err: any) {
      setSaveFeedback({ ok: false, msg: err?.message || 'Failed to save settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  const updateLabel = (field: string, val: string) => {
    if (!config) return;
    setConfig({
      ...config,
      fieldLabels: {
        ...config.fieldLabels,
        [field]: val,
      },
    });
  };

  const toggleOptionalField = (field: string) => {
    if (!config) return;
    setConfig({
      ...config,
      optionalFieldVisibility: {
        ...config.optionalFieldVisibility,
        [field]: !config.optionalFieldVisibility[field],
      },
    });
  };

  const addSlot = () => {
    if (!config || !newSlot.trim()) return;
    if (config.appointmentSlots.includes(newSlot.trim())) return;
    setConfig({
      ...config,
      appointmentSlots: [...config.appointmentSlots, newSlot.trim()],
    });
    setNewSlot('');
  };

  const removeSlot = (slot: string) => {
    if (!config) return;
    setConfig({
      ...config,
      appointmentSlots: config.appointmentSlots.filter((s) => s !== slot),
    });
  };

  const addQuestion = () => {
    if (!config || !newQuestion.trim()) return;
    const q: CustomQuestion = {
      id: `q-${Date.now()}`,
      label: newQuestion.trim(),
      required: false,
    };
    setConfig({
      ...config,
      customQuestions: [...config.customQuestions, q],
    });
    setNewQuestion('');
  };

  const removeQuestion = (id: string) => {
    if (!config) return;
    setConfig({
      ...config,
      customQuestions: config.customQuestions.filter((q) => q.id !== id),
    });
  };

  if (isLoading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--gm-accent-primary)]/20 border-t-[var(--gm-accent-primary)] animate-spin" />
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-sm text-red-600 dark:text-red-300">{error || 'Unable to load configuration.'}</p>
        <button
          type="button"
          onClick={loadConfig}
          className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--gm-accent-foreground)] bg-[var(--gm-accent-primary)] hover:bg-[var(--gm-accent-hover)] rounded-lg cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-4 h-px bg-[var(--gm-accent-primary)]" />
            <span className="text-[10px] font-semibold tracking-[0.25em] text-[var(--gm-accent-primary)] uppercase">
              Form Customizer
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.02em] text-[var(--gm-text-primary)] uppercase">
            Booking Form Settings
          </h1>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-7 py-3 text-xs font-semibold tracking-[0.16em] uppercase text-[var(--gm-accent-foreground)] bg-[var(--gm-accent-primary)] hover:bg-[var(--gm-accent-hover)] disabled:opacity-50 rounded-lg transition-colors cursor-pointer self-start sm:self-auto shadow-lg shadow-[var(--gm-accent-primary)]/10"
        >
          {isSaving ? 'Saving Changes…' : 'Save All Changes'}
        </button>
      </div>

      {saveFeedback && (
        <div
          className={`p-4 rounded-xl border text-xs ${
            saveFeedback.ok
              ? 'bg-[#15803d]/10 border-[#15803d]/30 text-[#15803d] dark:bg-[#25D366]/10 dark:border-[#25D366]/30 dark:text-[#25D366]'
              : 'bg-red-500/10 border-red-500/30 text-red-600 dark:bg-red-950/40 dark:border-red-500/40 dark:text-red-200'
          }`}
        >
          {saveFeedback.msg}
        </div>
      )}

      {/* 1. Form Headings */}
      <div className="rounded-xl border border-[var(--gm-border-subtle)] bg-[var(--gm-bg-card)] p-6 space-y-4 shadow-sm">
        <h2 className="text-sm font-semibold tracking-wider uppercase text-[var(--gm-text-primary)] border-b border-[var(--gm-border-subtle)] pb-3">
          1. Headings & Presentation
        </h2>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-[var(--gm-text-secondary)] uppercase tracking-wider mb-1">
              Page / Section Heading
            </label>
            <input
              type="text"
              value={config.heading}
              onChange={(e) => setConfig({ ...config, heading: e.target.value })}
              className="w-full bg-[var(--gm-bg-surface)] border border-[var(--gm-border-medium)] rounded-lg px-3 py-2.5 text-sm text-[var(--gm-text-primary)] focus:border-[var(--gm-accent-primary)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[var(--gm-text-secondary)] uppercase tracking-wider mb-1">
              Supporting Subtext
            </label>
            <textarea
              rows={2}
              value={config.supportingText}
              onChange={(e) => setConfig({ ...config, supportingText: e.target.value })}
              className="w-full bg-[var(--gm-bg-surface)] border border-[var(--gm-border-medium)] rounded-lg px-3 py-2 text-xs text-[var(--gm-text-primary)] focus:border-[var(--gm-accent-primary)] focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-[var(--gm-text-secondary)] uppercase tracking-wider mb-1">
              Submission Confirmation Message
            </label>
            <textarea
              rows={2}
              value={config.confirmationMessage}
              onChange={(e) => setConfig({ ...config, confirmationMessage: e.target.value })}
              className="w-full bg-[var(--gm-bg-surface)] border border-[var(--gm-border-medium)] rounded-lg px-3 py-2 text-xs text-[var(--gm-text-primary)] focus:border-[var(--gm-accent-primary)] focus:outline-none resize-none"
            />
          </div>
        </div>
      </div>

      {/* 2. Field Customization & Essential Field Protection */}
      <div className="rounded-xl border border-[var(--gm-border-subtle)] bg-[var(--gm-bg-card)] p-6 space-y-4 shadow-sm">
        <div className="border-b border-[var(--gm-border-subtle)] pb-3">
          <h2 className="text-sm font-semibold tracking-wider uppercase text-[var(--gm-text-primary)]">
            2. Field Labels & Optional Fields
          </h2>
          <p className="text-[11px] text-[var(--gm-text-secondary)] mt-1">
            Essential booking fields (marked with 🔒) are protected and permanently required for
            workshop operations and booking tracking.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-xs">
          {Object.entries(config.fieldLabels).map(([fieldKey, label]) => {
            const isEssential = (ESSENTIAL_FIELDS as readonly string[]).includes(fieldKey);
            const isOptional = !isEssential;
            const isVisible = isOptional ? config.optionalFieldVisibility[fieldKey] ?? true : true;

            return (
              <div key={fieldKey} className="p-3 bg-[var(--gm-bg-surface)] border border-[var(--gm-border-subtle)] rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[var(--gm-text-secondary)] uppercase">
                    {fieldKey} {isEssential ? '🔒 (Essential)' : '(Optional)'}
                  </span>
                  {isOptional && (
                    <button
                      type="button"
                      onClick={() => toggleOptionalField(fieldKey)}
                      className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded cursor-pointer ${
                        isVisible
                          ? 'bg-[#15803d]/10 text-[#15803d] border border-[#15803d]/30 dark:bg-[#25D366]/10 dark:text-[#25D366] dark:border-[#25D366]/30'
                          : 'bg-black/5 dark:bg-white/5 text-[var(--gm-text-secondary)] border border-[var(--gm-border-subtle)]'
                      }`}
                    >
                      {isVisible ? 'Shown' : 'Hidden'}
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={label}
                  onChange={(e) => updateLabel(fieldKey, e.target.value)}
                  placeholder={`Label for ${fieldKey}`}
                  className="w-full bg-[var(--gm-bg-card)] border border-[var(--gm-border-medium)] rounded px-2.5 py-1.5 text-xs text-[var(--gm-text-primary)] focus:border-[var(--gm-accent-primary)] focus:outline-none"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Appointment Time Slots */}
      <div className="rounded-xl border border-[var(--gm-border-subtle)] bg-[var(--gm-bg-card)] p-6 space-y-4 shadow-sm">
        <h2 className="text-sm font-semibold tracking-wider uppercase text-[var(--gm-text-primary)] border-b border-[var(--gm-border-subtle)] pb-3">
          3. Available Appointment Time Windows
        </h2>

        <div className="flex gap-3 max-w-md">
          <input
            type="text"
            value={newSlot}
            onChange={(e) => setNewSlot(e.target.value)}
            placeholder="e.g. Early Bird (7:30 AM - 9:00 AM)"
            className="flex-1 bg-[var(--gm-bg-surface)] border border-[var(--gm-border-medium)] rounded-lg px-3 py-2 text-xs text-[var(--gm-text-primary)] focus:border-[var(--gm-accent-primary)] focus:outline-none placeholder:text-[var(--gm-text-muted)]"
          />
          <button
            type="button"
            onClick={addSlot}
            disabled={!newSlot.trim()}
            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--gm-accent-foreground)] bg-[var(--gm-accent-primary)] hover:bg-[var(--gm-accent-hover)] disabled:opacity-50 rounded-lg cursor-pointer"
          >
            + Add Slot
          </button>
        </div>

        <div className="space-y-2 pt-2">
          {config.appointmentSlots.map((slot) => (
            <div
              key={slot}
              className="flex items-center justify-between p-3 rounded-lg border border-[var(--gm-border-subtle)] bg-[var(--gm-bg-surface)] text-xs text-[var(--gm-text-primary)]"
            >
              <span>{slot}</span>
              <button
                type="button"
                onClick={() => removeSlot(slot)}
                className="text-red-600 dark:text-[#FF5F5F] hover:text-red-700 dark:hover:text-red-400 text-xs px-2 py-1 cursor-pointer font-medium"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Custom Additional Questions */}
      <div className="rounded-xl border border-[var(--gm-border-subtle)] bg-[var(--gm-bg-card)] p-6 space-y-4 shadow-sm">
        <h2 className="text-sm font-semibold tracking-wider uppercase text-[var(--gm-text-primary)] border-b border-[var(--gm-border-subtle)] pb-3">
          4. Custom Additional Questions
        </h2>

        <div className="flex gap-3 max-w-md">
          <input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="e.g. Do you require door-step pickup?"
            className="flex-1 bg-[var(--gm-bg-surface)] border border-[var(--gm-border-medium)] rounded-lg px-3 py-2 text-xs text-[var(--gm-text-primary)] focus:border-[var(--gm-accent-primary)] focus:outline-none placeholder:text-[var(--gm-text-muted)]"
          />
          <button
            type="button"
            onClick={addQuestion}
            disabled={!newQuestion.trim()}
            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--gm-accent-foreground)] bg-[var(--gm-accent-primary)] hover:bg-[var(--gm-accent-hover)] disabled:opacity-50 rounded-lg cursor-pointer"
          >
            + Add Question
          </button>
        </div>

        {config.customQuestions.length > 0 ? (
          <div className="space-y-2 pt-2">
            {config.customQuestions.map((q) => (
              <div
                key={q.id}
                className="flex items-center justify-between p-3 rounded-lg border border-[var(--gm-border-subtle)] bg-[var(--gm-bg-surface)] text-xs text-[var(--gm-text-primary)]"
              >
                <span>{q.label}</span>
                <button
                  type="button"
                  onClick={() => removeQuestion(q.id)}
                  className="text-red-600 dark:text-[#FF5F5F] hover:text-red-700 dark:hover:text-red-400 text-xs px-2 py-1 cursor-pointer font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--gm-text-muted)] italic">No custom questions added.</p>
        )}
      </div>

      {/* Bottom Save Action */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-8 py-3.5 text-xs font-semibold tracking-[0.16em] uppercase text-[var(--gm-accent-foreground)] bg-[var(--gm-accent-primary)] hover:bg-[var(--gm-accent-hover)] disabled:opacity-50 rounded-lg transition-colors cursor-pointer shadow-lg shadow-[var(--gm-accent-primary)]/10"
        >
          {isSaving ? 'Saving Changes…' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}
