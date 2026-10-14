import { useEffect, useState, useRef } from 'react';
import type { ServiceRecord } from '../../lib/serviceStore';
import type { MediaAssetRecord } from '../../lib/mediaStore';

function formatBytes(bytes?: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ServiceManager() {
  const [services, setServices] = useState<ServiceRecord[] | null>(null);
  const [mediaAssets, setMediaAssets] = useState<MediaAssetRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters and Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deactivated' | 'catalogue' | 'booking'>('all');

  // Edit / Create Service Modal
  const [editingService, setEditingService] = useState<Partial<ServiceRecord> | null>(null);
  const [initialServiceState, setInitialServiceState] = useState<string>('');
  const [itemsText, setItemsText] = useState('');
  const [initialItemsText, setInitialItemsText] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Image Upload in Service Editor
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaUploadError, setMediaUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Service Deletion Modal
  const [deletingService, setDeletingService] = useState<ServiceRecord | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteConflictBookingCount, setDeleteConflictBookingCount] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 4000);
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [svcRes, mediaRes] = await Promise.all([
        fetch('/api/admin/cms/services', { headers: { Accept: 'application/json' } }),
        fetch('/api/admin/cms/media', { headers: { Accept: 'application/json' } }),
      ]);

      if (svcRes.status === 401) {
        window.location.href = '/admin/login';
        return;
      }

      if (!svcRes.ok) {
        const d = await svcRes.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to load services');
      }

      const svcData = await svcRes.json();
      setServices(svcData.services || []);

      if (mediaRes.ok) {
        const mediaData = await mediaRes.json();
        setMediaAssets(mediaData.assets || []);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load data');
      setServices(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggle = async (service: ServiceRecord, field: 'active' | 'visibleInCatalogue' | 'selectableInBooking') => {
    const updatedVal = !service[field];
    try {
      const res = await fetch(`/api/admin/cms/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: updatedVal }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Update failed');
      }
      setServices((prev) =>
        (prev || []).map((s) => (s.id === service.id ? { ...s, [field]: updatedVal } : s))
      );
      showToast(`Updated "${service.title}" status.`);
    } catch (err: any) {
      alert(err?.message || 'Failed to update toggle');
    }
  };

  const handleMove = async (filteredIndex: number, direction: 'up' | 'down') => {
    if (!services) return;
    const currentList = filteredServices;
    const targetItem = currentList[filteredIndex];
    if (!targetItem) return;

    // Find actual index in full services list
    const actualIndex = services.findIndex((s) => s.id === targetItem.id);
    const targetActualIndex = direction === 'up' ? actualIndex - 1 : actualIndex + 1;
    if (targetActualIndex < 0 || targetActualIndex >= services.length) return;

    const newList = [...services];
    const [moved] = newList.splice(actualIndex, 1);
    newList.splice(targetActualIndex, 0, moved);

    setServices(newList);

    try {
      const res = await fetch('/api/admin/cms/services/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: newList.map((s) => s.id) }),
      });
      if (!res.ok) {
        throw new Error('Failed to persist order');
      }
      showToast('Service order saved.');
    } catch (err) {
      loadData();
    }
  };

  const isFormDirty = () => {
    if (!editingService) return false;
    const currentJson = JSON.stringify(editingService);
    return currentJson !== initialServiceState || itemsText !== initialItemsText;
  };

  const openEdit = (svc: ServiceRecord) => {
    const svcState = { ...svc, categoryId: null };
    const items = (svc.items || []).join('\n');
    setEditingService(svcState);
    setInitialServiceState(JSON.stringify(svcState));
    setItemsText(items);
    setInitialItemsText(items);
    setSaveError(null);
    setMediaUploadError(null);
  };

  const openNew = () => {
    const newSvc: Partial<ServiceRecord> = {
      title: '',
      summary: '',
      items: [],
      categoryId: null,
      mediaAssetId: null,
      visibleInCatalogue: true,
      selectableInBooking: true,
      active: true,
    };
    setEditingService(newSvc);
    setInitialServiceState(JSON.stringify(newSvc));
    setItemsText('');
    setInitialItemsText('');
    setSaveError(null);
    setMediaUploadError(null);
  };

  const handleCloseModal = () => {
    if (isFormDirty()) {
      const confirmDiscard = window.confirm('You have unsaved changes. Are you sure you want to close and discard them?');
      if (!confirmDiscard) return;
    }
    setEditingService(null);
  };

  const handleSaveService = async () => {
    if (!editingService) return;
    if (!editingService.title?.trim()) {
      setSaveError('Service title is required.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    const items = itemsText
      .split('\n')
      .map((i) => i.trim())
      .filter(Boolean);

    const isNew = !editingService.id;
    const url = isNew
      ? '/api/admin/cms/services'
      : `/api/admin/cms/services/${editingService.id}`;
    const method = isNew ? 'POST' : 'PATCH';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingService,
          categoryId: null,
          items,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save service');
      }

      setEditingService(null);
      showToast(isNew ? 'Service created successfully.' : 'Service updated successfully.');
      loadData();
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save service');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.toLowerCase().endsWith('.svg') || file.type === 'image/svg+xml') {
      setMediaUploadError(
        'SVG images are not supported because script execution vectors cannot be safely neutralized without dedicated sanitization. Please use WebP, PNG, JPEG, or GIF.'
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploadingMedia(true);
    setMediaUploadError(null);

    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await fetch('/api/admin/cms/media', {
        method: 'POST',
        body: fd,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      const newAsset: MediaAssetRecord = data.asset;
      // Refresh media assets list
      const mediaRes = await fetch('/api/admin/cms/media', { headers: { Accept: 'application/json' } });
      if (mediaRes.ok) {
        const mediaData = await mediaRes.json();
        setMediaAssets(mediaData.assets || []);
      }

      // Automatically select uploaded image
      setEditingService((prev) => (prev ? { ...prev, mediaAssetId: newAsset.id } : prev));
      showToast(`Uploaded "${newAsset.filename}" and selected for service.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setMediaUploadError(err?.message || 'Failed to upload image.');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const promptDeleteService = (svc: ServiceRecord) => {
    setDeletingService(svc);
    setDeleteError(null);
    setDeleteConflictBookingCount(null);
  };

  const handleDeleteService = async () => {
    if (!deletingService) return;
    setIsDeleting(true);
    setDeleteError(null);
    setDeleteConflictBookingCount(null);

    try {
      const res = await fetch(`/api/admin/cms/services/${deletingService.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409 && data.bookingCount) {
          setDeleteConflictBookingCount(data.bookingCount);
        }
        throw new Error(data.error || 'Failed to delete service');
      }

      showToast(`Service "${deletingService.title}" deleted.`);
      setDeletingService(null);
      if (editingService?.id === deletingService.id) {
        setEditingService(null);
      }
      loadData();
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete service');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeactivateInstead = async () => {
    if (!deletingService) return;
    try {
      const res = await fetch(`/api/admin/cms/services/${deletingService.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to deactivate service');
      }
      showToast(`Service "${deletingService.title}" deactivated.`);
      setDeletingService(null);
      if (editingService?.id === deletingService.id) {
        setEditingService(null);
      }
      loadData();
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to deactivate service');
    }
  };

  // Filtered Services List
  const filteredServices = (services || []).filter((svc) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = svc.title.toLowerCase().includes(q);
      const matchSummary = (svc.summary || '').toLowerCase().includes(q);
      const matchItems = (svc.items || []).some((i) => i.toLowerCase().includes(q));
      if (!matchTitle && !matchSummary && !matchItems) return false;
    }

    if (statusFilter === 'active' && !svc.active) return false;
    if (statusFilter === 'deactivated' && svc.active) return false;
    if (statusFilter === 'catalogue' && !svc.visibleInCatalogue) return false;
    if (statusFilter === 'booking' && !svc.selectableInBooking) return false;

    return true;
  });

  // Selected media asset for preview in modal
  const selectedMediaAsset = mediaAssets.find((a) => a.id === editingService?.mediaAssetId);

  const getMediaUrl = (asset?: MediaAssetRecord | null) => {
    if (!asset) return null;
    if (asset.url) return asset.url;
    if (asset.publicUrl) return asset.publicUrl;
    if (asset.objectKey) return `/media/${asset.objectKey}`;
    return `/images/${asset.filename}`;
  };

  return (
    <div className="space-y-8">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--gm-bg-card)] border border-[var(--gm-accent-border)] text-[var(--gm-text-primary)] shadow-2xl animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-[#15803d] dark:bg-[#25D366]" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)] text-xs ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-4 h-px bg-[var(--gm-accent-primary)]" />
            <span className="text-[10px] font-semibold tracking-[0.25em] text-[var(--gm-accent-primary)] uppercase">
              Catalogue Management
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.02em] text-[var(--gm-text-primary)] uppercase">
            Service Manager
          </h1>
        </div>

        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold tracking-[0.14em] uppercase text-[var(--gm-accent-foreground)] bg-[var(--gm-accent-primary)] hover:bg-[var(--gm-accent-primary-hover)] rounded-lg transition-colors cursor-pointer self-start sm:self-auto shadow-sm"
        >
          + Add New Service
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-[var(--gm-border-subtle)] bg-[var(--gm-bg-card)] p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shadow-sm">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search services by title, summary, or checklist items…"
            className="w-full bg-[var(--gm-bg-surface)] border border-[var(--gm-border-subtle)] rounded-lg pl-9 pr-8 py-2 text-xs text-[var(--gm-text-primary)] placeholder-[var(--gm-text-muted)] focus:border-[var(--gm-accent-primary)] focus:outline-none"
          />
          <span className="absolute left-3 top-2.5 text-xs text-[var(--gm-text-muted)]">🔍</span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-[var(--gm-text-muted)] hover:text-[var(--gm-text-primary)] cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="bg-[var(--gm-bg-surface)] border border-[var(--gm-border-subtle)] rounded-lg px-3 py-2 text-xs text-[var(--gm-text-primary)] focus:border-[var(--gm-accent-primary)] focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="deactivated">Deactivated Only</option>
            <option value="catalogue">In Catalogue Only</option>
            <option value="booking">In Booking Only</option>
          </select>

          {(searchQuery || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="px-3 py-2 text-xs text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)] border border-[var(--gm-border-subtle)] rounded-lg cursor-pointer transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Services List */}
      <div className="rounded-xl border border-[var(--gm-border-subtle)] bg-[var(--gm-bg-card)] p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wider uppercase text-[var(--gm-text-primary)]">
            Service Offerings ({filteredServices.length}{services ? ` of ${services.length}` : ''})
          </h2>
          {searchQuery || statusFilter !== 'all' ? (
            <span className="text-[11px] text-[var(--gm-accent-primary)]">Filtered View (Reordering disabled in filtered view)</span>
          ) : null}
        </div>

        {isLoading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--gm-accent-primary)]/20 border-t-[var(--gm-accent-primary)] animate-spin" />
          </div>
        ) : error ? (
          <div className="py-12 px-6 text-center">
            <p className="text-sm text-red-500 dark:text-red-300">{error}</p>
            <button
              type="button"
              onClick={loadData}
              className="mt-4 inline-flex items-center px-5 py-2 text-xs font-semibold tracking-wider uppercase text-[var(--gm-accent-foreground)] bg-[var(--gm-accent-primary)] rounded-lg cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--gm-text-secondary)]">
            {searchQuery || statusFilter !== 'all'
              ? 'No services matched your filter criteria.'
              : 'No services found. Add your first service above.'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredServices.map((svc, index) => {
              const isFiltered = searchQuery || statusFilter !== 'all';

              return (
                <div
                  key={svc.id}
                  className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl border ${
                    svc.active ? 'border-[var(--gm-border-subtle)] bg-[var(--gm-bg-surface)]' : 'border-[var(--gm-border-subtle)] bg-[var(--gm-bg-surface)]/50 opacity-60'
                  } hover:border-[var(--gm-accent-primary)]/40 transition-colors`}
                >
                  {/* Left info */}
                  <div className="flex items-start sm:items-center gap-4">
                    {/* Reorder controls (active only when not filtered) */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={Boolean(isFiltered) || index === 0}
                        onClick={() => handleMove(index, 'up')}
                        aria-label={`Move ${svc.title} up`}
                        title={isFiltered ? 'Reordering is disabled when filters are active' : 'Move up'}
                        className="p-1 rounded bg-[var(--gm-bg-card)] hover:bg-[var(--gm-bg-card-hover)] disabled:opacity-20 text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)] cursor-pointer"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(isFiltered) || index === filteredServices.length - 1}
                        onClick={() => handleMove(index, 'down')}
                        aria-label={`Move ${svc.title} down`}
                        title={isFiltered ? 'Reordering is disabled when filters are active' : 'Move down'}
                        className="p-1 rounded bg-[var(--gm-bg-card)] hover:bg-[var(--gm-bg-card-hover)] disabled:opacity-20 text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)] cursor-pointer"
                      >
                        ▼
                      </button>
                    </div>

                    {/* Thumbnail */}
                    <div className="w-16 h-12 rounded-lg bg-[var(--gm-bg-card)] overflow-hidden shrink-0 border border-[var(--gm-border-subtle)] flex items-center justify-center">
                      <img
                        src={svc.imageUrl || '/images/placeholder.jpg'}
                        alt={svc.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                        }}
                      />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-[var(--gm-text-primary)]">{svc.title}</span>
                        <span className="text-[10px] font-mono text-[var(--gm-text-muted)]">#{svc.displayOrder}</span>
                      </div>
                      <p className="text-xs text-[var(--gm-text-secondary)] line-clamp-1 max-w-md mt-0.5">
                        {svc.summary || 'No summary provided.'}
                      </p>
                      <div className="text-[10px] text-[var(--gm-text-muted)] mt-1">
                        {svc.items?.length || 0} checklist items
                      </div>
                    </div>
                  </div>

                  {/* Right controls & Toggles */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-[var(--gm-border-subtle)]">
                    {/* Active Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggle(svc, 'active')}
                      title="Toggle active status"
                      className={`px-3 py-1 text-[10px] font-semibold tracking-wider uppercase rounded-full border cursor-pointer transition-colors ${
                        svc.active
                          ? 'bg-[#15803d]/10 dark:bg-[#25D366]/10 text-[#15803d] dark:text-[#25D366] border-[#15803d]/30 dark:border-[#25D366]/30'
                          : 'bg-[var(--gm-bg-card-subtle)] text-[var(--gm-text-secondary)] border-[var(--gm-border-subtle)]'
                      }`}
                    >
                      {svc.active ? '● Active' : '○ Deactivated'}
                    </button>

                    {/* Catalogue Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggle(svc, 'visibleInCatalogue')}
                      title="Toggle visibility on public Services page"
                      className={`px-3 py-1 text-[10px] font-semibold tracking-wider uppercase rounded-full border cursor-pointer transition-colors ${
                        svc.visibleInCatalogue
                          ? 'bg-[var(--gm-accent-muted)] text-[var(--gm-accent-primary)] border-[var(--gm-accent-border)]'
                          : 'bg-[var(--gm-bg-card-subtle)] text-[var(--gm-text-muted)] border-[var(--gm-border-subtle)] line-through'
                      }`}
                    >
                      Catalogue
                    </button>

                    {/* Booking Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggle(svc, 'selectableInBooking')}
                      title="Toggle selectability in booking form"
                      className={`px-3 py-1 text-[10px] font-semibold tracking-wider uppercase rounded-full border cursor-pointer transition-colors ${
                        svc.selectableInBooking
                          ? 'bg-[#2563eb]/10 dark:bg-[#60A5FA]/10 text-[#2563eb] dark:text-[#60A5FA] border-[#2563eb]/30 dark:border-[#60A5FA]/30'
                          : 'bg-[var(--gm-bg-card-subtle)] text-[var(--gm-text-muted)] border-[var(--gm-border-subtle)] line-through'
                      }`}
                    >
                      Booking
                    </button>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => openEdit(svc)}
                      className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--gm-text-primary)] bg-[var(--gm-bg-card)] hover:bg-[var(--gm-accent-primary)] hover:text-[var(--gm-accent-foreground)] border border-[var(--gm-border-subtle)] hover:border-[var(--gm-accent-primary)] rounded-lg cursor-pointer transition-colors"
                    >
                      Edit
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => promptDeleteService(svc)}
                      aria-label={`Delete ${svc.title}`}
                      title="Delete service"
                      className="p-1.5 text-xs text-red-500 hover:text-white bg-red-500/10 hover:bg-red-600 border border-red-500/20 rounded-lg cursor-pointer transition-colors"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit / Create Service Modal */}
      {editingService && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-[#040404]/85 backdrop-blur-md overflow-y-auto"
        >
          <div className="bg-[var(--gm-bg-card)] border border-[var(--gm-border-subtle)] rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-5 my-auto max-h-[90vh] overflow-y-auto shadow-2xl text-[var(--gm-text-primary)]">
            <div className="flex items-center justify-between border-b border-[var(--gm-border-subtle)] pb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[var(--gm-text-primary)] uppercase tracking-wide">
                  {editingService.id ? `Edit: ${editingService.title || 'Service'}` : 'Add New Service'}
                </h2>
                {isFormDirty() && (
                  <span className="text-[10px] text-[var(--gm-accent-primary)] font-semibold tracking-wider uppercase">
                    ● Unsaved changes
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)] text-sm p-1 rounded cursor-pointer"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block text-[var(--gm-text-secondary)] uppercase tracking-wider mb-1 font-semibold">
                  Service Title *
                </label>
                <input
                  type="text"
                  value={editingService.title || ''}
                  onChange={(e) =>
                    setEditingService({ ...editingService, title: e.target.value })
                  }
                  placeholder="e.g. Performance Exhaust Tuning"
                  className="w-full bg-[var(--gm-bg-surface)] border border-[var(--gm-border-subtle)] rounded-lg px-3 py-2.5 text-sm text-[var(--gm-text-primary)] focus:border-[var(--gm-accent-primary)] focus:outline-none"
                />
              </div>

              {/* Summary */}
              <div>
                <label className="block text-[var(--gm-text-secondary)] uppercase tracking-wider mb-1 font-semibold">
                  Summary
                </label>
                <textarea
                  rows={2}
                  value={editingService.summary || ''}
                  onChange={(e) =>
                    setEditingService({ ...editingService, summary: e.target.value })
                  }
                  placeholder="Brief overview displayed on catalogue and cards…"
                  className="w-full bg-[var(--gm-bg-surface)] border border-[var(--gm-border-subtle)] rounded-lg px-3 py-2 text-xs text-[var(--gm-text-primary)] focus:border-[var(--gm-accent-primary)] focus:outline-none resize-none"
                />
              </div>

              {/* Items */}
              <div>
                <label className="block text-[var(--gm-text-secondary)] uppercase tracking-wider mb-1 font-semibold">
                  Included Tasks / Checklist (One per line)
                </label>
                <textarea
                  rows={4}
                  value={itemsText}
                  onChange={(e) => setItemsText(e.target.value)}
                  placeholder="OBD Diagnostic scan&#10;High-flow cat installation&#10;Dyno performance verification"
                  className="w-full bg-[var(--gm-bg-surface)] border border-[var(--gm-border-subtle)] rounded-lg px-3 py-2 text-xs text-[var(--gm-text-primary)] font-mono focus:border-[var(--gm-accent-primary)] focus:outline-none resize-none"
                />
              </div>

              {/* Media Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[var(--gm-text-secondary)] uppercase tracking-wider font-semibold">
                    Linked Media Asset
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleInlineImageUpload}
                  />
                  <button
                    type="button"
                    disabled={isUploadingMedia}
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] text-[var(--gm-accent-primary)] hover:text-[var(--gm-accent-primary-hover)] font-semibold tracking-wider uppercase cursor-pointer flex items-center gap-1"
                  >
                    {isUploadingMedia ? (
                      <>
                        <span className="w-2.5 h-2.5 border-2 border-[var(--gm-accent-primary)]/40 border-t-[var(--gm-accent-primary)] rounded-full animate-spin" />
                        <span>Uploading…</span>
                      </>
                    ) : (
                      <span>+ Upload Image</span>
                    )}
                  </button>
                </div>

                <select
                  value={editingService.mediaAssetId || ''}
                  onChange={(e) =>
                    setEditingService({
                      ...editingService,
                      mediaAssetId: e.target.value || null,
                    })
                  }
                  className="w-full bg-[var(--gm-bg-surface)] border border-[var(--gm-border-subtle)] rounded-lg px-3 py-2 text-xs text-[var(--gm-text-primary)] focus:border-[var(--gm-accent-primary)] focus:outline-none cursor-pointer"
                >
                  <option value="">(Default Hardcoded Image)</option>
                  {mediaAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.filename} [{asset.source}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Upload Error Banner */}
              {mediaUploadError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-300 text-xs">
                  {mediaUploadError}
                </div>
              )}

              {/* Linked Media Asset Thumbnail Preview Card */}
              <div className="p-3 rounded-xl border border-[var(--gm-border-subtle)] bg-[var(--gm-bg-surface)] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg bg-[var(--gm-bg-card)] border border-[var(--gm-border-subtle)] overflow-hidden shrink-0 flex items-center justify-center">
                    {selectedMediaAsset ? (
                      <img
                        src={getMediaUrl(selectedMediaAsset) || '/images/placeholder.jpg'}
                        alt={selectedMediaAsset.filename}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                        }}
                      />
                    ) : (
                      <img
                        src={editingService.imagePath || '/images/placeholder.jpg'}
                        alt="Default"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                        }}
                      />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[var(--gm-text-primary)]">
                        {selectedMediaAsset ? selectedMediaAsset.filename : '(Default Image Asset)'}
                      </span>
                      <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase rounded bg-[var(--gm-bg-card)] border border-[var(--gm-border-subtle)] text-[var(--gm-text-secondary)]">
                        {selectedMediaAsset ? selectedMediaAsset.source : 'seed/builtin'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--gm-text-muted)] font-mono mt-0.5">
                      {selectedMediaAsset?.width && selectedMediaAsset?.height
                        ? `${selectedMediaAsset.width} × ${selectedMediaAsset.height} px • `
                        : ''}
                      {formatBytes(selectedMediaAsset?.byteSize)}
                    </p>
                  </div>
                </div>

                {editingService.mediaAssetId && (
                  <button
                    type="button"
                    onClick={() => setEditingService({ ...editingService, mediaAssetId: null })}
                    className="text-[10px] text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)] border border-[var(--gm-border-subtle)] hover:border-[var(--gm-accent-primary)] px-2.5 py-1 rounded cursor-pointer"
                  >
                    Reset to Default
                  </button>
                )}
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-[var(--gm-border-subtle)]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingService.active ?? true}
                    onChange={(e) =>
                      setEditingService({ ...editingService, active: e.target.checked })
                    }
                    className="accent-[var(--gm-accent-primary)] cursor-pointer"
                  />
                  <span className="text-[var(--gm-text-primary)] font-semibold">Active Status</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingService.visibleInCatalogue ?? true}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        visibleInCatalogue: e.target.checked,
                      })
                    }
                    className="accent-[var(--gm-accent-primary)] cursor-pointer"
                  />
                  <span className="text-[var(--gm-text-primary)] font-semibold">Show in Catalogue</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingService.selectableInBooking ?? true}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        selectableInBooking: e.target.checked,
                      })
                    }
                    className="accent-[var(--gm-accent-primary)] cursor-pointer"
                  />
                  <span className="text-[var(--gm-text-primary)] font-semibold">Selectable in Booking Form</span>
                </label>
              </div>
            </div>

            {saveError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-300 text-xs">
                {saveError}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-[var(--gm-border-subtle)]">
              {editingService.id ? (
                <button
                  type="button"
                  onClick={() => promptDeleteService(editingService as ServiceRecord)}
                  className="px-3.5 py-2 text-xs font-semibold text-red-500 hover:text-white bg-red-500/10 hover:bg-red-600 rounded-lg border border-red-500/20 cursor-pointer transition-colors"
                >
                  Delete Service
                </button>
              ) : <div />}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-xs font-semibold text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveService}
                  disabled={isSaving || !editingService.title?.trim()}
                  className="px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--gm-accent-foreground)] bg-[var(--gm-accent-primary)] hover:bg-[var(--gm-accent-primary-hover)] disabled:opacity-50 rounded-lg cursor-pointer transition-colors shadow-sm"
                >
                  {isSaving ? 'Saving…' : 'Save Service'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Service Confirmation / Conflict Modal */}
      {deletingService && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-[#040404]/85 backdrop-blur-md"
        >
          <div className="bg-[var(--gm-bg-card)] border border-[var(--gm-border-subtle)] rounded-2xl max-w-md w-full p-6 sm:p-8 space-y-5 my-auto shadow-2xl text-[var(--gm-text-primary)]">
            <h2 className="text-lg font-bold text-[var(--gm-text-primary)] uppercase tracking-wide">
              Delete Service
            </h2>

            {deleteConflictBookingCount ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[#b45309] dark:text-amber-200 text-xs space-y-2">
                  <p className="font-semibold text-sm text-[#92400e] dark:text-amber-100">
                    Cannot Permanently Delete Service
                  </p>
                  <p>
                    <strong>&ldquo;{deletingService.title}&rdquo;</strong> is referenced by{' '}
                    <strong>{deleteConflictBookingCount}</strong> historical booking record(s).
                  </p>
                  <p className="opacity-90">
                    To preserve booking records and customer audit history, we recommend deactivating the service instead. This removes it from public catalogue and booking forms safely.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeletingService(null)}
                    className="px-4 py-2 text-xs font-semibold text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeactivateInstead}
                    className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--gm-accent-foreground)] bg-[var(--gm-accent-primary)] hover:bg-[var(--gm-accent-primary-hover)] rounded-lg cursor-pointer transition-colors shadow-sm"
                  >
                    Deactivate Service Instead
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-[var(--gm-text-secondary)] leading-relaxed">
                  Are you sure you want to permanently delete{' '}
                  <strong className="text-[var(--gm-text-primary)]">&ldquo;{deletingService.title}&rdquo;</strong>?
                  This action cannot be undone.
                </p>

                {deleteError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-300 text-xs">
                    {deleteError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeletingService(null)}
                    className="px-4 py-2 text-xs font-semibold text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteService}
                    disabled={isDeleting}
                    className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg cursor-pointer transition-colors"
                  >
                    {isDeleting ? 'Deleting…' : 'Delete Permanently'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
