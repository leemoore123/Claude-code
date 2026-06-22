import { PageHeader } from '../components/Shell';
import { StatusPill } from '../lib/ui';
import { ENGINEERS, JOBS, siteName, type Job } from '../data/mock';

// Phase 0 dispatch board (engineer × day). Phase 2 swaps this for FullCalendar
// resource-timeline with drag-assign + the PPM materializer feeding jobs.
function weekDays(): { iso: string; label: string }[] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay() + 1); // Monday
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return {
      iso: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }),
    };
  });
}

function JobChip({ job }: { job: Job }) {
  return (
    <div className="mb-1 rounded-md border border-line bg-white p-1.5 shadow-sm">
      <div className="mb-0.5 line-clamp-2 text-[11px] font-medium leading-tight">{job.title}</div>
      <div className="mb-1 text-[10px] text-muted">{siteName(job.siteId)}</div>
      <StatusPill status={job.status} />
    </div>
  );
}

export function Schedule() {
  const days = weekDays();
  const unassigned = JOBS.filter((j) => !j.engineerId);

  return (
    <>
      <PageHeader
        title="Schedule & Dispatch"
        sub="This week — engineers × days. PPM jobs auto-materialise from frequency rules."
      />
      <div className="overflow-x-auto rounded-card border border-line bg-white">
        <table className="w-full min-w-[820px] border-collapse">
          <thead>
            <tr className="bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wide text-muted">
              <th className="w-[160px] border-b border-line px-3 py-2.5">Engineer</th>
              {days.map((d) => (
                <th key={d.iso} className="border-b border-l border-line px-3 py-2.5 font-medium">
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ENGINEERS.map((e) => (
              <tr key={e.id} className="align-top">
                <td className="border-b border-line px-3 py-2 text-[12px] font-semibold">
                  {e.name}
                  <div className="text-[10px] font-normal text-muted">{e.role}</div>
                </td>
                {days.map((d) => {
                  const cell = JOBS.filter((j) => j.engineerId === e.id && j.start === d.iso);
                  return (
                    <td key={d.iso} className="min-w-[120px] border-b border-l border-line p-1.5">
                      {cell.map((j) => (
                        <JobChip key={j.id} job={j} />
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {unassigned.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-[12px] font-semibold text-muted">Unassigned backlog</div>
          <div className="flex flex-wrap gap-2">
            {unassigned.map((j) => (
              <div key={j.id} className="w-[200px]">
                <JobChip job={j} />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
