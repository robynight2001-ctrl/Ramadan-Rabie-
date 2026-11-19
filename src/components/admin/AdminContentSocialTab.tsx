import {Save} from 'lucide-react';
import {useEffect, useState} from 'react';
import {saveSettingsSection} from '../../lib/api.ts';
import type {
  AdminDashboardData,
  ContentSettings,
  GeneralSettings,
  SocialSettings,
} from '../../types/portfolio.ts';

interface TabSharedProps {
  dashboard: AdminDashboardData;
  onUpdated: (data: AdminDashboardData) => void;
  onNotify: (type: 'success' | 'error', message: string) => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export function AdminSocialTab({dashboard, onUpdated, onNotify, onDirtyChange}: TabSharedProps) {
  const [form, setForm] = useState<SocialSettings>(dashboard.social);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(dashboard.social);
    onDirtyChange?.(false);
  }, [dashboard.social, onDirtyChange]);

  useEffect(() => {
    onDirtyChange?.(JSON.stringify(form) !== JSON.stringify(dashboard.social));
  }, [form, dashboard.social, onDirtyChange]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await saveSettingsSection('social', form);
      onUpdated(updated);
      onNotify('success', 'Social links and contact channels saved.');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="rounded-2xl border border-white/[0.08] bg-[#11131B] p-6 space-y-5">
      <div>
        <h2 className="font-display text-lg font-semibold text-[#F5F5F7]">Social Media & Direct Contact</h2>
        <p className="mt-1 text-xs text-[#9CA3AF]">
          Links edited here update the Contact section, Footer, and Floating WhatsApp button instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">Instagram URL</label>
          <input
            type="url"
            value={form.instagramUrl}
            onChange={(e) => setForm({...form, instagramUrl: e.target.value})}
            className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-4 py-2.5 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">Facebook URL</label>
          <input
            type="url"
            value={form.facebookUrl}
            onChange={(e) => setForm({...form, facebookUrl: e.target.value})}
            className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-4 py-2.5 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">
            WhatsApp Display Number
          </label>
          <input
            type="text"
            value={form.whatsappNumber}
            onChange={(e) => setForm({...form, whatsappNumber: e.target.value})}
            className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-4 py-2.5 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">
            WhatsApp Direct Link
          </label>
          <input
            type="url"
            value={form.whatsappLink}
            onChange={(e) => setForm({...form, whatsappLink: e.target.value})}
            className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-4 py-2.5 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">
          Email Address (Optional)
        </label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({...form, email: e.target.value})}
          placeholder="hello@yourdomain.com"
          className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-4 py-2.5 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] px-6 py-2.5 text-sm font-semibold text-white"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>
    </form>
  );
}

export function AdminContentTab({dashboard, onUpdated, onNotify, onDirtyChange}: TabSharedProps) {
  const [form, setForm] = useState<ContentSettings>(dashboard.content);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(dashboard.content);
    onDirtyChange?.(false);
  }, [dashboard.content, onDirtyChange]);

  useEffect(() => {
    onDirtyChange?.(JSON.stringify(form) !== JSON.stringify(dashboard.content));
  }, [form, dashboard.content, onDirtyChange]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await saveSettingsSection('content', form);
      onUpdated(updated);
      onNotify('success', 'Website content updated.');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Navigation Labels */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#11131B] p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold text-[#F5F5F7]">Navigation Labels</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {(['home', 'about', 'services', 'projects', 'contact'] as const).map((key) => (
            <div key={key}>
              <label className="block text-xs capitalize text-[#9CA3AF] mb-1">{key}</label>
              <input
                type="text"
                value={form.navLabels[key]}
                onChange={(e) =>
                  setForm({
                    ...form,
                    navLabels: {...form.navLabels, [key]: e.target.value},
                  })
                }
                className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-3 py-2 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Section Headings */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#11131B] p-6 space-y-5">
        <h2 className="font-display text-lg font-semibold text-[#F5F5F7]">Section Copy</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#9CA3AF] mb-1">Services Section Title</label>
            <input
              type="text"
              value={form.servicesTitle}
              onChange={(e) => setForm({...form, servicesTitle: e.target.value})}
              className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-3.5 py-2.5 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-[#9CA3AF] mb-1">Skills Section Title</label>
            <input
              type="text"
              value={form.skillsTitle}
              onChange={(e) => setForm({...form, skillsTitle: e.target.value})}
              className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-3.5 py-2.5 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-[#9CA3AF] mb-1">Services Subtitle</label>
          <textarea
            rows={2}
            value={form.servicesSubtitle}
            onChange={(e) => setForm({...form, servicesSubtitle: e.target.value})}
            className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-3.5 py-2.5 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#9CA3AF] mb-1">Projects Section Title</label>
            <input
              type="text"
              value={form.projectsTitle}
              onChange={(e) => setForm({...form, projectsTitle: e.target.value})}
              className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-3.5 py-2.5 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-[#9CA3AF] mb-1">Projects Subtitle</label>
            <input
              type="text"
              value={form.projectsSubtitle}
              onChange={(e) => setForm({...form, projectsSubtitle: e.target.value})}
              className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-3.5 py-2.5 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-[#9CA3AF] mb-1">Contact Headline</label>
          <input
            type="text"
            value={form.contactHeadline}
            onChange={(e) => setForm({...form, contactHeadline: e.target.value})}
            className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-3.5 py-2.5 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs text-[#9CA3AF] mb-1">Contact Description</label>
          <textarea
            rows={2}
            value={form.contactDescription}
            onChange={(e) => setForm({...form, contactDescription: e.target.value})}
            className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-3.5 py-2.5 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#9CA3AF] mb-1">Footer Bio</label>
            <input
              type="text"
              value={form.footerBio}
              onChange={(e) => setForm({...form, footerBio: e.target.value})}
              className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-3.5 py-2.5 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-[#9CA3AF] mb-1">Footer Copyright Name</label>
            <input
              type="text"
              value={form.footerCopyrightName}
              onChange={(e) => setForm({...form, footerCopyrightName: e.target.value})}
              className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-3.5 py-2.5 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
            />
          </div>
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm text-[#F5F5F7]">
          <input
            type="checkbox"
            checked={form.showLoadingScreen}
            onChange={(e) => setForm({...form, showLoadingScreen: e.target.checked})}
            className="h-4 w-4 accent-[#8B5CF6]"
          />
          <span>Show cinematic intro loading screen on first visit</span>
        </label>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] px-6 py-2.5 text-sm font-semibold text-white"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>
    </form>
  );
}

export function AdminGeneralTab({dashboard, onUpdated, onNotify, onDirtyChange}: TabSharedProps) {
  const [form, setForm] = useState<GeneralSettings>(dashboard.general);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(dashboard.general);
    onDirtyChange?.(false);
  }, [dashboard.general, onDirtyChange]);

  useEffect(() => {
    onDirtyChange?.(JSON.stringify(form) !== JSON.stringify(dashboard.general));
  }, [form, dashboard.general, onDirtyChange]);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await saveSettingsSection('general', form);
      onUpdated(updated);
      onNotify('success', 'General settings saved.');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSaveGeneral}
        className="rounded-2xl border border-white/[0.08] bg-[#11131B] p-6 space-y-5"
      >
        <h2 className="font-display text-lg font-semibold text-[#F5F5F7]">
          SEO & Interactive Experience
        </h2>

        <div>
          <label className="block text-xs text-[#9CA3AF] mb-1.5">Browser Site Title</label>
          <input
            type="text"
            value={form.siteTitle}
            onChange={(e) => setForm({...form, siteTitle: e.target.value})}
            className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-4 py-2.5 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs text-[#9CA3AF] mb-1.5">SEO Meta Description</label>
          <textarea
            rows={2}
            value={form.siteDescription}
            onChange={(e) => setForm({...form, siteDescription: e.target.value})}
            className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-4 py-2.5 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
          />
        </div>

        <div className="space-y-3 pt-2">
          <label className="flex cursor-pointer items-center gap-3 text-sm text-[#F5F5F7]">
            <input
              type="checkbox"
              checked={form.enable3DBackground}
              onChange={(e) => setForm({...form, enable3DBackground: e.target.checked})}
              className="h-4 w-4 accent-[#8B5CF6]"
            />
            <span>Enable interactive 3D Three.js orbital scene in Hero</span>
          </label>

          <label className="flex cursor-pointer items-center gap-3 text-sm text-[#F5F5F7]">
            <input
              type="checkbox"
              checked={form.enableCustomCursor}
              onChange={(e) => setForm({...form, enableCustomCursor: e.target.checked})}
              className="h-4 w-4 accent-[#8B5CF6]"
            />
            <span>Enable custom glowing desktop cursor</span>
          </label>

          <label className="flex cursor-pointer items-center gap-3 text-sm text-[#F5F5F7]">
            <input
              type="checkbox"
              checked={form.enableFloatingWhatsApp}
              onChange={(e) => setForm({...form, enableFloatingWhatsApp: e.target.checked})}
              className="h-4 w-4 accent-[#8B5CF6]"
            />
            <span>Show floating WhatsApp button while scrolling</span>
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] px-6 py-2.5 text-sm font-semibold text-white"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
