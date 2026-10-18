import { useState, useEffect, useCallback } from 'react';
import type { GalleryItemView } from '../../lib/galleryStore';

interface GalleryLightboxProps {
  items: GalleryItemView[];
  categories: Array<{ id: string; name: string }>;
  initialCategoryId?: string | null;
}

export function GalleryLightbox({ items, categories, initialCategoryId }: GalleryLightboxProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategoryId || 'all');
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  const filteredItems =
    selectedCategory === 'all'
      ? items
      : items.filter((i) => i.categoryId === selectedCategory);

  const activeImage = activeImageIndex !== null ? filteredItems[activeImageIndex] : null;

  const handleNext = useCallback(() => {
    if (activeImageIndex === null || filteredItems.length === 0) return;
    setActiveImageIndex((activeImageIndex + 1) % filteredItems.length);
  }, [activeImageIndex, filteredItems.length]);

  const handlePrev = useCallback(() => {
    if (activeImageIndex === null || filteredItems.length === 0) return;
    setActiveImageIndex((activeImageIndex - 1 + filteredItems.length) % filteredItems.length);
  }, [activeImageIndex, filteredItems.length]);

  const handleClose = useCallback(() => {
    setActiveImageIndex(null);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (activeImageIndex === null) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeImageIndex, handleClose, handleNext, handlePrev]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (activeImageIndex !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeImageIndex]);

  return (
    <div>
      {/* Category Filter Pills */}
      {categories.length > 0 && items.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10 sm:mb-14">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setActiveImageIndex(null);
            }}
            className={`px-5 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[var(--gm-accent-primary)] text-[var(--gm-accent-foreground)] shadow-lg shadow-[var(--gm-accent-primary)]/20'
                : 'bg-[var(--gm-bg-card)] border border-[var(--gm-border-subtle)] text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)] hover:border-[var(--gm-accent-border)]'
            }`}
          >
            All Work ({items.length})
          </button>
          {categories.map((cat) => {
            const count = items.filter((i) => i.categoryId === cat.id).length;
            if (count === 0) return null; // Only show categories with published photos
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setActiveImageIndex(null);
                }}
                className={`px-5 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[var(--gm-accent-primary)] text-[var(--gm-accent-foreground)] shadow-lg shadow-[var(--gm-accent-primary)]/20'
                    : 'bg-[var(--gm-bg-card)] border border-[var(--gm-border-subtle)] text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)] hover:border-[var(--gm-accent-border)]'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Gallery Grid */}
      {items.length === 0 ? (
        <div className="py-20 px-6 text-center rounded-3xl border border-[var(--gm-border-subtle)] bg-[var(--gm-bg-card)] max-w-2xl mx-auto shadow-sm">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[var(--gm-accent-muted)] border border-[var(--gm-accent-border)] flex items-center justify-center text-[var(--gm-accent-primary)]">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-[var(--gm-text-primary)]">
            Workshop Photography In Curation
          </h3>
          <p className="mt-3 text-xs sm:text-sm text-[var(--gm-text-secondary)] leading-relaxed">
            Our technicians are actively servicing luxury and performance vehicles in our Hyderabad workshop. Client-approved photos of engine rebuilds, brake overhauls, and detailing projects will be showcased here once uploaded.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/services"
              className="px-6 py-2.5 rounded-full border border-[var(--gm-border-medium)] text-[var(--gm-text-primary)] font-semibold text-xs tracking-wider uppercase hover:border-[var(--gm-accent-border)] hover:bg-[var(--gm-accent-muted)] transition-colors"
            >
              Explore Services
            </a>
            <a
              href="/book-service"
              className="px-6 py-2.5 rounded-full bg-[var(--gm-accent-primary)] text-[var(--gm-accent-foreground)] font-semibold text-xs tracking-wider uppercase shadow-md shadow-[var(--gm-accent-primary)]/20 hover:bg-[var(--gm-accent-hover)] transition-colors"
            >
              Book Service Bay
            </a>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-[var(--gm-border-subtle)] bg-[var(--gm-bg-card)]">
          <p className="text-sm text-[var(--gm-text-secondary)]">No gallery photos found in this category.</p>
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className="mt-4 px-4 py-2 rounded-lg bg-[var(--gm-accent-muted)] border border-[var(--gm-accent-border)] text-[var(--gm-accent-primary)] text-xs font-semibold tracking-wider uppercase cursor-pointer"
          >
            View All Work ({items.length})
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => setActiveImageIndex(idx)}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--gm-border-subtle)] bg-[var(--gm-bg-card)] cursor-pointer transition-all duration-300 hover:border-[var(--gm-accent-border)] hover:shadow-xl hover:-translate-y-1"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-[var(--gm-bg-surface)]">
                <img
                  src={item.imageUrl}
                  alt={item.imageAlt || item.title || 'Grand Motors completed automotive work'}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--gm-bg-card)] via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                {item.categoryName && (
                  <span className="absolute top-3 left-3 px-3 py-1 text-[10px] font-bold tracking-wider uppercase rounded-full bg-[var(--gm-bg-surface)]/85 border border-[var(--gm-border-subtle)] text-[var(--gm-accent-primary)] backdrop-blur-md shadow-sm">
                    {item.categoryName}
                  </span>
                )}
              </div>

              <div className="p-5 sm:p-6 flex flex-col justify-between flex-1">
                <h3 className="text-base font-semibold tracking-[-0.01em] text-[var(--gm-text-primary)] group-hover:text-[var(--gm-accent-primary)] transition-colors">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="mt-2 text-xs sm:text-[13.5px] leading-relaxed text-[var(--gm-text-secondary)] line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {activeImage && activeImageIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeImage.title}
          onClick={handleClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-10 bg-black/85 dark:bg-[#040404]/95 backdrop-blur-xl animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl w-full bg-[var(--gm-bg-card)] border border-[var(--gm-border-subtle)] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[92vh]"
          >
            {/* Top Close Button */}
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close modal"
              className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-[var(--gm-bg-surface)]/85 border border-[var(--gm-border-subtle)] text-[var(--gm-text-primary)] flex items-center justify-center hover:bg-[var(--gm-bg-card-hover)] transition-colors cursor-pointer shadow-lg"
              title="Close (Esc)"
            >
              ✕
            </button>

            {/* Image Container with Prev / Next Navigation */}
            <div className="relative flex-1 bg-black/60 flex items-center justify-center min-h-[300px] sm:min-h-[420px] p-4 select-none">
              <img
                src={activeImage.imageUrl}
                alt={activeImage.imageAlt || activeImage.title}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg"
              />

              {/* Prev Button */}
              {filteredItems.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  aria-label="Previous image"
                  className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm shadow-md"
                  title="Previous (Left arrow)"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {/* Next Button */}
              {filteredItems.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  aria-label="Next image"
                  className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm shadow-md"
                  title="Next (Right arrow)"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}

              {/* Counter Pill */}
              {filteredItems.length > 1 && (
                <span className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 border border-white/10 text-white/90 text-[11px] font-medium tracking-wider backdrop-blur-sm">
                  {activeImageIndex + 1} / {filteredItems.length}
                </span>
              )}
            </div>

            {/* Details Sidebar */}
            <div className="w-full md:w-88 p-6 sm:p-8 flex flex-col justify-between border-t md:border-t-0 md:border-l border-[var(--gm-border-subtle)] bg-[var(--gm-bg-card)] overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-px bg-[var(--gm-accent-primary)]" />
                  <span className="text-[10px] font-semibold tracking-[0.25em] text-[var(--gm-accent-primary)] uppercase">
                    Workshop Project
                  </span>
                </div>

                {activeImage.categoryName && (
                  <span className="inline-block px-3 py-1 text-[10px] font-bold tracking-wider uppercase rounded-full bg-[var(--gm-accent-muted)] border border-[var(--gm-accent-border)] text-[var(--gm-accent-primary)]">
                    {activeImage.categoryName}
                  </span>
                )}

                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--gm-text-primary)]">
                  {activeImage.title}
                </h2>

                {activeImage.description ? (
                  <p className="text-xs sm:text-sm leading-relaxed text-[var(--gm-text-secondary)]">
                    {activeImage.description}
                  </p>
                ) : (
                  <p className="text-xs text-[var(--gm-text-secondary)]/70 italic">
                    Certified automotive service completed at Grand Motors workshop.
                  </p>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-[var(--gm-border-subtle)] space-y-3">
                <a
                  href="/book-service"
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-[var(--gm-accent-primary)] text-[var(--gm-accent-foreground)] font-semibold text-xs tracking-wider uppercase shadow-lg shadow-[var(--gm-accent-primary)]/20 hover:bg-[var(--gm-accent-hover)] transition-colors cursor-pointer text-center"
                >
                  Book This Service
                </a>
                <a
                  href="/services"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[var(--gm-border-medium)] text-[var(--gm-text-primary)] font-semibold text-xs tracking-wider uppercase hover:bg-[var(--gm-bg-card-hover)] transition-colors cursor-pointer text-center"
                >
                  View All Services
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
