import {Plus, Save, Trash2, Upload} from 'lucide-react';
import {useEffect, useState} from 'react';
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
  const [uploadingField, setUploadingField] = useState<string>('');

  useEffect(() => {
    setForm(dashboard.profile);
    onDirtyChange?.(false);
  }, [dashboard.profile, onDirtyChange]);

  useEffect(() => {
    const isDirty = JSON.stringify(form) !== JSON.stringify(dashboard.profile);
    onDirtyChange?.(isDirty);
  }, [form, dashboard.profile, onDirtyChange]);

  const handleImageUpload = async (
    field: 'profileImage' | 'aboutImage' | 'heroBgImage',
    sectionTag: 'profile' | 'about' | 'hero',
    file?: File
  ) => {
    if (!file) return;
    setUploadingField(field);
    try {
      const {media, dashboard: nextDashboard} = await uploadMediaFile(file, sectionTag);
      const nextForm = {...form, [field]: media.url};
      setForm(nextForm);
      const saved = await saveSettingsSection('profile', nextForm);
      onUpdated(saved ?? nextDashboard);
      onNotify('success', 'Image uploaded and saved to profile.');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploadingField('');
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
          Upload, replace, pick from your Media Library, or clear images for key portfolio slots.
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
            return (
              <div
                key={slot.field}
                className="flex flex-col rounded-xl border border-white/[0.08] bg-[#08090D] p-4"
              >
                <span className="text-xs font-medium text-[#F5F5F7] mb-3">{slot.label}</span>
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-white/[0.06] bg-[#11131B]">
                  {url ? (
                    <img
                      src={url}
                      alt={slot.label}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-[#9CA3AF]">
                      No image selected
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#8B5CF6]/40 bg-[#8B5CF6]/15 px-3 py-1.5 text-xs font-medium text-[#F5F5F7] hover:bg-[#8B5CF6]/25">
                    <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      {uploadingField === slot.field ? 'Uploading...' : url ? 'Replace' : 'Upload'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(slot.field, slot.tag, e.target.files?.[0])}
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
