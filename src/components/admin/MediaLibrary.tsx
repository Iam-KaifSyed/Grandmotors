import { useEffect, useState, useRef } from 'react';
import type { MediaAssetRecord } from '../../lib/mediaStore';
import type { UsageLocationDef } from '../../lib/usageLocations';

function formatBytes(bytes?: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function MediaLibrary() {
  const [assets, setAssets] = useState<MediaAssetRecord[] | null>(null);
  const [usageLocations, setUsageLocations] = useState<UsageLocationDef[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Replace modal state
  const [replacingAsset, setReplacingAsset] = useState<MediaAssetRecord | null>(null);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [replaceError, setReplaceError] = useState<string | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);

  // Delete modal state
  const [deletingAsset, setDeletingAsset] = useState<MediaAssetRecord | null>(null);
  const [confirmName, setConfirmName] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteUsageConflicts, setDeleteUsageConflicts] = useState<string[] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Assign modal state
  const [assigningAsset, setAssigningAsset] = useState<MediaAssetRecord | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [assignError, setAssignError] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [mediaRes, locsRes] = await Promise.all([
        fetch(`/api/admin/cms/media${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`, {
          headers: { Accept: 'application/json' },
        }),
        fetch('/api/admin/cms/usage-locations', {
          headers: { Accept: 'application/json' },
        }),
      ]);

      if (mediaRes.status === 401) {
        window.location.href = '/admin/login';
        return;
      }

      if (!mediaRes.ok) {
        const d = await mediaRes.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to load media assets');
      }

      const mediaData = await mediaRes.json();
      setAssets(mediaData.assets || []);

      if (locsRes.ok) {
        const locsData = await locsRes.json();
        setUsageLocations(locsData.locations || []);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load media');
      setAssets(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
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

      if (fileInputRef.current) fileInputRef.current.value = '';
      loadData();
    } catch (err: any) {
      setUploadError(err?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReplace = async () => {
    if (!replacingAsset || !replaceFile) return;
    setIsReplacing(true);
    setReplaceError(null);

    const fd = new FormData();
    fd.append('file', replaceFile);

    try {
      const res = await fetch(`/api/admin/cms/media/${replacingAsset.id}/replace`, {
        method: 'POST',
        body: fd,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Replace failed');
      }

      setReplacingAsset(null);
      setReplaceFile(null);
      loadData();
    } catch (err: any) {
      setReplaceError(err?.message || 'Replace failed');
    } finally {
      setIsReplacing(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAsset) return;
    setIsDeleting(true);
    setDeleteError(null);
    setDeleteUsageConflicts(null);

    try {
      const res = await fetch(`/api/admin/cms/media/${deletingAsset.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmFilename: confirmName }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.usageLocations) {
          setDeleteUsageConflicts(data.usageLocations);
        }
        throw new Error(data.error || 'Delete failed');
      }

      setDeletingAsset(null);
      setConfirmName('');
      loadData();
    } catch (err: any) {
      setDeleteError(err?.message || 'Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAssign = async () => {
    if (!assigningAsset || !selectedLocation) return;
    setIsAssigning(true);
    setAssignError(null);

    try {
      const res = await fetch('/api/admin/cms/media/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usageLocation: selectedLocation,
          mediaAssetId: assigningAsset.id,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Assignment failed');
      }

      setAssigningAsset(null);
      setSelectedLocation('');
      loadData();
    } catch (err: any) {
      setAssignError(err?.message || 'Assignment failed');
    } finally {
      setIsAssigning(false);
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
              Content Management
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.02em] text-[#F2F0EA] uppercase">
            Media Library
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUpload}
            accept=".jpg,.jpeg,.png,.webp"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold tracking-[0.14em] uppercase text-[#0A0C0D] bg-[#B88952] hover:bg-[#caa066] disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
          >
            {isUploading ? 'Uploading…' : '+ Upload Image'}
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs">
          {uploadError}
        </div>
      )}

      {/* Filter and Search */}
      <div className="rounded-xl border border-white/8 bg-[#111315] p-4 sm:p-5">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by filename or usage location..."
          className="w-full bg-[#0A0C0D] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-[#F2F0EA] placeholder-[#A7AAAD]/40 focus:border-[#B88952] focus:outline-none transition-colors"
        />
      </div>

      {/* Media Grid */}
      <div className="rounded-xl border border-white/8 bg-[#111315] p-6">
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
        ) : !assets || assets.length === 0 ? (
          <div className="py-16 px-6 text-center text-sm text-[#A7AAAD]">
            No media assets found. Upload images to build your catalogue library.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="group relative flex flex-col rounded-xl border border-white/8 bg-[#0A0C0D] overflow-hidden hover:border-[#B88952]/40 transition-colors"
              >
                {/* Preview */}
                <div className="relative aspect-[16/10] bg-[#111315] overflow-hidden">
                  <img
                    src={asset.url}
                    alt={asset.filename}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                    }}
                  />
                  <span className="absolute top-2 right-2 px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase rounded bg-[#0A0C0D]/80 border border-white/10 text-[#A7AAAD] backdrop-blur-sm">
                    {asset.source}
                  </span>
                </div>

                {/* Info */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3
                      className="text-xs font-semibold text-[#F2F0EA] truncate"
                      title={asset.filename}
                    >
                      {asset.filename}
                    </h3>
                    <p className="text-[11px] text-[#A7AAAD]/70 font-mono mt-1">
                      {asset.width && asset.height
                        ? `${asset.width} × ${asset.height} px • `
                        : ''}
                      {formatBytes(asset.byteSize)}
                    </p>
                  </div>

                  {/* Usage badges */}
                  <div>
                    <span className="text-[9px] font-bold tracking-wider uppercase text-[#B88952] block mb-1">
                      Assigned Locations
                    </span>
                    {asset.usageLocations && asset.usageLocations.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {asset.usageLocations.map((loc) => (
                          <span
                            key={loc}
                            className="px-2 py-0.5 text-[10px] rounded bg-[#B88952]/10 border border-[#B88952]/30 text-[#B88952]"
                          >
                            {loc}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-[#A7AAAD]/40 italic">Unassigned</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAssigningAsset(asset);
                        setSelectedLocation(usageLocations[0]?.key || '');
                        setAssignError(null);
                      }}
                      className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#F2F0EA] bg-white/5 hover:bg-white/10 border border-white/10 rounded cursor-pointer transition-colors"
                    >
                      Assign
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setReplacingAsset(asset);
                          setReplaceFile(null);
                          setReplaceError(null);
                        }}
                        className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#60A5FA] bg-[#60A5FA]/10 hover:bg-[#60A5FA]/20 border border-[#60A5FA]/20 rounded cursor-pointer transition-colors"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeletingAsset(asset);
                          setConfirmName('');
                          setDeleteError(null);
                          setDeleteUsageConflicts(null);
                        }}
                        className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#FF5F5F] bg-[#FF5F5F]/10 hover:bg-[#FF5F5F]/20 border border-[#FF5F5F]/20 rounded cursor-pointer transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Replace Modal */}
      {replacingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#040404]/85 backdrop-blur-md">
          <div className="bg-[#0D0F12] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-[#F2F0EA] uppercase">
              Replace Image: {replacingAsset.filename}
            </h2>
            <p className="text-xs text-[#A7AAAD] leading-relaxed">
              Replacing will update the image binary while retaining all linked usage locations and
              service cards atomically.
            </p>

            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={(e) => setReplaceFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-[#A7AAAD] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#B88952] file:text-[#0A0C0D] file:cursor-pointer"
            />

            {replaceError && <p className="text-xs text-red-400">{replaceError}</p>}

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setReplacingAsset(null)}
                className="px-4 py-2 text-xs font-semibold text-[#A7AAAD] hover:text-[#F2F0EA] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReplace}
                disabled={!replaceFile || isReplacing}
                className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-[#0A0C0D] bg-[#B88952] hover:bg-[#caa066] disabled:opacity-50 rounded-lg cursor-pointer transition-colors"
              >
                {isReplacing ? 'Replacing…' : 'Confirm Replace'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deletingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#040404]/85 backdrop-blur-md">
          <div className="bg-[#0D0F12] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-[#FF5F5F] uppercase">Delete Media Asset</h2>

            {deleteUsageConflicts && deleteUsageConflicts.length > 0 ? (
              <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-lg space-y-2 text-xs text-red-200">
                <p className="font-bold">Cannot delete asset: it is currently in use by:</p>
                <ul className="list-disc list-inside space-y-1">
                  {deleteUsageConflicts.map((loc) => (
                    <li key={loc}>{loc}</li>
                  ))}
                </ul>
                <p className="text-[11px] text-red-300/80">
                  Reassign or clear these locations before deleting.
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-[#A7AAAD] leading-relaxed">
                  To prevent accidental deletion, please type the filename{' '}
                  <strong className="text-[#F2F0EA] font-mono">{deletingAsset.filename}</strong>{' '}
                  below to confirm.
                </p>

                <input
                  type="text"
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  placeholder={deletingAsset.filename}
                  className="w-full bg-[#0A0C0D] border border-white/10 rounded-lg px-3 py-2 text-xs text-[#F2F0EA] font-mono focus:border-[#FF5F5F] focus:outline-none"
                />
              </>
            )}

            {deleteError && <p className="text-xs text-red-400">{deleteError}</p>}

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setDeletingAsset(null)}
                className="px-4 py-2 text-xs font-semibold text-[#A7AAAD] hover:text-[#F2F0EA] cursor-pointer"
              >
                Close
              </button>
              {!deleteUsageConflicts && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={confirmName.trim() !== deletingAsset.filename.trim() || isDeleting}
                  className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-[#F2F0EA] bg-[#FF5F5F] hover:bg-[#e04848] disabled:opacity-30 rounded-lg cursor-pointer transition-colors"
                >
                  {isDeleting ? 'Deleting…' : 'Confirm Delete'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assigningAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#040404]/85 backdrop-blur-md">
          <div className="bg-[#0D0F12] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-[#F2F0EA] uppercase">Assign to Usage Location</h2>
            <p className="text-xs text-[#A7AAAD]">
              Select where on the website this image should appear:
            </p>

            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full bg-[#0A0C0D] border border-white/10 rounded-lg px-3 py-2.5 text-xs text-[#F2F0EA] focus:border-[#B88952] focus:outline-none cursor-pointer"
            >
              {usageLocations.map((loc) => (
                <option key={loc.key} value={loc.key}>
                  {loc.name} {loc.recommendedDimensions ? `(${loc.recommendedDimensions})` : ''}
                </option>
              ))}
            </select>

            {assignError && <p className="text-xs text-red-400">{assignError}</p>}

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setAssigningAsset(null)}
                className="px-4 py-2 text-xs font-semibold text-[#A7AAAD] hover:text-[#F2F0EA] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssign}
                disabled={!selectedLocation || isAssigning}
                className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-[#0A0C0D] bg-[#B88952] hover:bg-[#caa066] disabled:opacity-50 rounded-lg cursor-pointer transition-colors"
              >
                {isAssigning ? 'Assigning…' : 'Save Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
