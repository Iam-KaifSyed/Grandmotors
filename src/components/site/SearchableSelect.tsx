import { useState, useRef, useEffect, useId } from 'react';
import { OTHER_OPTION } from '../../lib/carBrandsData';

export interface SearchableSelectProps {
  id?: string;
  label: string;
  required?: boolean;
  value: string; // The selected option in dropdown (e.g., 'Mercedes-Benz' or 'Other')
  options: string[]; // Options list
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  disabledTooltip?: string;
  error?: string;
  onChange: (value: string) => void;
  aliases?: Record<string, string[]>;

  // Manual entry props for "Other"
  manualValue?: string;
  onManualValueChange?: (val: string) => void;
  manualLabel?: string;
  manualPlaceholder?: string;
  manualError?: string;
}

export function SearchableSelect({
  id: propId,
  label,
  required = false,
  value,
  options,
  placeholder = 'Select option...',
  searchPlaceholder = 'Type to search...',
  disabled = false,
  disabledTooltip,
  error,
  onChange,
  aliases,
  manualValue = '',
  onManualValueChange,
  manualLabel = 'Specify other',
  manualPlaceholder = 'Type custom name...',
  manualError,
}: SearchableSelectProps) {
  const generatedId = useId();
  const baseId = propId || generatedId;
  const manualInputId = `${baseId}-manual`;

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isOtherSelected = value === OTHER_OPTION;

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Keyboard accessibility: Escape to close
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const filteredOptions = options.filter((opt) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    if (opt.toLowerCase().includes(q)) return true;
    const optAliases = aliases?.[opt];
    if (optAliases && optAliases.some((alias) => alias.toLowerCase().includes(q) || q.includes(alias.toLowerCase()))) {
      return true;
    }
    return false;
  });

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    if (onManualValueChange) {
      onManualValueChange('');
    }
  };

  // Determine button display text
  const displayLabel = (() => {
    if (!value) return null;
    if (value === OTHER_OPTION) {
      return manualValue.trim() ? `Other (${manualValue.trim()})` : 'Other (Specify below)';
    }
    return value;
  })();

  return (
    <div className="space-y-2" ref={containerRef} onKeyDown={handleKeyDown}>
      {/* Field Label */}
      <div className="flex items-center justify-between">
        <label
          htmlFor={baseId}
          className="block text-xs font-semibold tracking-[0.1em] text-[var(--gm-text-primary)] uppercase"
        >
          {label} {required && <span className="text-[var(--gm-accent-primary)]">*</span>}
        </label>
        {disabled && disabledTooltip && (
          <span className="text-[10px] text-[var(--gm-text-muted)] tracking-wider">
            {disabledTooltip}
          </span>
        )}
      </div>

      {/* Dropdown Trigger Box */}
      <div className="relative">
        <button
          id={baseId}
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={`w-full bg-[var(--gm-bg-input)] border ${
            error
              ? 'border-red-500/80 ring-1 ring-red-500/30'
              : isOpen
              ? 'border-[var(--gm-accent-primary)] ring-1 ring-[var(--gm-accent-border)]'
              : 'border-[var(--gm-border-medium)] hover:border-[var(--gm-border-strong)]'
          } rounded-lg px-4 py-3 text-left text-base sm:text-sm transition-all flex items-center justify-between gap-3 ${
            disabled ? 'opacity-40 cursor-not-allowed bg-black/40' : 'cursor-pointer'
          }`}
        >
          <span
            className={`truncate ${
              displayLabel ? 'text-[var(--gm-text-primary)] font-medium' : 'text-[var(--gm-text-muted)]'
            }`}
          >
            {displayLabel || placeholder}
          </span>

          <div className="flex items-center gap-1.5 shrink-0 text-[var(--gm-text-secondary)]">
            {value && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onChange('');
                  }
                }}
                className="w-5 h-5 rounded-full hover:bg-[var(--gm-bg-card-hover)] flex items-center justify-center text-xs text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)] transition-colors cursor-pointer"
                title="Clear selection"
              >
                ✕
              </span>
            )}
            <svg
              className={`w-4 h-4 transition-transform duration-200 text-[var(--gm-accent-primary)] ${
                isOpen ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Dropdown Menu Popover */}
        {isOpen && !disabled && (
          <div className="absolute z-50 mt-1.5 w-full bg-[var(--gm-bg-modal)] border border-[var(--gm-border-medium)] rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden animate-fade-in">
            {/* Search Input Bar */}
            <div className="p-2.5 border-b border-[var(--gm-border-subtle)] bg-[var(--gm-bg-surface)]">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--gm-accent-primary)]">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" strokeWidth={2} />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth={2} strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-[var(--gm-bg-input)] border border-[var(--gm-border-subtle)] rounded-lg pl-8 pr-8 py-2 text-xs sm:text-sm text-[var(--gm-text-primary)] placeholder-[var(--gm-text-muted)] focus:border-[var(--gm-accent-primary)] focus:outline-none transition-colors"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-[var(--gm-text-muted)] hover:text-[var(--gm-text-primary)] cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Options List */}
            <ul
              role="listbox"
              className="max-h-56 sm:max-h-64 overflow-y-auto py-1.5 divide-y divide-[var(--gm-border-subtle)] scrollbar-thin scrollbar-thumb-[var(--gm-border-strong)] scrollbar-track-transparent text-xs sm:text-sm"
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => {
                  const isSelected = value === option;
                  const isOther = option === OTHER_OPTION;

                  return (
                    <li
                      key={option}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(option)}
                      className={`px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[var(--gm-accent-muted)] text-[var(--gm-accent-primary)] font-semibold'
                          : isOther
                          ? 'hover:bg-[var(--gm-bg-card-hover)] text-[var(--gm-text-primary)] font-medium'
                          : 'hover:bg-[var(--gm-bg-card-hover)] text-[var(--gm-text-primary)]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isOther && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--gm-accent-primary)] shrink-0" />
                        )}
                        <span>{isOther ? `${OTHER_OPTION} (Not in list)` : option}</span>
                      </div>
                      {isSelected && (
                        <span className="text-xs text-[var(--gm-accent-primary)] font-bold">✓</span>
                      )}
                    </li>
                  );
                })
              ) : (
                <div className="p-4 text-center space-y-2.5">
                  <p className="text-xs text-[var(--gm-text-secondary)]">
                    No matches found for <span className="text-[var(--gm-text-primary)]">"{searchTerm}"</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (onManualValueChange && searchTerm.trim()) {
                        onManualValueChange(searchTerm.trim());
                      }
                      handleSelect(OTHER_OPTION);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--gm-accent-foreground)] bg-[var(--gm-accent-primary)] hover:bg-[var(--gm-accent-hover)] rounded-md transition-colors cursor-pointer"
                  >
                    <span>Use "{OTHER_OPTION}" & Enter Manually</span>
                  </button>
                </div>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Dropdown Validation Error */}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}

      {/* Manual Entry Input Field when "Other" is chosen */}
      {isOtherSelected && (
        <div className="pt-2 animate-fade-in">
          <label
            htmlFor={manualInputId}
            className="block text-[11px] font-semibold tracking-[0.1em] text-[var(--gm-accent-primary)] uppercase mb-1.5"
          >
            {manualLabel} <span className="text-[var(--gm-accent-primary)]">*</span>
          </label>
          <input
            id={manualInputId}
            type="text"
            value={manualValue}
            onChange={(e) => {
              if (onManualValueChange) {
                onManualValueChange(e.target.value);
              }
            }}
            placeholder={manualPlaceholder}
            className={`w-full bg-[var(--gm-bg-input)] border ${
              manualError ? 'border-red-500/80' : 'border-[var(--gm-accent-border)] focus:border-[var(--gm-accent-primary)]'
            } rounded-lg px-4 py-2.5 text-base sm:text-sm text-[var(--gm-text-primary)] placeholder-[var(--gm-text-muted)] focus:outline-none transition-colors`}
          />
          {manualError && <p className="mt-1 text-xs text-red-400">{manualError}</p>}
          <p className="mt-1 text-[11px] text-[var(--gm-text-muted)]">
            Specify the vehicle details manually so our service team can prepare the appropriate parts.
          </p>
        </div>
      )}
    </div>
  );
}
