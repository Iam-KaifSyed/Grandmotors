import { useEffect, useState, useRef } from 'react';
import type { GalleryItemRecord } from '../../lib/galleryStore';
import type { MediaAssetRecord } from '../../lib/mediaStore';

function cleanFilenameToTitle(filename: string): string {
  const withoutExt = filename.replace(/\.[^/.]+$/, '');
  return withoutExt
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export function GalleryManager() {
  const [items, setItems] = useState<GalleryItemRecord[] | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAssetRecord[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Multi-upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMultiUploading, setIsMultiUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [batchCategory, setBatchCategory] = useState<string>('');
  const [batchPublished, setBatchPublished] = useState<boolean>(true);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItemRecord | null>(null);
  const [deletingItem, setDeletingItem] = useState<GalleryItemRecord | null>(null);

  // Single Item Form states
  const [createMode, setCreateMode] = useState<'existing' | 'upload'>('existing');
  const [formSingleFile, setFormSingleFile] = useState<File | null>(null);
  const [formMediaAssetId, setFormMediaAssetId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formPublished, setFormPublished] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [galRes, mediaRes] = await Promise.all([
        fetch('/api/admin/cms/gallery', { headers: { Accept: 'application/json' } }),
        fetch('/api/admin/cms/media', { headers: { Accept: 'application/json' } }),
      ]);

      if (galRes.status === 401 || mediaRes.status === 401) {
        window.location.href = '/admin/login';
        return;
      }

      if (!galRes.ok || !mediaRes.ok) {
        throw new Error('Failed to load gallery data');
      }

      const galData = await galRes.json();
      const mediaData = await mediaRes.json();

      setItems(galData.items || []);
      setCategories(galData.categories || []);
      setMediaAssets(mediaData.assets || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load gallery manager');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Multi-file upload handler
  const handleMultiFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsMultiUploading(true);
    setUploadError(null);
    const total = files.length;
    let successful = 0;

    try {
      for (let i = 0; i < total; i++) {
        const file = files[i];
        setUploadProgress(`Uploading ${i + 1} of ${total}: ${file.name}...`);

        // 1. Upload to media library
        const fd = new FormData();
        fd.append('file', file);

        const mediaRes = await fetch('/api/admin/cms/media', {
          method: 'POST',
          body: fd,
        });

        if (!mediaRes.ok) {
          const errData = await mediaRes.json().catch(() => ({}));
          throw new Error(errData.error || `Failed uploading ${file.name}`);
        }

        const mediaData = await mediaRes.json();
        const mediaAssetId = mediaData.asset?.id || mediaData.id;

        if (!mediaAssetId) {
          throw new Error(`Missing asset ID after uploading ${file.name}`);
        }

        // 2. Create gallery item
        const galRes = await fetch('/api/admin/cms/gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mediaAssetId,
            title: cleanFilenameToTitle(file.name),
            description: '',
            categoryId: batchCategory || null,
            published: batchPublished,
          }),
        });

        if (!galRes.ok) {
          const errData = await galRes.json().catch(() => ({}));
          throw new Error(errData.error || `Failed creating gallery item for ${file.name}`);
        }

        successful++;
      }

      setUploadProgress(`Successfully added ${successful} image(s) to the gallery!`);
      setTimeout(() => setUploadProgress(null), 3000);
      await loadData();
    } catch (err: any) {
      setUploadError(err?.message || 'Upload process encountered an error');
    } finally {
      setIsMultiUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreateOpen = () => {
    setCreateMode('existing');
    setFormSingleFile(null);
    setFormMediaAssetId(mediaAssets?.[0]?.id || '');
    setFormTitle('');
    setFormDescription('');
    setFormCategoryId(categories[0]?.id || '');
    setFormPublished(true);
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleEditOpen = (item: GalleryItemRecord) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormDescription(item.description || '');
    setFormCategoryId(item.categoryId || '');
    setFormPublished(item.published);
    setFormError(null);
  };

  const handleSaveCreate = async () => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      let assetIdToUse = formMediaAssetId;

      if (createMode === 'upload') {
        if (!formSingleFile) {
          throw new Error('Please select an image file to upload.');
        }

        const fd = new FormData();
        fd.append('file', formSingleFile);

        const mediaRes = await fetch('/api/admin/cms/media', {
          method: 'POST',
          body: fd,
        });

        if (!mediaRes.ok) {
          const d = await mediaRes.json().catch(() => ({}));
          throw new Error(d.error || 'Failed to upload photo');
        }

        const mediaData = await mediaRes.json();
        assetIdToUse = mediaData.asset?.id || mediaData.id;
      }

      if (!assetIdToUse) {
        throw new Error('Please select or upload a media photo.');
      }

      if (!formTitle.trim()) {
        throw new Error('Title / caption is required.');
      }

      const res = await fetch('/api/admin/cms/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaAssetId: assetIdToUse,
          title: formTitle.trim(),
          description: formDescription.trim(),
          categoryId: formCategoryId || null,
          published: formPublished,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create gallery item');
      }

      setIsCreateOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create gallery item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !formTitle.trim()) {
      setFormError('Title is required.');
      return;
    }
    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/admin/cms/gallery/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDescription.trim(),
          categoryId: formCategoryId || null,
          published: formPublished,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update gallery item');
      }

      setEditingItem(null);
      await loadData();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to update gallery item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/cms/gallery/${deletingItem.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete gallery item');
      }

      setDeletingItem(null);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Delete failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = async (item: GalleryItemRecord) => {
    try {
      const res = await fetch(`/api/admin/cms/gallery/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title,
          description: item.description,
          categoryId: item.categoryId,
          displayOrder: item.displayOrder,
          published: !item.published,
        }),
      });
      if (res.ok) {
        await loadData();
      }
    } catch {
      // ignore
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (!items) return;
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    const orderedIds = newItems.map((i) => i.id);
    setItems(newItems); // optimistic

    try {
      await fetch('/api/admin/cms/gallery/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
      await loadData();
    } catch {
      await loadData();
    }
  };

  // Filter items
  const filteredItems = (items || []).filter((item) => {
    if (selectedCategoryFilter !== 'all' && item.categoryId !== selectedCategoryFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = (item.title || '').toLowerCase().includes(q);
      const matchDesc = (item.description || '').toLowerCase().includes(q);
      const matchCat = (item.categoryName || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCat) return false;
    }
    return true;
  });

  const selectedAsset = mediaAssets?.find((a) => a.id === formMediaAssetId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-4 h-px bg-[var(--gm-accent-primary)]" />
            <span className="text-[10px] font-semibold tracking-[0.25em] text-[var(--gm-accent-primary)] uppercase">
              CMS Management
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.02em] text-[var(--gm-text-primary)] uppercase">
            Past Work Gallery
          </h1>
          <p className="mt-1 text-xs text-[var(--gm-text-secondary)]">
            Upload workshop photos, assign automotive service categories, reorder items, and manage public showcase.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleMultiFileUpload}
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            id="multi-image-upload"
          />
          <button
            type="button"
            disabled={isMultiUploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold tracking-[0.12em] uppercase text-[var(--gm-text-primary)] bg-[var(--gm-bg-card)] hover:bg-[var(--gm-bg-card-hover)] border border-[var(--gm-border-subtle)] hover:border-[var(--gm-accent-border)] rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
          >
            <svg className="w-4 h-4 text-[var(--gm-accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>{isMultiUploading ? 'Uploading...' : 'Batch Upload Photos'}</span>
          </button>

          <button
            type="button"
            onClick={handleCreateOpen}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold tracking-[0.14em] uppercase text-[var(--gm-accent-foreground)] bg-[var(--gm-accent-primary)] hover:bg-[var(--gm-accent-primary-hover)] rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            + Add Gallery Item
          </button>
        </div>
      </div>

      {/* Multi-upload Status / Options bar */}
      <div className="rounded-xl border border-[var(--gm-border-subtle)] bg-[var(--gm-bg-card)] p-4 text-xs space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[var(--gm-text-secondary)]">
            <span className="font-semibold text-[var(--gm-text-primary)] uppercase tracking-wider text-[11px]">Batch Upload Defaults:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[var(--gm-text-secondary)]">Category:</span>
              <select
                value={batchCategory}
                onChange={(e) => setBatchCategory(e.target.value)}
                className="bg-[var(--gm-bg-surface)] border border-[var(--gm-border-subtle)] rounded-lg px-2.5 py-1 text-xs text-[var(--gm-text-primary)] focus:outline-none"
              >
                <option value="">— Uncategorized —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-[var(--gm-text-secondary)]">
              <input
                type="checkbox"
                checked={batchPublished}
                onChange={(e) => setBatchPublished(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-[var(--gm-accent-primary)]"
              />
              <span>Auto-Publish</span>
            </label>
          </div>
        </div>

        {uploadProgress && (
          <div className="p-3 bg-[var(--gm-accent-muted)] border border-[var(--gm-accent-border)] rounded-lg text-[var(--gm-accent-primary)] font-medium text-xs flex items-center gap-2 animate-pulse">
            <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
            <span>{uploadProgress}</span>
          </div>
        )}

        {uploadError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs">
            {uploadError}
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-colors shrink-0 cursor-pointer ${
              selectedCategoryFilter === 'all'
                ? 'bg-[var(--gm-accent-primary)] text-[var(--gm-accent-foreground)]'
                : 'bg-[var(--gm-bg-card)] border border-[var(--gm-border-subtle)] text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)]'
            }`}
          >
            All ({items?.length || 0})
          </button>
          {categories.map((cat) => {
            const count = (items || []).filter((i) => i.categoryId === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-colors shrink-0 cursor-pointer ${
                  selectedCategoryFilter === cat.id
                    ? 'bg-[var(--gm-accent-primary)] text-[var(--gm-accent-foreground)]'
                    : 'bg-[var(--gm-bg-card)] border border-[var(--gm-border-subtle)] text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)]'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search past work..."
            className="w-full bg-[var(--gm-bg-card)] border border-[var(--gm-border-subtle)] rounded-lg px-3 py-1.5 text-xs text-[var(--gm-text-primary)] placeholder-[var(--gm-text-secondary)]/60 focus:border-[var(--gm-accent-primary)] focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)]"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Gallery Items Grid / List */}
      <div className="rounded-xl border border-[var(--gm-border-subtle)] bg-[var(--gm-bg-card)] p-4 sm:p-6 shadow-sm">
        {isLoading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--gm-accent-primary)]/20 border-t-[var(--gm-accent-primary)] animate-spin" />
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-500 text-sm">{error}</div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center text-sm text-[var(--gm-text-secondary)] space-y-3">
            <p>
              {items && items.length > 0
                ? 'No items match your filter.'
                : 'No gallery items found yet. Click "+ Add Gallery Item" or "Batch Upload Photos" to showcase completed work.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-[var(--gm-border-subtle)] bg-[var(--gm-bg-surface)] hover:border-[var(--gm-accent-primary)]/40 transition-colors shadow-sm"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative w-20 h-16 sm:w-24 sm:h-18 rounded-lg overflow-hidden border border-[var(--gm-border-subtle)] shrink-0 bg-black/20">
                    <img
                      src={item.imageUrl}
                      alt={item.imageAlt || item.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                      }}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-[var(--gm-text-primary)] truncate">
                        {item.title}
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(item)}
                        className={`px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase rounded-full cursor-pointer transition-opacity hover:opacity-80 ${
                          item.published
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}
                        title="Click to toggle publish status"
                      >
                        {item.published ? '● Published' : '○ Draft'}
                      </button>
                      {item.categoryName && (
                        <span className="px-2 py-0.5 text-[9px] font-medium tracking-wider uppercase rounded bg-[var(--gm-accent-muted)] border border-[var(--gm-accent-border)] text-[var(--gm-accent-primary)]">
                          {item.categoryName}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-[var(--gm-text-secondary)] mt-1 line-clamp-1">
                        {item.description}
                      </p>
                    )}
                    <span className="text-[10px] text-[var(--gm-text-secondary)]/60 mt-1 block">
                      Order: #{item.displayOrder}
                    </span>
                  </div>
                </div>

                {/* Actions & Ordering */}
                <div className="flex items-center gap-2 shrink-0 justify-end sm:justify-start">
                  <div className="flex items-center gap-1 border border-[var(--gm-border-subtle)] rounded-lg p-0.5 bg-[var(--gm-bg-card)]">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(index, 'up')}
                      className="p-1 text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)] disabled:opacity-20 cursor-pointer"
                      title="Move Up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={index === filteredItems.length - 1}
                      onClick={() => handleMove(index, 'down')}
                      className="p-1 text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)] disabled:opacity-20 cursor-pointer"
                      title="Move Down"
                    >
                      ▼
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTogglePublish(item)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                      item.published
                        ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20'
                        : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
                    }`}
                  >
                    {item.published ? 'Unpublish' : 'Publish'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleEditOpen(item)}
                    className="px-3 py-1.5 text-xs font-semibold text-[var(--gm-text-primary)] bg-[var(--gm-bg-card)] hover:bg-[var(--gm-bg-card-hover)] border border-[var(--gm-border-subtle)] rounded-lg transition-colors cursor-pointer"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingItem(item)}
                    className="px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-[#040404]/85 backdrop-blur-md">
          <div className="bg-[var(--gm-bg-card)] border border-[var(--gm-border-subtle)] rounded-2xl max-w-lg w-full p-6 space-y-4 text-[var(--gm-text-primary)] shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-[var(--gm-text-primary)] uppercase">Add Gallery Item</h2>

            {/* Mode Toggle */}
            <div className="flex border border-[var(--gm-border-subtle)] rounded-lg p-1 bg-[var(--gm-bg-surface)]">
              <button
                type="button"
                onClick={() => setCreateMode('existing')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  createMode === 'existing'
                    ? 'bg-[var(--gm-accent-primary)] text-[var(--gm-accent-foreground)]'
                    : 'text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)]'
                }`}
              >
                Choose from Media Library
              </button>
              <button
                type="button"
                onClick={() => setCreateMode('upload')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  createMode === 'upload'
                    ? 'bg-[var(--gm-accent-primary)] text-[var(--gm-accent-foreground)]'
                    : 'text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)]'
                }`}
              >
                Upload New Photo
              </button>
            </div>

            <div className="space-y-4">
              {createMode === 'existing' ? (
                <div>
                  <label className="block text-xs font-semibold text-[var(--gm-text-secondary)] uppercase tracking-wider mb-1.5">
                    Select Media Asset
                  </label>
                  <select
                    value={formMediaAssetId}
                    onChange={(e) => {
                      setFormMediaAssetId(e.target.value);
                      const asset = mediaAssets?.find((a) => a.id === e.target.value);
                      if (asset && !formTitle) {
                        setFormTitle(cleanFilenameToTitle(asset.filename));
                      }
                    }}
                    className="w-full bg-[var(--gm-bg-surface)] border border-[var(--gm-border-subtle)] rounded-lg px-3 py-2.5 text-xs text-[var(--gm-text-primary)] focus:border-[var(--gm-accent-primary)] focus:outline-none"
                  >
                    {mediaAssets?.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.filename} ({asset.width ? `${asset.width}x${asset.height}` : 'Uploaded'})
                      </option>
                    ))}
                  </select>

                  {selectedAsset && selectedAsset.url && (
                    <div className="mt-2.5 flex items-center gap-3 p-2 bg-[var(--gm-bg-surface)] rounded-lg border border-[var(--gm-border-subtle)]">
                      <img
                        src={selectedAsset.url}
                        alt="Preview"
                        className="w-14 h-12 object-cover rounded border border-[var(--gm-border-subtle)]"
                      />
                      <div className="text-[11px] text-[var(--gm-text-secondary)] truncate">
                        <span className="font-semibold text-[var(--gm-text-primary)]">{selectedAsset.filename}</span>
                        {selectedAsset.byteSize && (
                          <span className="block opacity-75">{(selectedAsset.byteSize / 1024).toFixed(1)} KB</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-[var(--gm-text-secondary)] uppercase tracking-wider mb-1.5">
                    Upload Photo File
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setFormSingleFile(file);
                      if (file && !formTitle) {
                        setFormTitle(cleanFilenameToTitle(file.name));
                      }
                    }}
                    className="w-full bg-[var(--gm-bg-surface)] border border-[var(--gm-border-subtle)] rounded-lg px-3 py-2 text-xs text-[var(--gm-text-primary)] file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[var(--gm-accent-primary)] file:text-[var(--gm-accent-foreground)] cursor-pointer"
                  />
                  <p className="mt-1 text-[10px] text-[var(--gm-text-secondary)]">
                    Supported formats: JPEG, PNG, WebP, GIF (max 10MB). Automatically stored in Cloudflare R2.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[var(--gm-text-secondary)] uppercase tracking-wider mb-1.5">
                  Title / Caption *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Mercedes-AMG E63 Ceramic Brake Overhaul"
                  className="w-full bg-[var(--gm-bg-surface)] border border-[var(--gm-border-subtle)] rounded-lg px-3 py-2.5 text-xs text-[var(--gm-text-primary)] focus:border-[var(--gm-accent-primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--gm-text-secondary)] uppercase tracking-wider mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brief details about the automotive service performed..."
                  rows={3}
                  className="w-full bg-[var(--gm-bg-surface)] border border-[var(--gm-border-subtle)] rounded-lg px-3 py-2.5 text-xs text-[var(--gm-text-primary)] focus:border-[var(--gm-accent-primary)] focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--gm-text-secondary)] uppercase tracking-wider mb-1.5">
                  Service Category
                </label>
                <select
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  className="w-full bg-[var(--gm-bg-surface)] border border-[var(--gm-border-subtle)] rounded-lg px-3 py-2.5 text-xs text-[var(--gm-text-primary)] focus:border-[var(--gm-accent-primary)] focus:outline-none"
                >
                  <option value="">— Uncategorized / All —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="create-published"
                  checked={formPublished}
                  onChange={(e) => setFormPublished(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--gm-border-subtle)] text-[var(--gm-accent-primary)] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="create-published" className="text-xs font-medium text-[var(--gm-text-primary)] cursor-pointer">
                  Publish immediately to public gallery
                </label>
              </div>

              {formError && <p className="text-xs text-red-500">{formError}</p>}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--gm-border-subtle)]">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCreate}
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--gm-accent-foreground)] bg-[var(--gm-accent-primary)] hover:bg-[var(--gm-accent-primary-hover)] disabled:opacity-50 rounded-lg cursor-pointer transition-colors shadow-sm"
              >
                {isSubmitting ? 'Saving...' : 'Add to Gallery'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-[#040404]/85 backdrop-blur-md">
          <div className="bg-[var(--gm-bg-card)] border border-[var(--gm-border-subtle)] rounded-2xl max-w-lg w-full p-6 space-y-4 text-[var(--gm-text-primary)] shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-[var(--gm-text-primary)] uppercase">Edit Gallery Item</h2>

            {editingItem.imageUrl && (
              <div className="flex items-center gap-3 p-3 bg-[var(--gm-bg-surface)] rounded-xl border border-[var(--gm-border-subtle)]">
                <img
                  src={editingItem.imageUrl}
                  alt={editingItem.title}
                  className="w-16 h-12 object-cover rounded border border-[var(--gm-border-subtle)]"
                />
                <div className="text-xs truncate">
                  <span className="font-semibold text-[var(--gm-text-primary)]">{editingItem.title}</span>
                  <span className="block text-[11px] text-[var(--gm-text-secondary)] mt-0.5">
                    {editingItem.categoryName || 'Uncategorized'}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--gm-text-secondary)] uppercase tracking-wider mb-1.5">
                  Title / Caption *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-[var(--gm-bg-surface)] border border-[var(--gm-border-subtle)] rounded-lg px-3 py-2.5 text-xs text-[var(--gm-text-primary)] focus:border-[var(--gm-accent-primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--gm-text-secondary)] uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-[var(--gm-bg-surface)] border border-[var(--gm-border-subtle)] rounded-lg px-3 py-2.5 text-xs text-[var(--gm-text-primary)] focus:border-[var(--gm-accent-primary)] focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--gm-text-secondary)] uppercase tracking-wider mb-1.5">
                  Service Category
                </label>
                <select
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  className="w-full bg-[var(--gm-bg-surface)] border border-[var(--gm-border-subtle)] rounded-lg px-3 py-2.5 text-xs text-[var(--gm-text-primary)] focus:border-[var(--gm-accent-primary)] focus:outline-none"
                >
                  <option value="">— Uncategorized / All —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="edit-published"
                  checked={formPublished}
                  onChange={(e) => setFormPublished(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--gm-border-subtle)] text-[var(--gm-accent-primary)] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="edit-published" className="text-xs font-medium text-[var(--gm-text-primary)] cursor-pointer">
                  Published on public gallery
                </label>
              </div>

              {formError && <p className="text-xs text-red-500">{formError}</p>}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--gm-border-subtle)]">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-xs font-semibold text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--gm-accent-foreground)] bg-[var(--gm-accent-primary)] hover:bg-[var(--gm-accent-primary-hover)] disabled:opacity-50 rounded-lg cursor-pointer transition-colors shadow-sm"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-[#040404]/85 backdrop-blur-md">
          <div className="bg-[var(--gm-bg-card)] border border-[var(--gm-border-subtle)] rounded-2xl max-w-md w-full p-6 space-y-4 text-[var(--gm-text-primary)] shadow-2xl">
            <h2 className="text-lg font-bold text-[var(--gm-text-primary)] uppercase">Remove Gallery Item?</h2>
            <p className="text-xs text-[var(--gm-text-secondary)] leading-relaxed">
              Are you sure you want to remove &ldquo;<span className="font-semibold text-[var(--gm-text-primary)]">{deletingItem.title}</span>&rdquo; from the gallery? The underlying photo will remain safe in your Media Library.
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--gm-border-subtle)]">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 text-xs font-semibold text-[var(--gm-text-secondary)] hover:text-[var(--gm-text-primary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg cursor-pointer transition-colors"
              >
                {isSubmitting ? 'Removing...' : 'Remove Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
