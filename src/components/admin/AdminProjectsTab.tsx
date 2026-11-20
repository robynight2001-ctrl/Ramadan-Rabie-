import {
  ArrowDown,
  ArrowUp,
  Bookmark,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {useMemo, useState} from 'react';
import {useImageUploadState} from '../../hooks/useImageUpload.ts';
import {
  createAdminProject,
  deleteAdminProject,
  reorderAdminProjects,
  updateAdminProject,
  uploadMediaFile,
} from '../../lib/api.ts';
import type {AdminDashboardData, ProjectItem} from '../../types/portfolio.ts';

interface AdminProjectsTabProps {
  dashboard: AdminDashboardData;
  onUpdated: (data: AdminDashboardData) => void;
  onNotify: (type: 'success' | 'error', message: string) => void;
}

interface ProjectFormState {
  title: string;
  clientName: string;
  description: string;
  category: string;
  technologiesText: string;
  coverImage: string;
  liveUrl: string;
  isFeatured: boolean;
  isPublished: boolean;
}

const EMPTY_FORM: ProjectFormState = {
  title: '',
  clientName: '',
  description: '',
  category: 'Web Development',
  technologiesText: '',
  coverImage: '',
  liveUrl: '',
  isFeatured: false,
  isPublished: true,
};

export function AdminProjectsTab({dashboard, onUpdated, onNotify}: AdminProjectsTabProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ProjectFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const uploadState = useImageUploadState();
  const [deleteTarget, setDeleteTarget] = useState<ProjectItem | null>(null);

  const projects = dashboard.allProjects;

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (filter === 'published' && !p.isPublished) return false;
      if (filter === 'draft' && p.isPublished) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [projects, filter, search]);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    uploadState.cancelStaged();
    uploadState.clearFeedback();
    setShowForm(true);
  };

  const openEditForm = (project: ProjectItem) => {
    setEditingId(project.id);
    uploadState.cancelStaged();
    uploadState.clearFeedback();
    setForm({
      title: project.title,
      clientName: project.clientName,
      description: project.description,
      category: project.category,
      technologiesText: project.technologies.join(', '),
      coverImage: project.coverImage,
      liveUrl: project.liveUrl,
      isFeatured: project.isFeatured,
      isPublished: project.isPublished,
    });
    setShowForm(true);
  };

  const executeUploadCover = async (file: File) => {
    uploadState.startUpload('cover');
    try {
      const {media, dashboard: nextDash} = await uploadMediaFile(
        file,
        'project',
        (percent, stage) => uploadState.updateProgress('cover', percent, stage)
      );
      setForm((prev) => ({...prev, coverImage: media.url}));
      onUpdated(nextDash);
      uploadState.finishSuccess('cover', 'Cover image uploaded to cloud storage.');
      onNotify('success', 'Cover image uploaded.');
    } catch (err) {
      let msg = err instanceof Error ? err.message : 'Failed to upload cover image.';
      try {
        const parsed = JSON.parse(msg) as {error?: string};
        if (parsed?.error) msg = parsed.error;
      } catch {
        // plain error
      }
      uploadState.finishError('cover', msg, file);
      onNotify('error', msg);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.liveUrl.trim()) {
      onNotify('error', 'Project title and live website URL are required.');
      return;
    }

    const technologies = form.technologiesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setSaving(true);
    try {
      if (editingId) {
        const res = await updateAdminProject(editingId, {
          title: form.title,
          clientName: form.clientName,
          description: form.description,
          category: form.category,
          technologies,
          coverImage: form.coverImage,
          liveUrl: form.liveUrl,
          isFeatured: form.isFeatured,
          isPublished: form.isPublished,
        });
        onUpdated(res.dashboard);
        onNotify('success', 'Project updated.');
      } else {
        const res = await createAdminProject({
          title: form.title,
          clientName: form.clientName,
          description: form.description,
          category: form.category,
          technologies,
          coverImage: form.coverImage,
          liveUrl: form.liveUrl,
          isFeatured: form.isFeatured,
          isPublished: form.isPublished,
        });
        onUpdated(res.dashboard);
        onNotify('success', 'Project created and added to portfolio.');
      }
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Failed to save project.');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublished = async (project: ProjectItem) => {
    try {
      const res = await updateAdminProject(project.id, {isPublished: !project.isPublished});
      onUpdated(res.dashboard);
      onNotify('success', project.isPublished ? 'Project hidden from public site.' : 'Project published.');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Update failed.');
    }
  };

  const handleToggleFeatured = async (project: ProjectItem) => {
    try {
      const res = await updateAdminProject(project.id, {isFeatured: !project.isFeatured});
      onUpdated(res.dashboard);
      onNotify('success', project.isFeatured ? 'Removed featured highlight.' : 'Project featured.');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Update failed.');
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= projects.length) return;
    const ids = projects.map((p) => p.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(targetIdx, 0, moved);
    try {
      const next = await reorderAdminProjects(ids);
      onUpdated(next);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Reorder failed.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const next = await deleteAdminProject(deleteTarget.id);
      onUpdated(next);
      onNotify('success', `Deleted "${deleteTarget.title}".`);
      setDeleteTarget(null);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Delete failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]"
              aria-hidden="true"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="rounded-xl border border-white/[0.1] bg-[#11131B] pl-9 pr-4 py-2 text-sm text-[#F5F5F7] placeholder-[#9CA3AF]/60 focus:border-[#8B5CF6] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-[#11131B] p-1">
            {(['all', 'published', 'draft'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  filter === tab ? 'bg-[#8B5CF6] text-white' : 'text-[#9CA3AF] hover:text-[#F5F5F7]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] px-5 py-2 text-sm font-semibold text-white hover:opacity-95 whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Add New Project</span>
        </button>
      </div>

      {/* Add / Edit Project Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#8B5CF6]/40 bg-[#11131B] p-6 space-y-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-[#F5F5F7]">
              {editingId ? 'Edit Project' : 'Create New Project'}
            </h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg p-1.5 text-[#9CA3AF] hover:bg-white/[0.05] hover:text-[#F5F5F7]"
              aria-label="Close project form"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">
                Project Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({...form, title: e.target.value})}
                placeholder="e.g. Apex Real Estate Platform"
                className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-4 py-2.5 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">
                Client Name (Optional)
              </label>
              <input
                type="text"
                value={form.clientName}
                onChange={(e) => setForm({...form, clientName: e.target.value})}
                placeholder="e.g. Horizon Group"
                className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-4 py-2.5 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">Category</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({...form, category: e.target.value})}
                placeholder="e.g. E-Commerce, SaaS, Business Website"
                className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-4 py-2.5 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">
                Live Website URL *
              </label>
              <input
                type="url"
                value={form.liveUrl}
                onChange={(e) => setForm({...form, liveUrl: e.target.value})}
                placeholder="https://client-website.com"
                className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-4 py-2.5 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
              placeholder="Describe the project scope, engineering challenges, and business impact..."
              className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-4 py-2.5 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">
              Technologies Used (comma-separated, optional)
            </label>
            <input
              type="text"
              value={form.technologiesText}
              onChange={(e) => setForm({...form, technologiesText: e.target.value})}
              placeholder="React, TypeScript, Tailwind CSS, Node.js"
              className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-4 py-2.5 text-sm text-[#F5F5F7] focus:border-[#8B5CF6] focus:outline-none"
            />
          </div>

          {/* Cover Image Upload / Preview */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center rounded-xl border border-white/[0.08] bg-[#08090D] p-4">
            <div className="relative md:col-span-4 aspect-[16/10] overflow-hidden rounded-lg border border-white/[0.08] bg-[#11131B]">
              {uploadState.staged?.slotKey === 'cover' ? (
                <>
                  <img
                    src={uploadState.staged.previewUrl}
                    alt="Selected cover preview"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-[#08090D]/85 px-2.5 py-1 text-[11px] text-[#A855F7]">
                    Preview ready ({Math.round(uploadState.staged.file.size / 1024)} KB)
                  </div>
                </>
              ) : form.coverImage ? (
                <img
                  src={form.coverImage}
                  alt="Cover preview"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-[#9CA3AF]">
                  Cover preview
                </div>
              )}
            </div>

            <div className="md:col-span-8 space-y-3">
              {uploadState.job.uploading && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
                    <span>{uploadState.job.stage}</span>
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

              {!uploadState.job.uploading && uploadState.job.successMessage && (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
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

              {!uploadState.job.uploading && uploadState.job.error && (
                <div className="rounded-lg border border-red-500/35 bg-red-500/10 p-3 text-xs text-red-200 space-y-2">
                  <p>{uploadState.job.error}</p>
                  {uploadState.job.failedFile && (
                    <button
                      type="button"
                      onClick={() => executeUploadCover(uploadState.job.failedFile!)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-red-400/40 bg-red-500/20 px-3 py-1 text-xs font-medium text-white hover:bg-red-500/30"
                    >
                      <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Retry Upload</span>
                    </button>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                {uploadState.staged?.slotKey === 'cover' ? (
                  <>
                    <button
                      type="button"
                      disabled={uploadState.job.uploading}
                      onClick={() => executeUploadCover(uploadState.staged!.file)}
                      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] px-4 py-2 text-xs font-semibold text-white hover:opacity-95 disabled:opacity-60"
                    >
                      <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        {uploadState.job.uploading ? 'Uploading...' : 'Save & Upload Cover'}
                      </span>
                    </button>
                    <button
                      type="button"
                      disabled={uploadState.job.uploading}
                      onClick={uploadState.cancelStaged}
                      className="rounded-lg border border-white/[0.1] px-3 py-2 text-xs text-[#9CA3AF] hover:text-[#F5F5F7]"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#8B5CF6]/40 bg-[#8B5CF6]/15 px-4 py-2 text-xs font-medium text-[#F5F5F7] hover:bg-[#8B5CF6]/25">
                      <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        {uploadState.job.uploading
                          ? 'Uploading...'
                          : form.coverImage
                          ? 'Replace Cover Image'
                          : 'Select Cover Image'}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          e.target.value = '';
                          uploadState.stageFile('cover', f);
                        }}
                      />
                    </label>

                    {form.coverImage && (
                      <button
                        type="button"
                        onClick={() => setForm({...form, coverImage: ''})}
                        className="rounded-lg border border-white/[0.1] px-3 py-2 text-xs text-[#9CA3AF] hover:text-red-300"
                      >
                        Clear Image
                      </button>
                    )}
                  </>
                )}
              </div>

              {dashboard.media.length > 0 && (
                <select
                  value={form.coverImage}
                  onChange={(e) => setForm({...form, coverImage: e.target.value})}
                  className="w-full rounded-lg border border-white/[0.08] bg-[#11131B] px-3 py-2 text-xs text-[#9CA3AF] focus:border-[#8B5CF6] focus:outline-none"
                >
                  <option value="">-- Or select from Media Library --</option>
                  {dashboard.media.map((m) => (
                    <option key={m.id} value={m.url}>
                      {m.originalName}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-1">
            <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm text-[#F5F5F7]">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm({...form, isPublished: e.target.checked})}
                className="h-4 w-4 accent-[#8B5CF6]"
              />
              <span>Publish immediately on public portfolio</span>
            </label>

            <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm text-[#F5F5F7]">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({...form, isFeatured: e.target.checked})}
                className="h-4 w-4 accent-[#8B5CF6]"
              />
              <span>Feature project at top</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-white/[0.1] px-5 py-2.5 text-sm text-[#9CA3AF] hover:text-[#F5F5F7]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
            >
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      )}

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#11131B]/50 p-12 text-center">
          <h3 className="font-display text-lg font-semibold text-[#F5F5F7]">No Projects Found</h3>
          <p className="mt-2 text-sm text-[#9CA3AF]">
            {projects.length === 0
              ? 'You have not added any real client projects yet. Click "Add New Project" above to publish your first website.'
              : 'No projects match your current search or filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProjects.map((project, idx) => (
            <div
              key={project.id}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#11131B] p-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-white/[0.08] bg-[#08090D]">
                  {project.coverImage ? (
                    <img
                      src={project.coverImage}
                      alt={project.title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-[#9CA3AF]">
                      No cover
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-base font-semibold text-[#F5F5F7] truncate">
                      {project.title}
                    </h3>
                    {project.isFeatured && (
                      <span className="text-xs font-medium text-[#A855F7]">· Featured</span>
                    )}
                    <span
                      className={`text-xs font-mono-tabular ${
                        project.isPublished ? 'text-emerald-400' : 'text-[#9CA3AF]'
                      }`}
                    >
                      · {project.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>

                  <p className="mt-0.5 text-xs text-[#9CA3AF] truncate">
                    {project.category}
                    {project.clientName ? ` · Client: ${project.clientName}` : ''}
                    {project.technologies.length > 0
                      ? ` · ${project.technologies.join(', ')}`
                      : ''}
                  </p>

                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-[#A855F7] hover:underline"
                  >
                    <span className="truncate max-w-[260px]">{project.liveUrl}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                  </a>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {filter === 'all' && !search && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleMove(idx, -1)}
                      disabled={idx === 0}
                      title="Move up"
                      aria-label="Move project up"
                      className="rounded-lg border border-white/[0.08] bg-[#08090D] p-2 text-[#9CA3AF] hover:text-[#F5F5F7] disabled:opacity-30"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(idx, 1)}
                      disabled={idx === projects.length - 1}
                      title="Move down"
                      aria-label="Move project down"
                      className="rounded-lg border border-white/[0.08] bg-[#08090D] p-2 text-[#9CA3AF] hover:text-[#F5F5F7] disabled:opacity-30"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => handleToggleFeatured(project)}
                  title={project.isFeatured ? 'Unfeature' : 'Feature project'}
                  aria-label="Toggle featured"
                  className={`rounded-lg border p-2 transition-colors ${
                    project.isFeatured
                      ? 'border-[#8B5CF6]/50 bg-[#8B5CF6]/15 text-[#A855F7]'
                      : 'border-white/[0.08] bg-[#08090D] text-[#9CA3AF] hover:text-[#F5F5F7]'
                  }`}
                >
                  <Bookmark className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleTogglePublished(project)}
                  title={project.isPublished ? 'Hide project' : 'Publish project'}
                  aria-label="Toggle published"
                  className="rounded-lg border border-white/[0.08] bg-[#08090D] p-2 text-[#9CA3AF] hover:text-[#F5F5F7]"
                >
                  {project.isPublished ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => openEditForm(project)}
                  title="Edit project"
                  aria-label="Edit project"
                  className="rounded-lg border border-white/[0.08] bg-[#08090D] p-2 text-[#9CA3AF] hover:border-[#8B5CF6]/40 hover:text-[#F5F5F7]"
                >
                  <Pencil className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteTarget(project)}
                  title="Delete project"
                  aria-label="Delete project"
                  className="rounded-lg border border-white/[0.08] bg-[#08090D] p-2 text-[#9CA3AF] hover:border-red-500/40 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#11131B] p-6">
            <h3 className="font-display text-lg font-bold text-[#F5F5F7]">Delete Project?</h3>
            <p className="mt-2 text-sm text-[#9CA3AF]">
              Are you sure you want to delete{' '}
              <span className="font-medium text-[#F5F5F7]">{deleteTarget.title}</span>? This action
              cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-white/[0.1] px-4 py-2 text-sm text-[#9CA3AF] hover:text-[#F5F5F7]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
