import { PageHeader, StatCard } from '../components/Shell';
import { StatusPill } from '../lib/ui';
import { CLIENTS, JOBS, SITES, ENGINEERS, engineerName, siteName } from '../data/mock';

export function Dashboard() {
  const ppmJobs = JOBS.filter((j) => j.type === 'ppm');
  const completed = JOBS.filter((j) => j.status === 'completed' || j.status === 'signed_off' || j.status === 'invoiced');
  const open = JOBS.filter((j) => !['completed', 'signed_off', 'invoiced', 'cancelled'].includes(j.status));
  const upcoming = [...JOBS]
    .filter((j) => new Date(j.start) >= new Date(new Date().toDateString()))
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 6);

  return (
    <>
      <PageHeader title="Dashboard" sub="Field service overview — all clients" />
      <div className="mb-5 grid grid-cols-4 gap-3">
        <StatCard label="Active clients" value={CLIENTS.length} meta="QST · Fincantieri" accent="brand" />
        <StatCard label="Open jobs" value={open.length} meta={`${ppmJobs.length} PPM in plan`} accent="warn" />
        <StatCard label="Completed (period)" value={completed.length} meta="incl. signed-off" accent="ok" />
        <StatCard label="Engineers" value={ENGINEERS.length} meta="available to dispatch" accent="purple" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="overflow-hidden rounded-card border border-line bg-white">
          <div className="border-b border-line px-4 py-3 text-[13px] font-semibold">Upcoming jobs</div>
          <table className="w-full border-collapse">
            <tbody>
              {upcoming.map((j) => (
                <tr key={j.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-2.5">
                    <div className="text-[13px] font-medium">{j.title}</div>
                    <div className="text-[11px] text-muted">{siteName(j.siteId)}</div>
                  </td>
                  <td className="px-4 py-2.5 text-[12px]">{engineerName(j.engineerId)}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-muted">{j.start}</td>
                  <td className="px-4 py-2.5 text-right">
                    <StatusPill status={j.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="overflow-hidden rounded-card border border-line bg-white">
          <div className="border-b border-line px-4 py-3 text-[13px] font-semibold">PPM workload by client</div>
          <div className="space-y-3 p-4">
            {CLIENTS.map((c) => {
              const cs = JOBS.filter((j) => j.clientId === c.id && j.type === 'ppm');
              const done = cs.filter((j) => ['completed', 'signed_off', 'invoiced'].includes(j.status)).length;
              const pct = cs.length ? Math.round((done / cs.length) * 100) : 0;
              return (
                <div key={c.id}>
                  <div className="mb-1 flex items-center justify-between text-[12px]">
                    <span className="font-medium">{c.name}</span>
                    <span className="font-mono text-[11px] text-muted">
                      {done}/{cs.length}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            <div className="pt-2 text-[11px] text-muted">Sites covered: {SITES.length}</div>
          </div>
        </div>
      </div>
    </>
  );
}
