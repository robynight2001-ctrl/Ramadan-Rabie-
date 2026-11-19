import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FileText,
  FolderKanban,
  Globe,
  Image as ImageIcon,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  RotateCcw,
  Share2,
  Sliders,
  UserCog,
  X,
} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {AdminContentTab, AdminGeneralTab, AdminSocialTab} from '../components/admin/AdminContentSocialTab.tsx';
import {AdminLogin} from '../components/admin/AdminLogin.tsx';
import {AdminMediaTab} from '../components/admin/AdminMediaTab.tsx';
import {AdminOverview, type AdminTabKey} from '../components/admin/AdminOverview.tsx';
import {AdminProfileTab} from '../components/admin/AdminProfileTab.tsx';
import {AdminProjectsTab} from '../components/admin/AdminProjectsTab.tsx';
import {AdminServicesSkillsTab} from '../components/admin/AdminServicesSkillsTab.tsx';
import {
  discardAdminDraft,
  fetchAdminDashboard,
  logoutAdmin,
  publishAdminWebsite,
  subscribeAuthState,
} from '../lib/api.ts';
import type {AdminDashboardData} from '../types/portfolio.ts';

interface SettingsPageProps {
  onNavigateHome: () => void;
  onPortfolioChanged: () => void;
}

const SIDEBAR_ITEMS: Array<{key: AdminTabKey; label: string; icon: typeof LayoutDashboard}> = [
  {key: 'overview', label: 'Overview', icon: LayoutDashboard},
  {key: 'profile', label: 'Profile Settings', icon: UserCog},
  {key: 'projects', label: 'Projects', icon: FolderKanban},
  {key: 'services', label: 'Services & Skills', icon: Layers},
  {key: 'media', label: 'Media Library', icon: ImageIcon},
  {key: 'social', label: 'Social Links', icon: Share2},
  {key: 'content', label: 'Website Content', icon: FileText},
  {key: 'general', label: 'General Settings', icon: Sliders},
];

function formatPublishedTimestamp(iso?: string | null): string {
  if (!iso) return 'Never';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SettingsPage({onNavigateHome, onPortfolioChanged}: SettingsPageProps) {
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [loadingDash, setLoadingDash] = useState(false);
  const [dashError, setDashError] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [hasUnsavedFormEdits, setHasUnsavedFormEdits] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTabKey>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{type: 'success' | 'error'; message: string} | null>(null);

  const notify = useCallback((type: 'success' | 'error', message: string) => {
    setToast({type, message});
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3800);
    return () => window.clearTimeout(id);
  }, [toast]);

  const loadDashboard = useCallback(async () => {
    setLoadingDash(true);
    setDashError('');
    try {
      const data = await fetchAdminDashboard();
      setDashboard(data);
    } catch (err) {
      let msg = err instanceof Error ? err.message : 'Failed to load dashboard.';
      try {
        const parsed = JSON.parse(msg) as {error?: string};
        if (parsed?.error) msg = parsed.error;
      } catch {
        // plain error text
      }
      setDashError(msg);
      notify('error', msg);
    } finally {
      setLoadingDash(false);
    }
  }, [notify]);

  useEffect(() => {
    const unsub = subscribeAuthState((state) => {
      setAuthenticated(state.authenticated);
      setUsername(state.user?.displayName || state.user?.email || 'Admin');
      setAuthChecked(state.ready);
      if (!state.authenticated) {
        setDashboard(null);
        setDashError('');
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (authenticated) {
      loadDashboard();
    }
  }, [authenticated, loadDashboard]);

  const handleDashboardUpdate = useCallback(
    (next: AdminDashboardData) => {
      setDashboard(next);
      onPortfolioChanged();
    },
    [onPortfolioChanged]
  );

  const handleTabSwitch = (nextTab: AdminTabKey) => {
    setHasUnsavedFormEdits(false);
    setActiveTab(nextTab);
  };

  const handlePublishWebsite = async () => {
    if (hasUnsavedFormEdits) {
      notify('error', 'Please click "Save Changes" on your current form before publishing.');
      return;
    }
    setPublishing(true);
    try {
      const updated = await publishAdminWebsite();
      setDashboard(updated);
      onPortfolioChanged();
      notify('success', 'Website published live! All visitors now see the latest version.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Publish failed.');
    } finally {
      setPublishing(false);
    }
  };

  const handleDiscardDraft = async () => {
    setDiscarding(true);
    try {
      const updated = await discardAdminDraft();
      setDashboard(updated);
      setHasUnsavedFormEdits(false);
      notify('success', 'Reverted draft settings back to the currently published version.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to revert draft.');
    } finally {
      setDiscarding(false);
    }
  };

  const handleLogout = async () => {
    await logoutAdmin();
    setAuthenticated(false);
    setDashboard(null);
    setUsername('');
  };

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08090D] text-sm text-[#9CA3AF]">
        Verifying session...
      </div>
    );
  }

  if (!authenticated) {
    return (
      <AdminLogin
        onSuccess={(user) => {
          setAuthenticated(true);
          setUsername(user);
        }}
        onBackHome={onNavigateHome}
      />
    );
  }

  const activeNav = SIDEBAR_ITEMS.find((item) => item.key === activeTab) || SIDEBAR_ITEMS[0];
  const publishStatus = dashboard?.publishStatus;
  const hasUnpublished = Boolean(publishStatus?.hasUnpublishedChanges);

  return (
    <div className="min-h-screen bg-[#08090D] text-[#F5F5F7] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[264px] shrink-0 flex-col border-r border-white/[0.08] bg-[#0B0D14]">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-5">
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-[#F5F5F7]">
              Settings
            </h1>
            <p className="text-xs text-[#9CA3AF] mt-0.5">Signed in as {username}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4" aria-label="Settings Navigation">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleTabSwitch(item.key)}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#8B5CF6]/15 text-[#F5F5F7] border border-[#8B5CF6]/40'
                    : 'text-[#9CA3AF] border border-transparent hover:bg-white/[0.04] hover:text-[#F5F5F7]'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${active ? 'text-[#A855F7]' : 'text-[#9CA3AF]'}`}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/[0.08] p-4 space-y-2">
          <button
            type="button"
            onClick={onNavigateHome}
            className="flex w-full items-center justify-between rounded-xl border border-white/[0.08] bg-[#11131B] px-3.5 py-2.5 text-xs font-medium text-[#F5F5F7] hover:border-[#8B5CF6]/50"
          >
            <span>View Public Website</span>
            <ArrowUpRight className="h-4 w-4 text-[#A855F7]" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-medium text-[#9CA3AF] transition-colors hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/70"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-10 flex w-72 flex-col border-r border-white/[0.08] bg-[#0B0D14]">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <span className="font-display text-lg font-bold text-[#F5F5F7]">Settings</span>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1 text-[#9CA3AF]"
                aria-label="Close settings menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 p-4">
              {SIDEBAR_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      handleTabSwitch(item.key);
                      setMobileSidebarOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium ${
                      active
                        ? 'bg-[#8B5CF6]/15 text-[#F5F5F7] border border-[#8B5CF6]/40'
                        : 'text-[#9CA3AF]'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="border-t border-white/[0.08] p-4 space-y-2">
              <button
                type="button"
                onClick={onNavigateHome}
                className="flex w-full items-center justify-between rounded-xl border border-white/[0.08] bg-[#11131B] px-3.5 py-2.5 text-xs font-medium text-[#F5F5F7]"
              >
                <span>View Public Website</span>
                <ArrowUpRight className="h-4 w-4 text-[#A855F7]" />
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-medium text-red-300"
              >
                <LogOut className="h-4 w-4" />
                <span>Log Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar with Publishing Controls */}
        <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] bg-[#08090D]/90 backdrop-blur-lg px-6 py-3.5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-[#11131B] lg:hidden"
              aria-label="Open settings navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#9CA3AF]">Settings</span>
              <span className="text-[#9CA3AF]/50">/</span>
              <span className="font-display font-semibold text-[#F5F5F7] whitespace-nowrap">
                {activeNav.label}
              </span>
            </div>
          </div>

          {/* Publishing Status + Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {publishStatus && (
              <div className="hidden xl:flex items-center gap-2 text-xs text-[#9CA3AF] font-mono-tabular">
                <Clock className="h-3.5 w-3.5 text-[#9CA3AF]" aria-hidden="true" />
                <span>
                  Last published: {formatPublishedTimestamp(publishStatus.lastPublishedAt)}
                </span>
              </div>
            )}

            {hasUnsavedFormEdits && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/35 bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-200 whitespace-nowrap">
                <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Unsaved form edits</span>
              </span>
            )}

            {publishStatus && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium whitespace-nowrap ${
                  hasUnpublished
                    ? 'border-amber-500/35 bg-amber-500/10 text-amber-200'
                    : 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300'
                }`}
              >
                {hasUnpublished ? (
                  <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>{hasUnpublished ? 'Draft · Unpublished changes' : 'Published'}</span>
              </span>
            )}

            {hasUnpublished && (
              <button
                type="button"
                onClick={handleDiscardDraft}
                disabled={discarding || publishing}
                title="Discard unpublished settings edits and revert to live snapshot"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-[#11131B] px-3 py-2 text-xs font-medium text-[#9CA3AF] hover:text-[#F5F5F7] whitespace-nowrap shrink-0"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{discarding ? 'Reverting...' : 'Revert Draft'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePublishWebsite}
              disabled={publishing || !dashboard}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-[0_8px_24px_rgba(139,92,246,0.3)] transition-opacity hover:opacity-95 disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              <Globe className="h-4 w-4" aria-hidden="true" />
              <span>{publishing ? 'Publishing...' : 'Publish Website'}</span>
            </button>

            <button
              type="button"
              onClick={onNavigateHome}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-[#11131B] px-3.5 py-2 text-xs font-medium text-[#F5F5F7] hover:border-[#8B5CF6]/50 whitespace-nowrap shrink-0"
            >
              <span>Live Site</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-[#A855F7]" aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Publishing Status Notice Strip when draft edits are saved */}
        {hasUnpublished && (
          <div className="border-b border-amber-500/20 bg-amber-500/[0.06] px-6 py-2.5 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-3">
            <span>
              Your edits are saved permanently in the database as a draft. Click{' '}
              <strong className="font-semibold text-white">Publish Website</strong> to push all
              approved changes live to visitors across all devices.
            </span>
            <span className="font-mono-tabular text-[11px] text-amber-300/80">
              Live v{publishStatus?.publishedVersion ?? 1} · Last published{' '}
              {formatPublishedTimestamp(publishStatus?.lastPublishedAt)}
            </span>
          </div>
        )}

        {/* Active Tab Viewport */}
        <main className="flex-1 p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {loadingDash ? (
            <div className="space-y-4">
              <div className="h-28 rounded-2xl border border-white/[0.06] bg-[#11131B]/60 animate-pulse" />
              <div className="h-64 rounded-2xl border border-white/[0.06] bg-[#11131B]/60 animate-pulse" />
            </div>
          ) : dashError || !dashboard ? (
            <div className="rounded-2xl border border-red-500/30 bg-[#11131B] p-8 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-red-400" aria-hidden="true" />
              <h2 className="mt-3 font-display text-lg font-semibold text-[#F5F5F7]">
                Unable to load dashboard
              </h2>
              <p className="mt-2 text-sm text-[#9CA3AF]">
                {dashError || 'Firestore dashboard data could not be loaded.'}
              </p>
              <button
                type="button"
                onClick={loadDashboard}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] px-5 py-2.5 text-sm font-semibold text-white"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <AdminOverview
                  dashboard={dashboard}
                  onNavigateTab={handleTabSwitch}
                  onViewSite={onNavigateHome}
                />
              )}
              {activeTab === 'profile' && (
                <AdminProfileTab
                  dashboard={dashboard}
                  onUpdated={handleDashboardUpdate}
                  onNotify={notify}
                  onDirtyChange={setHasUnsavedFormEdits}
                />
              )}
              {activeTab === 'projects' && (
                <AdminProjectsTab
                  dashboard={dashboard}
                  onUpdated={handleDashboardUpdate}
                  onNotify={notify}
                />
              )}
              {activeTab === 'services' && (
                <AdminServicesSkillsTab
                  dashboard={dashboard}
                  onUpdated={handleDashboardUpdate}
                  onNotify={notify}
                />
              )}
              {activeTab === 'media' && (
                <AdminMediaTab
                  dashboard={dashboard}
                  onUpdated={handleDashboardUpdate}
                  onNotify={notify}
                />
              )}
              {activeTab === 'social' && (
                <AdminSocialTab
                  dashboard={dashboard}
                  onUpdated={handleDashboardUpdate}
                  onNotify={notify}
                  onDirtyChange={setHasUnsavedFormEdits}
                />
              )}
              {activeTab === 'content' && (
                <AdminContentTab
                  dashboard={dashboard}
                  onUpdated={handleDashboardUpdate}
                  onNotify={notify}
                  onDirtyChange={setHasUnsavedFormEdits}
                />
              )}
              {activeTab === 'general' && (
                <AdminGeneralTab
                  dashboard={dashboard}
                  onUpdated={handleDashboardUpdate}
                  onNotify={notify}
                  onDirtyChange={setHasUnsavedFormEdits}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-2xl ${
            toast.type === 'success'
              ? 'border-emerald-500/40 bg-[#11131B] text-emerald-200'
              : 'border-red-500/40 bg-[#11131B] text-red-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" aria-hidden="true" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
