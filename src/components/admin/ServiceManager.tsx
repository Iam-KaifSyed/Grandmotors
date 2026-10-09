import { useEffect, useState } from 'react';
import type { ServiceRecord, ServiceCategoryRecord } from '../../lib/serviceStore';
import type { MediaAssetRecord } from '../../lib/mediaStore';

export function ServiceManager() {
  const [services, setServices] = useState<ServiceRecord[] | null>(null);
  const [categories, setCategories] = useState<ServiceCategoryRecord[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAssetRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit / Create Service Modal
  const [editingService, setEditingService] = useState<Partial<ServiceRecord> | null>(null);
  const [itemsText, setItemsText] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Create Category Modal
  const [newCatName, setNewCatName] = useState('');
  const [isCreatingCat, setIsCreatingCat] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [svcRes, catRes, mediaRes] = await Promise.all([
        fetch('/api/admin/cms/services', { headers: { Accept: 'application/json' } }),
        fetch('/api/admin/cms/service-categories', { headers: { Accept: 'application/json' } }),
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

      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.categories || []);
      }

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
    } catch (err: any) {
      alert(err?.message || 'Failed to update toggle');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (!services) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= services.length) return;

    const newList = [...services];
    const [moved] = newList.splice(index, 1);
    newList.splice(targetIndex, 0, moved);

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
    } catch (err) {
      loadData();
    }
  };

  const openEdit = (svc: ServiceRecord) => {
    setEditingService({ ...svc });
    setItemsText((svc.items || []).join('\n'));
    setSaveError(null);
  };

  const openNew = () => {
    setEditingService({
      title: '',
      summary: '',
      items: [],
      categoryId: null,
      mediaAssetId: null,
      visibleInCatalogue: true,
      selectableInBooking: true,
      active: true,
    });
    setItemsText('');
    setSaveError(null);
  };

  const handleSaveService = async () => {
    if (!editingService) return;
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
          items,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save service');
      }

      setEditingService(null);
      loadData();
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save service');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setIsCreatingCat(true);
    setCatError(null);

    try {
      const res = await fetch('/api/admin/cms/service-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim() }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create category');
      }

      setNewCatName('');
      loadData();
    } catch (err: any) {
      setCatError(err?.message || 'Failed to create category');
    } finally {
      setIsCreatingCat(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-4 h-px bg-[#B88952]" />
            <span className="text-[10px] font-semibold tracking-[0.25em] text-[#B88952] uppercase">
              Catalogue Management
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.02em] text-[#F2F0EA] uppercase">
            Service Manager
          </h1>
        </div>

        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold tracking-[0.14em] uppercase text-[#0A0C0D] bg-[#B88952] hover:bg-[#caa066] rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
        >
          + Add New Service
        </button>
      </div>

      {/* Services List */}
      <div className="rounded-xl border border-white/8 bg-[#111315] p-6 space-y-4">
        <h2 className="text-sm font-semibold tracking-wider uppercase text-[#F2F0EA]">
          Active Service Offerings ({services?.length || 0})
        </h2>

        {isLoading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#B88952]/20 border-t-[#B88952] animate-spin" />
          </div>
        ) : error ? (
          <div className="py-12 px-6 text-center">
            <p className="text-sm text-red-300">{error}</p>
            <button
              type="button"
              onClick={loadData}
              className="mt-4 inline-flex items-center px-5 py-2 text-xs font-semibold tracking-wider uppercase text-[#0A0C0D] bg-[#B88952] rounded-lg cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : !services || services.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#A7AAAD]">
            No services found. Add your first service above.
          </div>
        ) : (
          <div className="space-y-3">
            {services.map((svc, index) => (
              <div
                key={svc.id}
                className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl border ${
                  svc.active ? 'border-white/8 bg-[#0A0C0D]' : 'border-white/5 bg-[#0A0C0D]/50 opacity-60'
                } hover:border-[#B88952]/30 transition-colors`}
              >
                {/* Left info */}
                <div className="flex items-start sm:items-center gap-4">
                  {/* Reorder controls */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(index, 'up')}
                      aria-label="Move Up"
                      className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-20 text-[#A7AAAD] hover:text-[#F2F0EA] cursor-pointer"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={index === services.length - 1}
                      onClick={() => handleMove(index, 'down')}
                      aria-label="Move Down"
                      className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-20 text-[#A7AAAD] hover:text-[#F2F0EA] cursor-pointer"
                    >
                      ▼
                    </button>
                  </div>

                  {/* Thumbnail */}
                  <div className="w-16 h-12 rounded-lg bg-[#111315] overflow-hidden shrink-0 border border-white/10">
                    <img
                      src={svc.imageUrl}
                      alt={svc.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                      }}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#F2F0EA]">{svc.title}</span>
                      <span className="text-[10px] font-mono text-[#A7AAAD]/60">#{svc.displayOrder}</span>
                    </div>
                    <p className="text-xs text-[#A7AAAD] line-clamp-1 max-w-md mt-0.5">
                      {svc.summary || 'No summary provided.'}
                    </p>
                    <div className="text-[10px] text-[#A7AAAD]/70 mt-1">
                      {svc.items?.length || 0} checklist items
                    </div>
                  </div>
                </div>

                {/* Right controls & Toggles */}
                <div className="flex flex-wrap items-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/5">
                  {/* Active Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggle(svc, 'active')}
                    className={`px-3 py-1 text-[10px] font-semibold tracking-wider uppercase rounded-full border cursor-pointer transition-colors ${
                      svc.active
                        ? 'bg-[#25D366]/10 text-[#25D366] border-[#25D366]/30'
                        : 'bg-white/5 text-[#A7AAAD] border-white/10'
                    }`}
                  >
                    {svc.active ? '● Active' : '○ Deactivated'}
                  </button>

                  {/* Catalogue Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggle(svc, 'visibleInCatalogue')}
                    className={`px-3 py-1 text-[10px] font-semibold tracking-wider uppercase rounded-full border cursor-pointer transition-colors ${
                      svc.visibleInCatalogue
                        ? 'bg-[#B88952]/10 text-[#B88952] border-[#B88952]/30'
                        : 'bg-white/5 text-[#A7AAAD]/50 border-white/10 line-through'
                    }`}
                  >
                    Catalogue
                  </button>

                  {/* Booking Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggle(svc, 'selectableInBooking')}
                    className={`px-3 py-1 text-[10px] font-semibold tracking-wider uppercase rounded-full border cursor-pointer transition-colors ${
                      svc.selectableInBooking
                        ? 'bg-[#60A5FA]/10 text-[#60A5FA] border-[#60A5FA]/30'
                        : 'bg-white/5 text-[#A7AAAD]/50 border-white/10 line-through'
                    }`}
                  >
                    Booking
                  </button>

                  <button
                    type="button"
                    onClick={() => openEdit(svc)}
                    className="px-4 py-1 text-xs font-semibold uppercase tracking-wider text-[#F2F0EA] bg-white/5 hover:bg-[#B88952] hover:text-[#0A0C0D] border border-white/10 rounded-lg cursor-pointer transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Manager Section */}
      <div className="rounded-xl border border-white/8 bg-[#111315] p-6 space-y-4">
        <h2 className="text-sm font-semibold tracking-wider uppercase text-[#F2F0EA]">
          Service Categories
        </h2>

        <form onSubmit={handleAddCategory} className="flex gap-3 max-w-md">
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="New category name..."
            className="flex-1 bg-[#0A0C0D] border border-white/10 rounded-lg px-3 py-2 text-xs text-[#F2F0EA] focus:border-[#B88952] focus:outline-none"
          />
          <button
            type="submit"
            disabled={!newCatName.trim() || isCreatingCat}
            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#0A0C0D] bg-[#B88952] hover:bg-[#caa066] disabled:opacity-50 rounded-lg cursor-pointer"
          >
            {isCreatingCat ? 'Adding…' : '+ Add'}
          </button>
        </form>

        {catError && <p className="text-xs text-red-400">{catError}</p>}

        <div className="flex flex-wrap gap-2 pt-2">
          {categories.map((cat) => (
            <span
              key={cat.id}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-[#0A0C0D] text-xs text-[#F2F0EA]"
            >
              {cat.name}
            </span>
          ))}
        </div>
      </div>

      {/* Edit / Create Service Modal */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#040404]/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0D0F12] border border-white/10 rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-5 my-auto max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-[#F2F0EA] uppercase">
              {editingService.id ? `Edit: ${editingService.title}` : 'Add New Service'}
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[#A7AAAD] uppercase tracking-wider mb-1">
                  Service Title *
                </label>
                <input
                  type="text"
                  value={editingService.title || ''}
                  onChange={(e) =>
                    setEditingService({ ...editingService, title: e.target.value })
                  }
                  placeholder="e.g. Performance Exhaust Tuning"
                  className="w-full bg-[#0A0C0D] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-[#F2F0EA] focus:border-[#B88952] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#A7AAAD] uppercase tracking-wider mb-1">
                  Summary
                </label>
                <textarea
                  rows={2}
                  value={editingService.summary || ''}
                  onChange={(e) =>
                    setEditingService({ ...editingService, summary: e.target.value })
                  }
                  placeholder="Brief description of the service..."
                  className="w-full bg-[#0A0C0D] border border-white/10 rounded-lg px-3 py-2 text-xs text-[#F2F0EA] focus:border-[#B88952] focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-[#A7AAAD] uppercase tracking-wider mb-1">
                  Included Items / Tasks (One per line)
                </label>
                <textarea
                  rows={5}
                  value={itemsText}
                  onChange={(e) => setItemsText(e.target.value)}
                  placeholder="OBD Diagnostic scan&#10;Filter cleaning&#10;Fluid top-up"
                  className="w-full bg-[#0A0C0D] border border-white/10 rounded-lg px-3 py-2 text-xs text-[#F2F0EA] font-mono focus:border-[#B88952] focus:outline-none resize-none"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#A7AAAD] uppercase tracking-wider mb-1">
                    Linked Media Asset
                  </label>
                  <select
                    value={editingService.mediaAssetId || ''}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        mediaAssetId: e.target.value || null,
                      })
                    }
                    className="w-full bg-[#0A0C0D] border border-white/10 rounded-lg px-3 py-2 text-xs text-[#F2F0EA] focus:border-[#B88952] focus:outline-none cursor-pointer"
                  >
                    <option value="">(None / Seed Default Image)</option>
                    {mediaAssets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.filename} ({asset.source})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#A7AAAD] uppercase tracking-wider mb-1">
                    Category (Optional)
                  </label>
                  <select
                    value={editingService.categoryId || ''}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        categoryId: e.target.value || null,
                      })
                    }
                    className="w-full bg-[#0A0C0D] border border-white/10 rounded-lg px-3 py-2 text-xs text-[#F2F0EA] focus:border-[#B88952] focus:outline-none cursor-pointer"
                  >
                    <option value="">(None / Standalone)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-white/5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingService.active ?? true}
                    onChange={(e) =>
                      setEditingService({ ...editingService, active: e.target.checked })
                    }
                    className="accent-[#B88952] cursor-pointer"
                  />
                  <span className="text-[#F2F0EA]">Active Status</span>
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
                    className="accent-[#B88952] cursor-pointer"
                  />
                  <span className="text-[#F2F0EA]">Show in Catalogue</span>
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
                    className="accent-[#B88952] cursor-pointer"
                  />
                  <span className="text-[#F2F0EA]">Selectable in Booking Form</span>
                </label>
              </div>
            </div>

            {saveError && <p className="text-xs text-red-400">{saveError}</p>}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/8">
              <button
                type="button"
                onClick={() => setEditingService(null)}
                className="px-4 py-2 text-xs font-semibold text-[#A7AAAD] hover:text-[#F2F0EA] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveService}
                disabled={isSaving || !editingService.title?.trim()}
                className="px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#0A0C0D] bg-[#B88952] hover:bg-[#caa066] disabled:opacity-50 rounded-lg cursor-pointer transition-colors"
              >
                {isSaving ? 'Saving…' : 'Save Service'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
