import {Check, CheckCircle2, Copy, RefreshCw, Trash2, Upload, X} from 'lucide-react';
import {useMemo, useState} from 'react';
import {useImageUploadState} from '../../hooks/useImageUpload.ts';
import {
  deleteMediaFile,
  replaceMediaFile,
  saveSettingsSection,
  uploadMediaFile,
} from '../../lib/api.ts';
import type {AdminDashboardData, MediaItem} from '../../types/portfolio.ts';

interface AdminMediaTabProps {
  dashboard: AdminDashboardData;
  onUpdated: (data: AdminDashboardData) => void;
  onNotify: (type: 'success' | 'error', message: string) => void;
}

export function AdminMediaTab({dashboard, onUpdated, onNotify}: AdminMediaTabProps) {
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [uploadTag, setUploadTag] = useState<MediaItem['sectionTag']>('general');
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);
  const uploadState = useImageUploadState();

  const filteredMedia = useMemo(() => {
    if (tagFilter === 'all') return dashboard.media;
    return dashboard.media.filter((m) => m.sectionTag === tagFilter);
  }, [dashboard.media, tagFilter]);

  const executeUpload = async (file: File) => {
    uploadState.startUpload('library');
    try {
      const res = await uploadMediaFile(file, uploadTag, (percent, stage) =>
        uploadState.updateProgress('library', percent, stage)
      );
      onUpdated(res.dashboard);
      uploadState.finishSuccess(
        'library',
        `Saved "${res.media.originalName}" permanently to cloud storage.`
      );
      onNotify('success', 'Image uploaded to persistent cloud storage.');
    } catch (err) {
      let msg = err instanceof Error ? err.message : 'Upload failed.';
      try {
        const parsed = JSON.parse(msg) as {error?: string};
        if (parsed?.error) msg = parsed.error;
      } catch {
        // plain error text
      }
      uploadState.finishError('library', msg, file);
      onNotify('error', msg);
    }
  };

  const handleReplace = async (id: string, file?: File) => {
    if (!file) return;
    setReplacingId(id);
    uploadState.startUpload(`replace-${id}`);
    try {
      const res = await replaceMediaFile(id, file, (percent, stage) =>
        uploadState.updateProgress(`replace-${id}`, percent, stage)
      );
      onUpdated(res.dashboard);
      uploadState.finishSuccess(`replace-${id}`, 'Replacement image saved across all linked sections.');
      onNotify('success', 'Image replaced across all linked sections.');
    } catch (err) {
      let msg = err instanceof Error ? err.message : 'Replace failed.';
      try {
        const parsed = JSON.parse(msg) as {error?: string};
        if (parsed?.error) msg = parsed.error;
      } catch {
        // plain error text
      }
      uploadState.finishError(`replace-${id}`, msg, file);
      onNotify('error', msg);
    } finally {
      setReplacingId(null);
    }
  };

  const handleAssignToSlot = async (
    url: string,
    slot: 'profileImage' | 'aboutImage' | 'heroBgImage',
    label: string
  ) => {
    try {
      const updated = await saveSettingsSection('profile', {
        ...dashboard.profile,
        [slot]: url,
      });
      onUpdated(updated);
      onNotify('success', `Assigned image to ${label}.`);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Assignment failed.');
    }
  };

  const handleCopy = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      onNotify('error', 'Failed to copy URL.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const next = await deleteMediaFile(deleteTarget.id);
      onUpdated(next);
      onNotify('success', `Deleted "${deleteTarget.originalName}".`);
      setDeleteTarget(null);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Delete failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Bar */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#11131B] p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#F5F5F7]">Media Library</h2>
            <p className="mt-1 text-xs text-[#9CA3AF]">
              Persistent cloud image storage for profile, hero, about, and project showcases (JPG, PNG, WebP · max 10 MB).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={uploadTag}
              onChange={(e) => setUploadTag(e.target.value as MediaItem['sectionTag'])}
              className="rounded-xl border border-white/[0.1] bg-[#08090D] px-3 py-2 text-xs text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
              aria-label="Target section tag"
            >
              <option value="general">Tag: General</option>
              <option value="profile">Tag: Profile</option>
              <option value="hero">Tag: Hero</option>
              <option value="about">Tag: About</option>
              <option value="project">Tag: Project</option>
            </select>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] px-4 py-2 text-xs font-semibold text-white hover:opacity-95">
              <Upload className="h-4 w-4" aria-hidden="true" />
              <span>
                {uploadState.job.uploading && uploadState.job.slotKey === 'library'
                  ? 'Uploading...'
                  : 'Select Image'}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  uploadState.stageFile('library', f);
                }}
              />
            </label>
          </div>
        </div>

        {/* Staged Preview Before Saving */}
        {uploadState.staged?.slotKey === 'library' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[#8B5CF6]/40 bg-[#08090D] p-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-white/[0.08] bg-[#11131B]">
                <img
                  src={uploadState.staged.previewUrl}
                  alt="Upload preview"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#F5F5F7] truncate">
                  {uploadState.staged.file.name}
                </p>
                <p className="text-xs text-[#9CA3AF]">
                  {Math.round(uploadState.staged.file.size / 1024)} KB · Target tag: {uploadTag}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={uploadState.job.uploading}
                onClick={() => executeUpload(uploadState.staged!.file)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] px-4 py-2 text-xs font-semibold text-white hover:opacity-95 disabled:opacity-60"
              >
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{uploadState.job.uploading ? 'Uploading...' : 'Confirm & Upload'}</span>
              </button>
              <button
                type="button"
                disabled={uploadState.job.uploading}
                onClick={uploadState.cancelStaged}
                className="rounded-xl border border-white/[0.1] px-3 py-2 text-xs text-[#9CA3AF] hover:text-[#F5F5F7]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {uploadState.job.uploading && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
              <span>{uploadState.job.stage}</span>
              <span className="font-mono-tabular text-[#A855F7]">{uploadState.job.progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] transition-all duration-200"
                style={{width: `${uploadState.job.progress}%`}}
              />
            </div>
          </div>
        )}

        {/* Success Message */}
        {!uploadState.job.uploading && uploadState.job.successMessage && (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-300">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{uploadState.job.successMessage}</span>
            </span>
            <button
              type="button"
              onClick={uploadState.clearFeedback}
              className="text-emerald-200/70 hover:text-emerald-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Error Message + Retry */}
        {!uploadState.job.uploading && uploadState.job.error && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-xs text-red-200">
            <span>{uploadState.job.error}</span>
            {uploadState.job.failedFile && (
              <button
                type="button"
                onClick={() => {
                  if (uploadState.job.slotKey.startsWith('replace-')) {
                    const targetId = uploadState.job.slotKey.replace('replace-', '');
                    handleReplace(targetId, uploadState.job.failedFile!);
                  } else {
                    executeUpload(uploadState.job.failedFile!);
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/40 bg-red-500/20 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500/30"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Retry Upload</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#11131B] p-1 w-fit">
        {(['all', 'profile', 'about', 'hero', 'project', 'general'] as const).map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setTagFilter(tag)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              tagFilter === tag
                ? 'bg-[#8B5CF6] text-white'
                : 'text-[#9CA3AF] hover:text-[#F5F5F7]'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Media Grid */}
      {filteredMedia.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#11131B]/50 p-12 text-center text-sm text-[#9CA3AF]">
          No images in this category yet. Upload an image above to store it persistently.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMedia.map((item) => {
            const isProfile = dashboard.profile.profileImage === item.url;
            const isAbout = dashboard.profile.aboutImage === item.url;
            const isHeroBg = dashboard.profile.heroBgImage === item.url;

            return (
              <div
                key={item.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11131B]"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#08090D]">
                  <img
                    src={item.url}
                    alt={item.originalName}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#F5F5F7] truncate">
                        {item.originalName}
                      </p>
                      <p className="mt-0.5 font-mono-tabular text-[11px] text-[#9CA3AF]">
                        {item.sectionTag} · {Math.round(item.sizeBytes / 1024)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.id, item.url)}
                      title="Copy URL"
                      className="rounded-lg border border-white/[0.08] bg-[#08090D] p-1.5 text-[#9CA3AF] hover:text-[#F5F5F7]"
                    >
                      {copiedId === item.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Quick Slot Assignment */}
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => handleAssignToSlot(item.url, 'profileImage', 'Profile Picture')}
                      className={`rounded-md border px-2 py-1 transition-colors ${
                        isProfile
                          ? 'border-[#8B5CF6] bg-[#8B5CF6]/20 text-[#F5F5F7]'
                          : 'border-white/[0.08] bg-[#08090D] text-[#9CA3AF] hover:text-[#F5F5F7]'
                      }`}
                    >
                      {isProfile ? 'Active Profile' : 'Set Profile'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAssignToSlot(item.url, 'aboutImage', 'About Section')}
                      className={`rounded-md border px-2 py-1 transition-colors ${
                        isAbout
                          ? 'border-[#8B5CF6] bg-[#8B5CF6]/20 text-[#F5F5F7]'
                          : 'border-white/[0.08] bg-[#08090D] text-[#9CA3AF] hover:text-[#F5F5F7]'
                      }`}
                    >
                      {isAbout ? 'Active About' : 'Set About'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAssignToSlot(item.url, 'heroBgImage', 'Hero Visual')}
                      className={`rounded-md border px-2 py-1 transition-colors ${
                        isHeroBg
                          ? 'border-[#8B5CF6] bg-[#8B5CF6]/20 text-[#F5F5F7]'
                          : 'border-white/[0.08] bg-[#08090D] text-[#9CA3AF] hover:text-[#F5F5F7]'
                      }`}
                    >
                      {isHeroBg ? 'Active Hero Bg' : 'Set Hero Bg'}
                    </button>
                  </div>

                  {/* Replace & Delete */}
                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-[#A855F7] hover:underline">
                      <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{replacingId === item.id ? 'Replacing...' : 'Replace File'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          e.target.value = '';
                          handleReplace(item.id, f);
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      className="inline-flex items-center gap-1 text-xs text-[#9CA3AF] hover:text-red-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#11131B] p-6">
            <h3 className="font-display text-lg font-bold text-[#F5F5F7]">Delete Media Asset?</h3>
            <p className="mt-2 text-sm text-[#9CA3AF]">
              Deleting <span className="font-medium text-[#F5F5F7]">{deleteTarget.originalName}</span>{' '}
              will permanently remove it and clear any section using it.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-white/[0.1] px-4 py-2 text-sm text-[#9CA3AF]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
