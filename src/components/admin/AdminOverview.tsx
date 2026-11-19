import {
  ArrowUpRight,
  CheckCircle2,
  FolderKanban,
  Image as ImageIcon,
  Layers,
  Plus,
  UserCog,
} from 'lucide-react';
import type {AdminDashboardData} from '../../types/portfolio.ts';

export type AdminTabKey =
  | 'overview'
  | 'profile'
  | 'projects'
  | 'services'
  | 'media'
  | 'social'
  | 'content'
  | 'general';

interface AdminOverviewProps {
  dashboard: AdminDashboardData;
  onNavigateTab: (tab: AdminTabKey) => void;
  onViewSite: () => void;
}

export function AdminOverview({dashboard, onNavigateTab, onViewSite}: AdminOverviewProps) {
  const {stats, profile} = dashboard;

  const statCards = [
    {
      label: 'Total Projects',
      value: stats.totalProjects,
      sub: `${stats.featuredProjects} featured`,
      icon: FolderKanban,
    },
    {
      label: 'Published Projects',
      value: stats.publishedProjects,
      sub: `${stats.totalProjects - stats.publishedProjects} hidden drafts`,
      icon: CheckCircle2,
    },
    {
      label: 'Active Services',
      value: stats.activeServices,
      sub: `${stats.totalSkills} core skills`,
      icon: Layers,
    },
    {
      label: 'Media Library',
      value: stats.totalMedia,
      sub: 'Persistent stored assets',
      icon: ImageIcon,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-white/[0.08] bg-[#11131B] p-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#9CA3AF]">{card.label}</span>
                <Icon className="h-4 w-4 text-[#A855F7]" aria-hidden="true" />
              </div>
              <p className="mt-3 font-mono-tabular text-3xl font-bold text-[#F5F5F7]">
                {card.value}
              </p>
              <p className="mt-1 text-xs text-[#9CA3AF]">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Profile Preview + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-2xl border border-white/[0.08] bg-[#11131B] p-6">
          <div className="flex items-center justify-between gap-4 mb-5">
            <h2 className="font-display text-lg font-semibold text-[#F5F5F7]">Profile Preview</h2>
            <button
              type="button"
              onClick={() => onNavigateTab('profile')}
              className="text-xs font-medium text-[#A855F7] hover:underline"
            >
              Edit Profile
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#08090D]">
              {profile.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt={profile.name}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover object-top"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-display text-xl font-bold text-[#9CA3AF]">
                  RR
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-display text-xl font-bold text-[#F5F5F7]">{profile.name}</h3>
                <span
                  className={`text-xs font-mono-tabular ${
                    profile.availabilityActive ? 'text-emerald-400' : 'text-[#9CA3AF]'
                  }`}
                >
                  {profile.availabilityActive ? profile.availabilityStatus : 'Unavailable'}
                </span>
              </div>
              <p className="mt-1 text-sm text-[#A855F7]">{profile.title}</p>
              <p className="mt-3 text-sm leading-relaxed text-[#9CA3AF] line-clamp-2">
                {profile.heroHeadline} — {profile.heroDescription}
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl border border-white/[0.08] bg-[#11131B] p-6 flex flex-col justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#F5F5F7]">Quick Actions</h2>
            <p className="mt-1 text-xs text-[#9CA3AF]">
              Jump directly to common portfolio management tasks.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab('projects')}
              className="flex items-center gap-2.5 rounded-xl border border-[#8B5CF6]/40 bg-[#8B5CF6]/15 px-4 py-3 text-left text-sm font-medium text-[#F5F5F7] transition-colors hover:bg-[#8B5CF6]/25"
            >
              <Plus className="h-4 w-4 text-[#A855F7]" aria-hidden="true" />
              <span>Add Project</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('media')}
              className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-[#08090D] px-4 py-3 text-left text-sm font-medium text-[#F5F5F7] transition-colors hover:border-[#8B5CF6]/50"
            >
              <ImageIcon className="h-4 w-4 text-[#A855F7]" aria-hidden="true" />
              <span>Upload Image</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('profile')}
              className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-[#08090D] px-4 py-3 text-left text-sm font-medium text-[#F5F5F7] transition-colors hover:border-[#8B5CF6]/50"
            >
              <UserCog className="h-4 w-4 text-[#A855F7]" aria-hidden="true" />
              <span>Profile Settings</span>
            </button>

            <button
              type="button"
              onClick={onViewSite}
              className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-[#08090D] px-4 py-3 text-left text-sm font-medium text-[#F5F5F7] transition-colors hover:border-[#8B5CF6]/50"
            >
              <ArrowUpRight className="h-4 w-4 text-[#A855F7]" aria-hidden="true" />
              <span>View Public Site</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Projects Summary */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#11131B] p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="font-display text-lg font-semibold text-[#F5F5F7]">Portfolio Status</h2>
          <button
            type="button"
            onClick={() => onNavigateTab('projects')}
            className="text-xs font-medium text-[#A855F7] hover:underline"
          >
            Manage Projects
          </button>
        </div>

        {dashboard.allProjects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-[#08090D]/50 p-6 text-center">
            <p className="text-sm text-[#9CA3AF]">
              Your portfolio starts clean with 0 projects. Add your real client websites in the
              Projects tab to showcase them live.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {dashboard.allProjects.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#F5F5F7] truncate">{p.title}</p>
                  <p className="text-xs text-[#9CA3AF] truncate">
                    {p.category} {p.clientName ? `· ${p.clientName}` : ''}
                  </p>
                </div>
                <span
                  className={`font-mono-tabular text-xs shrink-0 ${
                    p.isPublished ? 'text-emerald-400' : 'text-[#9CA3AF]'
                  }`}
                >
                  {p.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
