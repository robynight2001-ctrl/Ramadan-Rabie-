import type {
  AdminDashboardData,
  MediaItem,
  PortfolioData,
  ProjectItem,
  ServiceItem,
  SkillItem,
} from '../types/portfolio.ts';

const TOKEN_STORAGE_KEY = 'rr_admin_token';

export function getStoredToken(): string {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredToken(token: string): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!(options.body instanceof FormData) && options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
    cache: 'no-store',
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error || `Request failed (${res.status})`);
  }
  return payload as T;
}

export async function fetchPublicPortfolio(): Promise<PortfolioData> {
  return apiRequest<PortfolioData>(`/api/portfolio?t=${Date.now()}`);
}

export async function publishAdminWebsite(): Promise<AdminDashboardData> {
  const res = await apiRequest<{ok: boolean; dashboard: AdminDashboardData}>('/api/admin/publish', {
    method: 'POST',
  });
  return res.dashboard;
}

export async function discardAdminDraft(): Promise<AdminDashboardData> {
  const res = await apiRequest<{ok: boolean; dashboard: AdminDashboardData}>('/api/admin/discard', {
    method: 'POST',
  });
  return res.dashboard;
}

export async function loginAdmin(
  username: string,
  password: string
): Promise<{authenticated: boolean; username: string; token: string}> {
  const data = await apiRequest<{authenticated: boolean; username: string; token: string}>(
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({username, password}),
    }
  );
  if (data.token) {
    setStoredToken(data.token);
  }
  return data;
}

export async function checkAuthStatus(): Promise<{authenticated: boolean; username?: string}> {
  try {
    return await apiRequest<{authenticated: boolean; username: string}>('/api/auth/me');
  } catch {
    return {authenticated: false};
  }
}

export async function logoutAdmin(): Promise<void> {
  try {
    await apiRequest('/api/auth/logout', {method: 'POST'});
  } finally {
    setStoredToken('');
  }
}

export async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  return apiRequest<AdminDashboardData>('/api/admin/dashboard');
}

export async function saveSettingsSection<T>(
  section: 'profile' | 'social' | 'content' | 'general',
  data: T
): Promise<AdminDashboardData> {
  const res = await apiRequest<{ok: boolean; data: AdminDashboardData}>(
    `/api/admin/settings/${section}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  );
  return res.data;
}

export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await apiRequest('/api/admin/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({currentPassword, newPassword}),
  });
}

// Projects
export async function createAdminProject(
  input: Omit<ProjectItem, 'id' | 'createdAt' | 'sortOrder'>
): Promise<{project: ProjectItem; dashboard: AdminDashboardData}> {
  return apiRequest('/api/admin/projects', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateAdminProject(
  id: string,
  input: Partial<ProjectItem>
): Promise<{project: ProjectItem; dashboard: AdminDashboardData}> {
  return apiRequest(`/api/admin/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteAdminProject(id: string): Promise<AdminDashboardData> {
  const res = await apiRequest<{ok: boolean; dashboard: AdminDashboardData}>(
    `/api/admin/projects/${id}`,
    {method: 'DELETE'}
  );
  return res.dashboard;
}

export async function reorderAdminProjects(orderedIds: string[]): Promise<AdminDashboardData> {
  const res = await apiRequest<{ok: boolean; dashboard: AdminDashboardData}>(
    '/api/admin/projects/reorder',
    {
      method: 'POST',
      body: JSON.stringify({orderedIds}),
    }
  );
  return res.dashboard;
}

// Services
export async function createAdminService(
  input: Omit<ServiceItem, 'id' | 'sortOrder'>
): Promise<{service: ServiceItem; dashboard: AdminDashboardData}> {
  return apiRequest('/api/admin/services', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateAdminService(
  id: string,
  input: Partial<ServiceItem>
): Promise<{service: ServiceItem; dashboard: AdminDashboardData}> {
  return apiRequest(`/api/admin/services/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteAdminService(id: string): Promise<AdminDashboardData> {
  const res = await apiRequest<{ok: boolean; dashboard: AdminDashboardData}>(
    `/api/admin/services/${id}`,
    {method: 'DELETE'}
  );
  return res.dashboard;
}

export async function reorderAdminServices(orderedIds: string[]): Promise<AdminDashboardData> {
  const res = await apiRequest<{ok: boolean; dashboard: AdminDashboardData}>(
    '/api/admin/services/reorder',
    {
      method: 'POST',
      body: JSON.stringify({orderedIds}),
    }
  );
  return res.dashboard;
}

// Skills
export async function createAdminSkill(
  input: Omit<SkillItem, 'id' | 'sortOrder'>
): Promise<{skill: SkillItem; dashboard: AdminDashboardData}> {
  return apiRequest('/api/admin/skills', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateAdminSkill(
  id: string,
  input: Partial<SkillItem>
): Promise<{skill: SkillItem; dashboard: AdminDashboardData}> {
  return apiRequest(`/api/admin/skills/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteAdminSkill(id: string): Promise<AdminDashboardData> {
  const res = await apiRequest<{ok: boolean; dashboard: AdminDashboardData}>(
    `/api/admin/skills/${id}`,
    {method: 'DELETE'}
  );
  return res.dashboard;
}

export async function reorderAdminSkills(orderedIds: string[]): Promise<AdminDashboardData> {
  const res = await apiRequest<{ok: boolean; dashboard: AdminDashboardData}>(
    '/api/admin/skills/reorder',
    {
      method: 'POST',
      body: JSON.stringify({orderedIds}),
    }
  );
  return res.dashboard;
}

// Media
export async function uploadMediaFile(
  file: File,
  sectionTag: MediaItem['sectionTag'] = 'general'
): Promise<{media: MediaItem; dashboard: AdminDashboardData}> {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('sectionTag', sectionTag);
  return apiRequest('/api/admin/media/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function replaceMediaFile(
  id: string,
  file: File
): Promise<{media: MediaItem; dashboard: AdminDashboardData}> {
  const formData = new FormData();
  formData.append('image', file);
  return apiRequest(`/api/admin/media/${id}/replace`, {
    method: 'PUT',
    body: formData,
  });
}

export async function updateMediaTag(
  id: string,
  sectionTag: MediaItem['sectionTag']
): Promise<{media: MediaItem; dashboard: AdminDashboardData}> {
  return apiRequest(`/api/admin/media/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({sectionTag}),
  });
}

export async function deleteMediaFile(id: string): Promise<AdminDashboardData> {
  const res = await apiRequest<{ok: boolean; dashboard: AdminDashboardData}>(
    `/api/admin/media/${id}`,
    {method: 'DELETE'}
  );
  return res.dashboard;
}
