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
          className="block text-xs font-semibold tracking-[0.1em] text-[#F2F0EA] uppercase"
        >
          {label} {required && <span className="text-[#B88952]">*</span>}
        </label>
        {disabled && disabledTooltip && (
          <span className="text-[10px] text-[#A7AAAD]/60 tracking-wider">
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
          className={`w-full bg-[#0A0C0D] border ${
            error
              ? 'border-red-500/80 ring-1 ring-red-500/30'
              : isOpen
              ? 'border-[#B88952] ring-1 ring-[#B88952]/40'
              : 'border-white/10 hover:border-white/20'
          } rounded-lg px-4 py-3 text-left text-base sm:text-sm transition-all flex items-center justify-between gap-3 ${
            disabled ? 'opacity-40 cursor-not-allowed bg-black/40' : 'cursor-pointer'
          }`}
        >
          <span
            className={`truncate ${
              displayLabel ? 'text-[#F2F0EA] font-medium' : 'text-[#A7AAAD]/40'
            }`}
          >
            {displayLabel || placeholder}
          </span>

          <div className="flex items-center gap-1.5 shrink-0 text-[#A7AAAD]">
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
                className="w-5 h-5 rounded-full hover:bg-white/10 flex items-center justify-center text-xs text-[#A7AAAD] hover:text-[#F2F0EA] transition-colors cursor-pointer"
                title="Clear selection"
              >
                ✕
              </span>
            )}
            <svg
              className={`w-4 h-4 transition-transform duration-200 text-[#B88952] ${
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
          <div className="absolute z-50 mt-1.5 w-full bg-[#111315] border border-white/15 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden animate-fade-in">
            {/* Search Input Bar */}
            <div className="p-2.5 border-b border-white/10 bg-[#0A0C0D]/80">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#B88952]">
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
                  className="w-full bg-[#16181B] border border-white/10 rounded-lg pl-8 pr-8 py-2 text-xs sm:text-sm text-[#F2F0EA] placeholder-[#A7AAAD]/50 focus:border-[#B88952] focus:outline-none transition-colors"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-[#A7AAAD] hover:text-[#F2F0EA] cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Options List */}
            <ul
              role="listbox"
              className="max-h-56 sm:max-h-64 overflow-y-auto py-1.5 divide-y divide-white/5 scrollbar-thin scrollbar-thumb-white/15 scrollbar-track-transparent text-xs sm:text-sm"
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
                          ? 'bg-[#B88952]/15 text-[#B88952] font-semibold'
                          : isOther
                          ? 'hover:bg-white/10 text-[#eaddc1] bg-white/[0.02]'
                          : 'hover:bg-white/5 text-[#F2F0EA]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isOther && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#B88952] shrink-0" />
                        )}
                        <span>{isOther ? `${OTHER_OPTION} (Not in list)` : option}</span>
                      </div>
                      {isSelected && (
                        <span className="text-xs text-[#B88952] font-bold">✓</span>
                      )}
                    </li>
                  );
                })
              ) : (
                <div className="p-4 text-center space-y-2.5">
                  <p className="text-xs text-[#A7AAAD]">
                    No matches found for <span className="text-[#F2F0EA]">"{searchTerm}"</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (onManualValueChange && searchTerm.trim()) {
                        onManualValueChange(searchTerm.trim());
                      }
                      handleSelect(OTHER_OPTION);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#0A0C0D] bg-[#B88952] hover:bg-[#caa066] rounded-md transition-colors cursor-pointer"
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
            className="block text-[11px] font-semibold tracking-[0.1em] text-[#B88952] uppercase mb-1.5"
          >
            {manualLabel} <span className="text-[#B88952]">*</span>
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
            className={`w-full bg-[#0A0C0D] border ${
              manualError ? 'border-red-500/80' : 'border-[#B88952]/50 focus:border-[#B88952]'
            } rounded-lg px-4 py-2.5 text-base sm:text-sm text-[#F2F0EA] placeholder-[#A7AAAD]/40 focus:outline-none transition-colors`}
          />
          {manualError && <p className="mt-1 text-xs text-red-400">{manualError}</p>}
          <p className="mt-1 text-[11px] text-[#A7AAAD]/60">
            Specify the vehicle details manually so our service team can prepare the appropriate parts.
          </p>
        </div>
      )}
    </div>
  );
}
