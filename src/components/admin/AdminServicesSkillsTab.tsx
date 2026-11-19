import {ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2, X} from 'lucide-react';
import {useState} from 'react';
import {
  createAdminService,
  createAdminSkill,
  deleteAdminService,
  deleteAdminSkill,
  reorderAdminServices,
  reorderAdminSkills,
  updateAdminService,
  updateAdminSkill,
} from '../../lib/api.ts';
import {SERVICE_ICONS, ServiceIcon} from '../../lib/icons.tsx';
import type {AdminDashboardData, ServiceItem, SkillItem} from '../../types/portfolio.ts';

interface AdminServicesSkillsTabProps {
  dashboard: AdminDashboardData;
  onUpdated: (data: AdminDashboardData) => void;
  onNotify: (type: 'success' | 'error', message: string) => void;
}

const ICON_OPTIONS = Object.keys(SERVICE_ICONS);

export function AdminServicesSkillsTab({
  dashboard,
  onUpdated,
  onNotify,
}: AdminServicesSkillsTabProps) {
  // Services state
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [svcTitle, setSvcTitle] = useState('');
  const [svcDesc, setSvcDesc] = useState('');
  const [svcIcon, setSvcIcon] = useState('Code2');
  const [svcActive, setSvcActive] = useState(true);

  // Skills state
  const [editingSkill, setEditingSkill] = useState<SkillItem | null>(null);
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [skName, setSkName] = useState('');
  const [skCategory, setSkCategory] = useState('Frontend');
  const [skProficiency, setSkProficiency] = useState(90);

  const openNewService = () => {
    setEditingService(null);
    setSvcTitle('');
    setSvcDesc('');
    setSvcIcon('Code2');
    setSvcActive(true);
    setShowServiceForm(true);
  };

  const openEditService = (svc: ServiceItem) => {
    setEditingService(svc);
    setSvcTitle(svc.title);
    setSvcDesc(svc.description);
    setSvcIcon(svc.icon);
    setSvcActive(svc.isActive);
    setShowServiceForm(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!svcTitle.trim()) return;
    try {
      if (editingService) {
        const res = await updateAdminService(editingService.id, {
          title: svcTitle,
          description: svcDesc,
          icon: svcIcon,
          isActive: svcActive,
        });
        onUpdated(res.dashboard);
        onNotify('success', 'Service updated.');
      } else {
        const res = await createAdminService({
          title: svcTitle,
          description: svcDesc,
          icon: svcIcon,
          isActive: svcActive,
        });
        onUpdated(res.dashboard);
        onNotify('success', 'Service added.');
      }
      setShowServiceForm(false);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Failed to save service.');
    }
  };

  const handleMoveService = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= dashboard.allServices.length) return;
    const ids = dashboard.allServices.map((s) => s.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(target, 0, moved);
    const next = await reorderAdminServices(ids);
    onUpdated(next);
  };

  const openNewSkill = () => {
    setEditingSkill(null);
    setSkName('');
    setSkCategory('Frontend');
    setSkProficiency(90);
    setShowSkillForm(true);
  };

  const openEditSkill = (sk: SkillItem) => {
    setEditingSkill(sk);
    setSkName(sk.name);
    setSkCategory(sk.category);
    setSkProficiency(sk.proficiency);
    setShowSkillForm(true);
  };

  const handleSaveSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skName.trim()) return;
    try {
      if (editingSkill) {
        const res = await updateAdminSkill(editingSkill.id, {
          name: skName,
          category: skCategory,
          proficiency: skProficiency,
        });
        onUpdated(res.dashboard);
        onNotify('success', 'Skill updated.');
      } else {
        const res = await createAdminSkill({
          name: skName,
          category: skCategory,
          proficiency: skProficiency,
        });
        onUpdated(res.dashboard);
        onNotify('success', 'Skill added.');
      }
      setShowSkillForm(false);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Failed to save skill.');
    }
  };

  const handleMoveSkill = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= dashboard.skills.length) return;
    const ids = dashboard.skills.map((s) => s.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(target, 0, moved);
    const next = await reorderAdminSkills(ids);
    onUpdated(next);
  };

  return (
    <div className="space-y-10">
      {/* Services Manager */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#F5F5F7]">Services</h2>
            <p className="text-xs text-[#9CA3AF]">
              Add, edit, toggle visibility, or reorder the services shown on your portfolio.
            </p>
          </div>
          <button
            type="button"
            onClick={openNewService}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] px-4 py-2 text-xs font-semibold text-white whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Add Service</span>
          </button>
        </div>

        {showServiceForm && (
          <form
            onSubmit={handleSaveService}
            className="rounded-2xl border border-[#8B5CF6]/40 bg-[#11131B] p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-[#F5F5F7]">
                {editingService ? 'Edit Service' : 'New Service'}
              </h3>
              <button
                type="button"
                onClick={() => setShowServiceForm(false)}
                className="text-[#9CA3AF] hover:text-[#F5F5F7]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#9CA3AF] mb-1">Service Title</label>
                <input
                  type="text"
                  value={svcTitle}
                  onChange={(e) => setSvcTitle(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-3.5 py-2 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-[#9CA3AF] mb-1">Icon</label>
                <select
                  value={svcIcon}
                  onChange={(e) => setSvcIcon(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-3.5 py-2 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
                >
                  {ICON_OPTIONS.map((ic) => (
                    <option key={ic} value={ic}>
                      {ic}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#9CA3AF] mb-1">Description</label>
              <textarea
                rows={2}
                value={svcDesc}
                onChange={(e) => setSvcDesc(e.target.value)}
                className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-3.5 py-2 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[#F5F5F7]">
                <input
                  type="checkbox"
                  checked={svcActive}
                  onChange={(e) => setSvcActive(e.target.checked)}
                  className="h-4 w-4 accent-[#8B5CF6]"
                />
                <span>Visible on public portfolio</span>
              </label>

              <button
                type="submit"
                className="rounded-xl bg-[#8B5CF6] px-5 py-2 text-xs font-semibold text-white hover:bg-[#A855F7]"
              >
                {editingService ? 'Save Service' : 'Create Service'}
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2.5">
          {dashboard.allServices.map((svc, idx) => (
            <div
              key={svc.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-[#11131B] p-4"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#A855F7]">
                  <ServiceIcon name={svc.icon} className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-sm font-semibold text-[#F5F5F7]">
                      {svc.title}
                    </h3>
                    {!svc.isActive && (
                      <span className="text-[11px] font-mono-tabular text-[#9CA3AF]">
                        · Hidden
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-[#9CA3AF] line-clamp-2">{svc.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleMoveService(idx, -1)}
                  disabled={idx === 0}
                  className="rounded-lg border border-white/[0.08] bg-[#08090D] p-2 text-[#9CA3AF] hover:text-[#F5F5F7] disabled:opacity-30"
                  aria-label="Move service up"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveService(idx, 1)}
                  disabled={idx === dashboard.allServices.length - 1}
                  className="rounded-lg border border-white/[0.08] bg-[#08090D] p-2 text-[#9CA3AF] hover:text-[#F5F5F7] disabled:opacity-30"
                  aria-label="Move service down"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const res = await updateAdminService(svc.id, {isActive: !svc.isActive});
                    onUpdated(res.dashboard);
                  }}
                  className="rounded-lg border border-white/[0.08] bg-[#08090D] p-2 text-[#9CA3AF] hover:text-[#F5F5F7]"
                  aria-label="Toggle service visibility"
                >
                  {svc.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => openEditService(svc)}
                  className="rounded-lg border border-white/[0.08] bg-[#08090D] p-2 text-[#9CA3AF] hover:text-[#F5F5F7]"
                  aria-label="Edit service"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const next = await deleteAdminService(svc.id);
                    onUpdated(next);
                    onNotify('success', `Deleted service "${svc.title}".`);
                  }}
                  className="rounded-lg border border-white/[0.08] bg-[#08090D] p-2 text-[#9CA3AF] hover:text-red-300"
                  aria-label="Delete service"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Skills Manager */}
      <section className="space-y-4 border-t border-white/[0.08] pt-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#F5F5F7]">
              Technical Skills
            </h2>
            <p className="text-xs text-[#9CA3AF]">
              Manage your core technologies, categories, and proficiency bars.
            </p>
          </div>
          <button
            type="button"
            onClick={openNewSkill}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] px-4 py-2 text-xs font-semibold text-white whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Add Skill</span>
          </button>
        </div>

        {showSkillForm && (
          <form
            onSubmit={handleSaveSkill}
            className="rounded-2xl border border-[#8B5CF6]/40 bg-[#11131B] p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-[#F5F5F7]">
                {editingSkill ? 'Edit Skill' : 'New Skill'}
              </h3>
              <button
                type="button"
                onClick={() => setShowSkillForm(false)}
                className="text-[#9CA3AF] hover:text-[#F5F5F7]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-[#9CA3AF] mb-1">Skill Name</label>
                <input
                  type="text"
                  value={skName}
                  onChange={(e) => setSkName(e.target.value)}
                  placeholder="e.g. Next.js"
                  className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-3.5 py-2 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-[#9CA3AF] mb-1">Category</label>
                <input
                  type="text"
                  value={skCategory}
                  onChange={(e) => setSkCategory(e.target.value)}
                  placeholder="Frontend / Backend"
                  className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-3.5 py-2 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[#9CA3AF] mb-1">
                  Proficiency ({skProficiency}%)
                </label>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={skProficiency}
                  onChange={(e) => setSkProficiency(Number(e.target.value))}
                  className="w-full accent-[#8B5CF6] mt-2"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-xl bg-[#8B5CF6] px-5 py-2 text-xs font-semibold text-white hover:bg-[#A855F7]"
              >
                {editingSkill ? 'Save Skill' : 'Create Skill'}
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {dashboard.skills.map((sk, idx) => (
            <div
              key={sk.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#11131B] p-4"
            >
              <div className="min-w-0">
                <p className="font-display text-sm font-semibold text-[#F5F5F7] truncate">
                  {sk.name}
                </p>
                <p className="text-xs text-[#9CA3AF]">
                  {sk.category} · <span className="font-mono-tabular">{sk.proficiency}%</span>
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleMoveSkill(idx, -1)}
                  disabled={idx === 0}
                  className="rounded-lg border border-white/[0.08] bg-[#08090D] p-1.5 text-[#9CA3AF] hover:text-[#F5F5F7] disabled:opacity-30"
                  aria-label="Move skill up"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveSkill(idx, 1)}
                  disabled={idx === dashboard.skills.length - 1}
                  className="rounded-lg border border-white/[0.08] bg-[#08090D] p-1.5 text-[#9CA3AF] hover:text-[#F5F5F7] disabled:opacity-30"
                  aria-label="Move skill down"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => openEditSkill(sk)}
                  className="rounded-lg border border-white/[0.08] bg-[#08090D] p-1.5 text-[#9CA3AF] hover:text-[#F5F5F7]"
                  aria-label="Edit skill"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const next = await deleteAdminSkill(sk.id);
                    onUpdated(next);
                    onNotify('success', `Deleted skill "${sk.name}".`);
                  }}
                  className="rounded-lg border border-white/[0.08] bg-[#08090D] p-1.5 text-[#9CA3AF] hover:text-red-300"
                  aria-label="Delete skill"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
