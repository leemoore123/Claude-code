import {
  IconLayoutDashboard,
  IconBuildingCommunity,
  IconServer2,
  IconCalendarTime,
  IconFileText,
  IconAddressBook,
  IconPlugConnected,
  IconBell,
} from '@tabler/icons-react';
import type { ReactNode } from 'react';

export type ViewId =
  | 'dashboard'
  | 'clients'
  | 'sites'
  | 'schedule'
  | 'forms'
  | 'contacts'
  | 'integrations';

const NAV: { id: ViewId; label: string; icon: ReactNode; badge?: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <IconLayoutDashboard size={15} /> },
  { id: 'clients', label: 'Clients & Contracts', icon: <IconBuildingCommunity size={15} /> },
  { id: 'sites', label: 'Sites & Assets', icon: <IconServer2 size={15} /> },
  { id: 'schedule', label: 'Schedule & Dispatch', icon: <IconCalendarTime size={15} />, badge: '8' },
  { id: 'forms', label: 'PPM & Service Forms', icon: <IconFileText size={15} /> },
  { id: 'contacts', label: 'Contacts', icon: <IconAddressBook size={15} /> },
  { id: 'integrations', label: 'Zoho Integration', icon: <IconPlugConnected size={15} /> },
];

export function Shell({
  view,
  setView,
  children,
}: {
  view: ViewId;
  setView: (v: ViewId) => void;
  children: ReactNode;
}) {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="flex h-full flex-col">
      {/* Topbar */}
      <header className="flex h-[54px] items-center justify-between border-b-2 border-brand bg-navy px-6 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand font-mono text-[11px] font-bold tracking-wide">
            FSM
          </div>
          <div>
            <span className="font-mono text-[13px] font-medium tracking-wider">QEY TECHNICAL</span>
            <span className="ml-1 text-[11px] text-white/50">/ Field Service Management</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-white/45">{today}</span>
          <div className="flex items-center gap-2 rounded-md border border-white/15 px-2.5 py-1.5">
            <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-brand text-[9px] font-semibold">
              LM
            </div>
            <span className="text-[12px] font-medium text-white/85">Lee Moore</span>
            <span className="rounded-full bg-[#042C53] px-1.5 py-0.5 text-[9px] font-semibold text-[#B5D4F4]">
              Admin
            </span>
          </div>
          <IconBell size={16} className="cursor-pointer text-white/50" />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside className="flex w-[225px] flex-shrink-0 flex-col overflow-y-auto border-r border-white/[0.06] bg-navy-800">
          <div className="px-3.5 pb-1 pt-4 text-[9px] font-bold uppercase tracking-[0.12em] text-white/30">
            Operations
          </div>
          {NAV.map((n) => (
            <div
              key={n.id}
              className={`nav-item ${view === n.id ? 'active' : ''}`}
              onClick={() => setView(n.id)}
            >
              {n.icon}
              <span>{n.label}</span>
              {n.badge && (
                <span className="ml-auto rounded-full bg-brand/25 px-1.5 py-0.5 text-[9px] font-bold text-[#60a5fa]">
                  {n.badge}
                </span>
              )}
            </div>
          ))}
          <div className="mt-auto px-3.5 py-4 text-[10px] leading-relaxed text-white/30">
            Phase 0 demo · seed data
            <br />
            QST HVAC · Fincantieri
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between">
      <div>
        <h1 className="text-[20px] font-semibold text-ink">{title}</h1>
        {sub && <p className="mt-0.5 text-[12px] text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  meta,
  accent = 'brand',
}: {
  label: string;
  value: string | number;
  meta?: string;
  accent?: 'brand' | 'ok' | 'warn' | 'purple' | 'danger';
}) {
  const top: Record<string, string> = {
    brand: 'border-t-brand',
    ok: 'border-t-ok',
    warn: 'border-t-warn',
    purple: 'border-t-purple',
    danger: 'border-t-danger',
  };
  return (
    <div className={`stat-card border-t-[3px] ${top[accent]}`}>
      <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-muted">{label}</div>
      <div className="font-mono text-[26px] font-bold leading-none text-ink">{value}</div>
      {meta && <div className="mt-1 text-[11px] text-muted">{meta}</div>}
    </div>
  );
}
