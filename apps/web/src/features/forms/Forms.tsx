import { useState } from 'react';
import { ALL_FORM_TEMPLATES, PPM_FREQUENCY_LABELS, type FormSchema, type PpmFrequency } from '@fsm/shared';
import { IconClipboardList, IconTool, IconChevronRight } from '@tabler/icons-react';
import { PageHeader } from '../../components/Shell';
import { FormRenderer } from './FormRenderer';

export function Forms() {
  const [active, setActive] = useState<FormSchema | null>(null);
  if (active) return <FormRenderer schema={active} onClose={() => setActive(null)} />;

  const ppm = ALL_FORM_TEMPLATES.filter((t) => t.jobType === 'ppm');
  const service = ALL_FORM_TEMPLATES.filter((t) => t.jobType !== 'ppm');

  return (
    <>
      <PageHeader
        title="PPM & Service Forms"
        sub="Generated per asset type & scope — all data-driven, versioned, PDF-exportable"
      />

      <Section title="PPM forms" icon={<IconClipboardList size={16} className="text-brand" />}>
        {ppm.map((t) => (
          <Card key={t.key} t={t} onOpen={() => setActive(t)} />
        ))}
      </Section>

      <Section title="Service / corrective forms" icon={<IconTool size={16} className="text-ok" />}>
        {service.map((t) => (
          <Card key={t.key} t={t} onOpen={() => setActive(t)} />
        ))}
      </Section>
    </>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="mb-2.5 flex items-center gap-2 text-[13px] font-semibold text-ink">
        {icon} {title}
      </div>
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
          <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-sky-700">
            {t.assetType.replace('_', ' ')}
          </span>
        )}
        {t.ppmScope && (
          <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-violet-700">
            {PPM_FREQUENCY_LABELS[t.ppmScope as PpmFrequency]}
          </span>
        )}
      </div>
      <div className="text-[11px] text-muted">
        {t.sections.length} sections · {fieldCount} fields {t.requiresSignoff ? '· sign-off' : ''}
      </div>
    </div>
  );
}
