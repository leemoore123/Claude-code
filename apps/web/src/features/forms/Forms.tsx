import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ALL_FORM_TEMPLATES, PPM_FREQUENCY_LABELS, type FormSchema, type PpmFrequency } from '@fsm/shared';
import { IconClipboardList, IconTool, IconChevronRight, IconWifi, IconWifiOff, IconX } from '@tabler/icons-react';
import { PageHeader } from '../../components/Shell';
import { FormRenderer, type LiveContext } from './FormRenderer';
import { api, type ApiJob, type ApiTemplate } from '../../lib/api';

export function Forms() {
  const [active, setActive] = useState<{ schema: FormSchema; live?: LiveContext } | null>(null);
  const [picking, setPicking] = useState<FormSchema | null>(null);

  const templatesQ = useQuery({ queryKey: ['templates'], queryFn: api.templates });
  const jobsQ = useQuery({ queryKey: ['jobs'], queryFn: api.jobs });
  const isLive = templatesQ.isSuccess;

  const createMut = useMutation({
    mutationFn: ({ jobId, tplId }: { jobId: string; tplId: string }) =>
      api.createSubmission({ jobId, formTemplateId: tplId }),
  });

  function openTemplate(schema: FormSchema) {
    if (isLive) setPicking(schema); // choose a job to attach the live submission to
    else setActive({ schema }); // offline demo
  }

  async function startLive(schema: FormSchema, job: ApiJob) {
    const tpl = (templatesQ.data as ApiTemplate[]).find((t) => t.name === schema.title);
    if (!tpl) return;
    const sub = await createMut.mutateAsync({ jobId: job.id, tplId: tpl.id });
    setPicking(null);
    setActive({
      schema,
      live: { submissionId: sub.id, jobLabel: `${job.site?.name ?? ''} · ${job.summary ?? ''}` },
    });
  }

  if (active) return <FormRenderer schema={active.schema} live={active.live} onClose={() => setActive(null)} />;

  const ppm = ALL_FORM_TEMPLATES.filter((t) => t.jobType === 'ppm');
  const service = ALL_FORM_TEMPLATES.filter((t) => t.jobType !== 'ppm');

  return (
    <>
      <PageHeader
        title="PPM & Service Forms"
        sub="Generated per asset type & scope — data-driven, versioned, PDF-exportable"
        action={
          <span
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              isLive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {isLive ? <IconWifi size={13} /> : <IconWifiOff size={13} />}
            {isLive ? 'Live — saves & generates PDF' : 'Demo data'}
          </span>
        }
      />

      <Section title="PPM forms" icon={<IconClipboardList size={16} className="text-brand" />}>
        {ppm.map((t) => (
          <Card key={t.key} t={t} onOpen={() => openTemplate(t)} />
        ))}
      </Section>

      <Section title="Service / corrective forms" icon={<IconTool size={16} className="text-ok" />}>
        {service.map((t) => (
          <Card key={t.key} t={t} onOpen={() => openTemplate(t)} />
        ))}
      </Section>

      {picking && (
        <JobPicker
          schema={picking}
          jobs={jobsQ.data ?? []}
          busy={createMut.isPending}
          onPick={(job) => startLive(picking, job)}
          onClose={() => setPicking(null)}
        />
      )}
    </>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="mb-2.5 flex items-center gap-2 text-[13px] font-semibold text-ink">{icon} {title}</div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">{children}</div>
    </div>
  );
}

function Card({ t, onOpen }: { t: FormSchema; onOpen: () => void }) {
  const fieldCount = t.sections.reduce((n, s) => n + s.fields.length, 0);
  return (
    <div
      onClick={onOpen}
      className="cursor-pointer rounded-card border border-line bg-white p-4 transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
    >
      <div className="mb-1 flex items-start justify-between">
        <span className="text-[14px] font-semibold">{t.title}</span>
        <IconChevronRight size={16} className="text-muted" />
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {t.assetType && (
          <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-sky-700">{t.assetType.replace('_', ' ')}</span>
        )}
        {t.ppmScope && (
          <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-violet-700">{PPM_FREQUENCY_LABELS[t.ppmScope as PpmFrequency]}</span>
        )}
      </div>
      <div className="text-[11px] text-muted">
        {t.sections.length} sections · {fieldCount} fields {t.requiresSignoff ? '· sign-off' : ''}
      </div>
    </div>
  );
}

function JobPicker({
  schema,
  jobs,
  busy,
  onPick,
  onClose,
}: {
  schema: FormSchema;
  jobs: ApiJob[];
  busy: boolean;
  onPick: (job: ApiJob) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60" onClick={onClose}>
      <div className="w-[460px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-card bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between bg-navy-800 px-5 py-4 text-white">
          <span className="text-[14px] font-semibold">Start “{schema.title}” for a job</span>
          <button onClick={onClose}><IconX size={16} className="text-white/70" /></button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-3">
          {jobs.length === 0 && <div className="p-6 text-center text-[12px] text-muted">No jobs available.</div>}
          {jobs.map((j) => (
            <button
              key={j.id}
              disabled={busy}
              onClick={() => onPick(j)}
              className="mb-1 flex w-full items-center justify-between rounded-md border border-line px-3 py-2.5 text-left hover:border-brand hover:bg-brand-light disabled:opacity-50"
            >
              <div>
                <div className="text-[13px] font-medium">{j.summary}</div>
                <div className="text-[11px] text-muted">{j.site?.name} · {j.client?.name}</div>
              </div>
              <IconChevronRight size={15} className="text-muted" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
