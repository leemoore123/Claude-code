import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IconRefresh, IconPlayerPlay, IconWifi, IconWifiOff } from '@tabler/icons-react';
import { PageHeader } from '../components/Shell';
import { StatusPill } from '../lib/ui';
import { api } from '../lib/api';
import { useBoard, type BoardJob } from '../lib/useFsmData';
import { nextStates } from '../lib/jobFlow';

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

export function Schedule() {
  const qc = useQueryClient();
  const { jobs, engineers, isLive } = useBoard();
  const [msg, setMsg] = useState<string | null>(null);

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.changeJobStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
    onError: (e: Error) => setMsg(e.message),
  });

  const materializeMut = useMutation({
    mutationFn: api.materialize,
    onSuccess: (r) => {
      setMsg(`Materializer: +${r.jobsCreated} jobs (${r.jobsExisting} already existed, ${r.rulesChecked} rules checked)`);
      qc.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (e: Error) => setMsg(e.message),
  });

  const days = weekDays();
  const unassigned = jobs.filter((j) => !j.engineerId);

  return (
    <>
      <PageHeader
        title="Schedule & Dispatch"
        sub="This week — engineers × days. PPM jobs auto-materialise from frequency rules."
        action={
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                isLive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
              }`}
              title={isLive ? 'Connected to FSM API' : 'API offline — showing seed data'}
            >
              {isLive ? <IconWifi size={13} /> : <IconWifiOff size={13} />}
              {isLive ? 'Live' : 'Demo data'}
            </span>
            <button
              className="btn btn-outline"
              disabled={!isLive || materializeMut.isPending}
              onClick={() => materializeMut.mutate()}
            >
              <IconPlayerPlay size={14} /> Run materializer
            </button>
            <button className="btn btn-outline" onClick={() => qc.invalidateQueries({ queryKey: ['jobs'] })}>
              <IconRefresh size={14} /> Refresh
            </button>
          </div>
        }
      />

      {msg && (
        <div className="mb-3 rounded-md border border-line bg-white px-3 py-2 text-[12px] text-ink">
          {msg}
          <button className="ml-2 text-muted hover:text-ink" onClick={() => setMsg(null)}>
            ✕
          </button>
        </div>
      )}

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
            {engineers.map((e) => (
              <tr key={e.id} className="align-top">
                <td className="border-b border-line px-3 py-2 text-[12px] font-semibold">
                  {e.name}
                  <div className="text-[10px] font-normal text-muted">{e.role}</div>
                </td>
                {days.map((d) => {
                  const cell = jobs.filter((j) => j.engineerId === e.id && j.start === d.iso);
                  return (
                    <td key={d.iso} className="min-w-[120px] border-b border-l border-line p-1.5">
                      {cell.map((j) => (
                        <JobChip
                          key={j.id}
                          job={j}
                          live={isLive}
                          onAdvance={(status) => statusMut.mutate({ id: j.id, status })}
                        />
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
                <JobChip job={j} live={isLive} onAdvance={(status) => statusMut.mutate({ id: j.id, status })} />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function JobChip({
  job,
  live,
  onAdvance,
}: {
  job: BoardJob;
  live: boolean;
  onAdvance: (status: string) => void;
}) {
  const options = nextStates(job.status);
  return (
    <div className="mb-1 rounded-md border border-line bg-white p-1.5 shadow-sm">
      <div className="mb-0.5 line-clamp-2 text-[11px] font-medium leading-tight">{job.title}</div>
      <div className="mb-1 text-[10px] text-muted">{job.siteName}</div>
      <div className="flex items-center justify-between gap-1">
        <StatusPill status={job.status} />
        {live && options.length > 0 && (
          <select
            className="max-w-[88px] rounded border border-line bg-white px-1 py-0.5 text-[9px] text-muted"
            value=""
            onChange={(e) => e.target.value && onAdvance(e.target.value)}
            title="Advance status"
          >
            <option value="">→</option>
            {options.map((o) => (
              <option key={o} value={o}>
                {o.replace('_', ' ')}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
