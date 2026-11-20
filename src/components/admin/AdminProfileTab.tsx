import {CheckCircle2, Plus, RefreshCw, Save, Trash2, Upload, X} from 'lucide-react';
import {useEffect, useState} from 'react';
import {useImageUploadState} from '../../hooks/useImageUpload.ts';
import {saveSettingsSection, uploadMediaFile} from '../../lib/api.ts';
import type {AdminDashboardData, ProfileSettings} from '../../types/portfolio.ts';

interface AdminProfileTabProps {
  dashboard: AdminDashboardData;
  onUpdated: (data: AdminDashboardData) => void;
  onNotify: (type: 'success' | 'error', message: string) => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export function AdminProfileTab({
  dashboard,
  onUpdated,
  onNotify,
  onDirtyChange,
}: AdminProfileTabProps) {
  const [form, setForm] = useState<ProfileSettings>(dashboard.profile);
  const [newHighlight, setNewHighlight] = useState('');
  const [saving, setSaving] = useState(false);
  const uploadState = useImageUploadState();

  useEffect(() => {
    setForm(dashboard.profile);
    onDirtyChange?.(false);
  }, [dashboard.profile, onDirtyChange]);

  useEffect(() => {
    const isDirty = JSON.stringify(form) !== JSON.stringify(dashboard.profile);
    onDirtyChange?.(isDirty);
  }, [form, dashboard.profile, onDirtyChange]);

  const executeSlotUpload = async (
    field: 'profileImage' | 'aboutImage' | 'heroBgImage',
    sectionTag: 'profile' | 'about' | 'hero',
    file: File
  ) => {
    uploadState.startUpload(field);
    try {
      const {media, dashboard: nextDashboard} = await uploadMediaFile(
        file,
        sectionTag,
        (percent, stage) => uploadState.updateProgress(field, percent, stage)
      );
      const nextForm = {...form, [field]: media.url};
      setForm(nextForm);
      const saved = await saveSettingsSection('profile', nextForm);
      onUpdated(saved ?? nextDashboard);
      uploadState.finishSuccess(field, 'Image uploaded & saved to cloud database.');
      onNotify('success', 'Image uploaded and saved to profile.');
    } catch (err) {
      let msg = err instanceof Error ? err.message : 'Image upload failed.';
      try {
        const parsed = JSON.parse(msg) as {error?: string};
        if (parsed?.error) msg = parsed.error;
      } catch {
        // plain error text
      }
      uploadState.finishError(field, msg, file);
      onNotify('error', msg);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await saveSettingsSection('profile', form);
      onUpdated(updated);
      onNotify('success', 'Profile settings saved.');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const addHighlight = () => {
    const trimmed = newHighlight.trim();
    if (!trimmed) return;
    setForm((prev) => ({
      ...prev,
      aboutHighlights: [...(prev.aboutHighlights || []), trimmed],
    }));
    setNewHighlight('');
  };

  const removeHighlight = (index: number) => {
    setForm((prev) => ({
      ...prev,
      aboutHighlights: prev.aboutHighlights.filter((_, idx) => idx !== index),
    }));
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Visual Assets Section */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#11131B] p-6">
        <h2 className="font-display text-lg font-semibold text-[#F5F5F7]">Profile & Section Visuals</h2>
        <p className="mt-1 text-xs text-[#9CA3AF]">
          Select JPG, PNG, or WebP images (max 10 MB), preview before saving, and store permanently in Cloud Firestore.
        </p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {(
            [
              {
                field: 'profileImage',
                label: 'Profile Picture',
                tag: 'profile',
              },
              {
                field: 'aboutImage',
                label: 'About Studio Visual',
                tag: 'about',
              },
              {
                field: 'heroBgImage',
                label: 'Hero Background Visual (Optional)',
                tag: 'hero',
              },
            ] as const
          ).map((slot) => {
            const url = form[slot.field];
            const isStagedHere = uploadState.staged?.slotKey === slot.field;
            const isJobHere = uploadState.job.slotKey === slot.field;
            const displayUrl = isStagedHere ? uploadState.staged!.previewUrl : url;

            return (
              <div
                key={slot.field}
                className="flex flex-col rounded-xl border border-white/[0.08] bg-[#08090D] p-4"
              >
                <span className="text-xs font-medium text-[#F5F5F7] mb-3">{slot.label}</span>
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-white/[0.06] bg-[#11131B]">
                  {displayUrl ? (
                    <img
                      src={displayUrl}
                      alt={slot.label}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-[#9CA3AF]">
                      No image selected
                    </div>
                  )}
                  {isStagedHere && (
                    <div className="absolute inset-x-0 bottom-0 bg-[#08090D]/85 px-2.5 py-1.5 text-[11px] text-[#A855F7]">
                      Preview ready ({Math.round(uploadState.staged!.file.size / 1024)} KB)
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {isJobHere && uploadState.job.uploading && (
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-[#9CA3AF]">
                      <span className="truncate">{uploadState.job.stage}</span>
                      <span className="font-mono-tabular text-[#A855F7]">
                        {uploadState.job.progress}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] transition-all duration-200"
                        style={{width: `${uploadState.job.progress}%`}}
                      />
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {isJobHere && !uploadState.job.uploading && uploadState.job.successMessage && (
                  <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>{uploadState.job.successMessage}</span>
                    </span>
                    <button
                      type="button"
                      onClick={uploadState.clearFeedback}
                      aria-label="Dismiss upload confirmation"
                      className="text-emerald-200/70 hover:text-emerald-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {/* Error & Retry */}
                {isJobHere && !uploadState.job.uploading && uploadState.job.error && (
                  <div className="mt-3 rounded-lg border border-red-500/35 bg-red-500/10 p-2.5 text-[11px] text-red-200 space-y-2">
                    <p>{uploadState.job.error}</p>
                    {uploadState.job.failedFile && (
                      <button
                        type="button"
                        onClick={() =>
                          executeSlotUpload(slot.field, slot.tag, uploadState.job.failedFile!)
                        }
                        className="inline-flex items-center gap-1.5 rounded-md border border-red-400/40 bg-red-500/20 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-red-500/30"
                      >
                        <RefreshCw className="h-3 w-3" aria-hidden="true" />
                        <span>Retry Upload</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {isStagedHere ? (
                    <>
                      <button
                        type="button"
                        disabled={uploadState.job.uploading}
                        onClick={() =>
                          executeSlotUpload(slot.field, slot.tag, uploadState.staged!.file)
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-95 disabled:opacity-60"
                      >
                        <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>
                          {isJobHere && uploadState.job.uploading
                            ? 'Uploading...'
                            : 'Save & Upload'}
                        </span>
                      </button>
                      <button
                        type="button"
                        disabled={uploadState.job.uploading}
                        onClick={uploadState.cancelStaged}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/[0.1] px-2.5 py-1.5 text-xs text-[#9CA3AF] hover:text-[#F5F5F7]"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#8B5CF6]/40 bg-[#8B5CF6]/15 px-3 py-1.5 text-xs font-medium text-[#F5F5F7] hover:bg-[#8B5CF6]/25">
                        <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>
                          {isJobHere && uploadState.job.uploading
                            ? 'Uploading...'
                            : url
                            ? 'Replace'
                            : 'Select Image'}
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.target.value = '';
                            uploadState.stageFile(slot.field, f);
                          }}
                        />
                      </label>

                      {url && (
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({...prev, [slot.field]: ''}))}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs text-red-300 hover:bg-red-500/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Remove</span>
                        </button>
                      )}
                    </>
                  )}
                </div>

                {dashboard.media.length > 0 && (
                  <select
                    value={url}
                    onChange={(e) => setForm((prev) => ({...prev, [slot.field]: e.target.value}))}
                    className="mt-2.5 w-full rounded-lg border border-white/[0.08] bg-[#11131B] px-2.5 py-1.5 text-xs text-[#9CA3AF] focus:border-[#8B5CF6] focus:outline-none"
                    aria-label={`Select from media library for ${slot.label}`}
                  >
                    <option value="">-- Choose from Media Library --</option>
                    {dashboard.media.map((m) => (
                      <option key={m.id} value={m.url}>
                        {m.originalName}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Identity & Hero Content */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#11131B] p-6 space-y-5">
        <h2 className="font-display text-lg font-semibold text-[#F5F5F7]">Identity & Hero Section</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
              className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-4 py-2.5 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">
              Professional Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({...form, title: e.target.value})}
              className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-4 py-2.5 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">Hero Headline</label>
          <input
            type="text"
            value={form.heroHeadline}
            onChange={(e) => setForm({...form, heroHeadline: e.target.value})}
            className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-4 py-2.5 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">
            Hero Description
          </label>
          <textarea
            rows={3}
            value={form.heroDescription}
            onChange={(e) => setForm({...form, heroDescription: e.target.value})}
            className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-4 py-2.5 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          <div>
            <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">
              Availability Badge Text
            </label>
            <input
              type="text"
              value={form.availabilityStatus}
              onChange={(e) => setForm({...form, availabilityStatus: e.target.value})}
              className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-4 py-2.5 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
            />
          </div>
          <div className="flex items-end pb-2">
            <label className="inline-flex cursor-pointer items-center gap-3 text-sm text-[#F5F5F7]">
              <input
                type="checkbox"
                checked={form.availabilityActive}
                onChange={(e) => setForm({...form, availabilityActive: e.target.checked})}
                className="h-4 w-4 rounded accent-[#8B5CF6]"
              />
              <span>Show availability badge in Hero</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">
              Primary CTA Label
            </label>
            <input
              type="text"
              value={form.primaryCtaLabel}
              onChange={(e) => setForm({...form, primaryCtaLabel: e.target.value})}
              className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-3.5 py-2 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">
              Primary CTA Destination
            </label>
            <input
              type="text"
              value={form.primaryCtaHref}
              onChange={(e) => setForm({...form, primaryCtaHref: e.target.value})}
              className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-3.5 py-2 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">
              Secondary CTA Label
            </label>
            <input
              type="text"
              value={form.secondaryCtaLabel}
              onChange={(e) => setForm({...form, secondaryCtaLabel: e.target.value})}
              className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-3.5 py-2 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">
              Secondary CTA Destination
            </label>
            <input
              type="text"
              value={form.secondaryCtaHref}
              onChange={(e) => setForm({...form, secondaryCtaHref: e.target.value})}
              className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-3.5 py-2 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* About Me Content */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#11131B] p-6 space-y-5">
        <h2 className="font-display text-lg font-semibold text-[#F5F5F7]">About Me Section</h2>

        <div>
          <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">
            About Section Heading
          </label>
          <input
            type="text"
            value={form.aboutHeading}
            onChange={(e) => setForm({...form, aboutHeading: e.target.value})}
            className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-4 py-2.5 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">About Bio</label>
          <textarea
            rows={4}
            value={form.aboutText}
            onChange={(e) => setForm({...form, aboutText: e.target.value})}
            className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-4 py-2.5 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#9CA3AF] mb-2">
            Engineering Highlights
          </label>
          <div className="space-y-2 mb-3">
            {(form.aboutHighlights || []).map((item, idx) => (
              <div key={`${item}-${idx}`} className="flex items-center gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const next = [...form.aboutHighlights];
                    next[idx] = e.target.value;
                    setForm({...form, aboutHighlights: next});
                  }}
                  className="flex-1 rounded-lg border border-white/[0.08] bg-[#08090D] px-3 py-2 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeHighlight(idx)}
                  aria-label="Remove highlight"
                  className="rounded-lg border border-white/[0.08] bg-[#08090D] p-2 text-[#9CA3AF] hover:border-red-500/40 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newHighlight}
              onChange={(e) => setNewHighlight(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addHighlight();
                }
              }}
              placeholder="Add new highlight (e.g. Clean architecture)"
              className="flex-1 rounded-lg border border-white/[0.1] bg-[#08090D] px-3 py-2 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
            />
            <button
              type="button"
              onClick={addHighlight}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#8B5CF6]/40 bg-[#8B5CF6]/15 px-3.5 py-2 text-xs font-medium text-[#F5F5F7] hover:bg-[#8B5CF6]/25"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>
    </form>
  );
}
