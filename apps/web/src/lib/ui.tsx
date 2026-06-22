import type { JobStatus } from '@fsm/shared';

export const JOB_STATUS_META: Record<string, { label: string; cls: string }> = {
  scheduled: { label: 'Scheduled', cls: 'bg-slate-100 text-slate-600' },
  dispatched: { label: 'Dispatched', cls: 'bg-blue-100 text-blue-700' },
  en_route: { label: 'En route', cls: 'bg-blue-100 text-blue-700' },
  on_site: { label: 'On site', cls: 'bg-indigo-100 text-indigo-700' },
  in_progress: { label: 'In progress', cls: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Completed', cls: 'bg-emerald-100 text-emerald-700' },
  signed_off: { label: 'Signed off', cls: 'bg-emerald-100 text-emerald-700' },
  invoiced: { label: 'Invoiced', cls: 'bg-teal-100 text-teal-700' },
  cancelled: { label: 'Cancelled', cls: 'bg-rose-100 text-rose-700' },
  on_hold: { label: 'On hold', cls: 'bg-slate-200 text-slate-600' },
};

export function StatusPill({ status }: { status: JobStatus | string }) {
  const m = JOB_STATUS_META[status] ?? { label: status, cls: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${m.cls}`}>
      {m.label}
    </span>
  );
}

export function AssetBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    chiller: 'bg-sky-100 text-sky-700',
    crac: 'bg-violet-100 text-violet-700',
    fan_wall: 'bg-amber-100 text-amber-700',
    ahu: 'bg-teal-100 text-teal-700',
    pump: 'bg-slate-100 text-slate-600',
    other: 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${map[type] ?? map.other}`}>
      {type.replace('_', ' ')}
    </span>
  );
}

export function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}
