// Thin typed client for the FSM API. Every call throws on failure so callers
// (via TanStack Query) can fall back to seed data and surface an "offline" state.

const BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3001';

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'content-type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any)?.message || `${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// ── Response shapes (subset of the API include trees) ──
export interface ApiEngineer {
  id: string;
  fullName: string;
  role: string;
  engineer?: { skills: string[] } | null;
}

export interface ApiTemplate {
  id: string;
  name: string;
  assetType: string | null;
  jobType: string;
  ppmScope: string | null;
  schema: unknown;
}

export interface ApiSubmission {
  id: string;
  status: string;
  answers: Record<string, unknown>;
  pdfUrl: string | null;
}

export interface CompleteResult {
  submission: ApiSubmission;
  warnings: { key: string; label: string; value: number; min?: number; max?: number; unit?: string }[];
}

export interface ApiJob {
  id: string;
  summary: string | null;
  status: string;
  jobType: string;
  scheduledStart: string | null;
  siteId: string;
  clientId: string;
  site?: { name: string; code: string | null };
  client?: { name: string };
  assignments?: { engineer: { id: string; fullName: string } }[];
  jobAssets?: { asset: { tag: string; assetType: string } }[];
}

export const api = {
  health: () => http<{ status: string }>('/health'),
  jobs: () => http<ApiJob[]>('/jobs'),
  engineers: () => http<ApiEngineer[]>('/engineers'),
  clients: () => http<any[]>('/clients'),
  materialize: () =>
    http<{ jobsCreated: number; jobsExisting: number; rulesChecked: number }>(
      '/scheduling/materialize',
      { method: 'POST' },
    ),
  changeJobStatus: (id: string, status: string) =>
    http<ApiJob>(`/jobs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  assign: (id: string, engineerId: string) =>
    http(`/jobs/${id}/assign`, { method: 'POST', body: JSON.stringify({ engineerId }) }),

  // ── Forms / submissions ──
  templates: () => http<ApiTemplate[]>('/form-templates'),
  createSubmission: (body: { jobId: string; formTemplateId: string; assetId?: string }) =>
    http<ApiSubmission>('/submissions', { method: 'POST', body: JSON.stringify(body) }),
  saveAnswers: (id: string, answers: Record<string, unknown>) =>
    http<ApiSubmission>(`/submissions/${id}/answers`, {
      method: 'PATCH',
      body: JSON.stringify({ answers }),
    }),
  completeSubmission: (id: string) =>
    http<CompleteResult>(`/submissions/${id}/complete`, { method: 'POST' }),
  signSubmission: (id: string, body: { signerRole: string; signerName: string; imageDataUrl?: string }) =>
    http(`/submissions/${id}/sign`, { method: 'POST', body: JSON.stringify(body) }),
  generatePdf: (id: string) =>
    http<{ pdfUrl: string; filedInto: string }>(`/submissions/${id}/pdf`, { method: 'POST' }),
};

export const apiBase = BASE;
