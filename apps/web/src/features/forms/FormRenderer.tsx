import { useEffect, useRef, useState } from 'react';
import type { FormField, FormSchema } from '@fsm/shared';
import { IconPaperclip, IconCheck, IconAlertTriangle, IconFileText } from '@tabler/icons-react';
import { api, apiBase } from '../../lib/api';
import { SignaturePad } from '../../components/SignaturePad';

export interface LiveContext {
  submissionId: string;
  jobLabel: string;
}

function Field({
  field,
  value,
  onChange,
  disabled,
}: {
  field: FormField;
  value: unknown;
  onChange: (v: unknown) => void;
  disabled?: boolean;
}) {
  const base =
    'w-full rounded-md border border-line px-2.5 py-1.5 text-[13px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 disabled:bg-slate-50';
  const outOfRange =
    field.type === 'reading' &&
    typeof value === 'string' &&
    value !== '' &&
    ((field.min != null && Number(value) < field.min) || (field.max != null && Number(value) > field.max));

  const common = { disabled } as const;
  switch (field.type) {
    case 'textarea':
      return <textarea {...common} className={`${base} min-h-[64px]`} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'select':
      return (
        <select {...common} className={base} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {field.options?.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      );
    case 'checkbox':
      return (
        <label className="flex items-center gap-2 text-[13px]">
          <input type="checkbox" {...common} checked={!!value} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-brand" />
          <span className="text-muted">Done / verified</span>
        </label>
      );
    case 'date':
      return <input type="date" {...common} className={base} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'number':
      return <input type="number" {...common} className={base} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'reading':
      return (
        <div>
          <div className="flex items-center gap-2">
            <input type="number" {...common} className={`${base} ${outOfRange ? 'border-danger focus:border-danger focus:ring-danger/10' : ''}`} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />
            {field.unit && <span className="text-[12px] text-muted">{field.unit}</span>}
          </div>
          {outOfRange && (
            <div className="mt-0.5 text-[10px] font-medium text-danger">
              Outside pass band ({field.min ?? '–'}–{field.max ?? '–'} {field.unit})
            </div>
          )}
        </div>
      );
    case 'attachment':
      return (
        <button type="button" disabled={disabled} className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-line py-3 text-[12px] text-muted hover:border-brand hover:text-brand">
          <IconPaperclip size={14} /> Add photo{field.multiple ? 's' : ''}
        </button>
      );
    case 'signature':
      return <div className="text-[11px] text-muted">Captured in the Sign-off panel below.</div>;
    default:
      return <input {...common} className={base} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />;
  }
}

export function FormRenderer({
  schema,
  live,
  onClose,
}: {
  schema: FormSchema;
  live?: LiveContext;
  onClose: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [completed, setCompleted] = useState(false);
  const [missing, setMissing] = useState<{ label: string; section: string }[]>([]);
  const [warnings, setWarnings] = useState<{ label: string; value: number; unit?: string }[]>([]);
  const [signed, setSigned] = useState(false);
  const [pdf, setPdf] = useState<{ url: string; filedInto: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = (k: string, v: unknown) => {
    setAnswers((a) => ({ ...a, [k]: v }));
    if (live && !completed) {
      setSaveState('saving');
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          await api.saveAnswers(live.submissionId, { ...answers, [k]: v });
          setSaveState('saved');
        } catch {
          setSaveState('idle');
        }
      }, 600);
    }
  };

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  async function complete() {
    if (!live) {
      setCompleted(true);
      return;
    }
    setBusy(true);
    setMissing([]);
    try {
      const res = await api.completeSubmission(live.submissionId);
      setCompleted(true);
      setWarnings(res.warnings.map((w) => ({ label: w.label, value: w.value, unit: w.unit })));
    } catch (e: any) {
      try {
        const parsed = JSON.parse(e.message);
        if (parsed.missingRequired) setMissing(parsed.missingRequired);
      } catch {
        setMissing([{ label: e.message, section: '' }]);
      }
    } finally {
      setBusy(false);
    }
  }

  async function sign(dataUrl: string) {
    if (!live) {
      setSigned(true);
      return;
    }
    await api.signSubmission(live.submissionId, { signerRole: 'engineer', signerName: 'Lee Moore', imageDataUrl: dataUrl });
    setSigned(true);
  }

  async function makePdf() {
    if (!live) return;
    setBusy(true);
    try {
      const res = await api.generatePdf(live.submissionId);
      setPdf({ url: apiBase + res.pdfUrl, filedInto: res.filedInto });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold">{schema.title}</h2>
          <p className="text-[12px] text-muted">
            {live ? `Live submission · ${live.jobLabel}` : 'Demo — connect the API to save & generate the PDF'}
            {live && saveState !== 'idle' && (
              <span className="ml-2 text-[11px]">{saveState === 'saving' ? '· Saving…' : '· Saved ✓'}</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={onClose}>Back to templates</button>
          {!completed && (
            <button className="btn btn-primary" onClick={complete} disabled={busy}>
              <IconCheck size={14} /> Complete
            </button>
          )}
        </div>
      </div>

      {missing.length > 0 && (
        <div className="mb-3 rounded-md border border-danger/30 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
          <div className="mb-1 flex items-center gap-1 font-semibold"><IconAlertTriangle size={14} /> Required fields missing</div>
          {missing.map((m) => `${m.section ? m.section + ' · ' : ''}${m.label}`).join(', ')}
        </div>
      )}

      {completed && (
        <div className="mb-3 rounded-md border border-ok/30 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-800">
          <div className="flex items-center gap-1 font-semibold"><IconCheck size={14} /> Completed</div>
          {warnings.length > 0 && (
            <div className="mt-1 text-amber-700">
              Out-of-band readings noted: {warnings.map((w) => `${w.label} (${w.value}${w.unit ?? ''})`).join(', ')}
            </div>
          )}
        </div>
      )}

      <div className="max-w-3xl space-y-4">
        {schema.sections.map((section) => (
          <div key={section.title} className="overflow-hidden rounded-card border border-line bg-white">
            <div className="border-b border-line bg-slate-50 px-4 py-2.5 text-[13px] font-semibold">{section.title}</div>
            <div className="grid grid-cols-2 gap-4 p-4">
              {section.fields.map((f) => (
                <div key={f.key} className={f.type === 'textarea' || f.type === 'attachment' ? 'col-span-2' : ''}>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                    {f.label} {f.required && <span className="text-danger">*</span>}
                  </label>
                  <Field field={f} value={answers[f.key]} onChange={(v) => set(f.key, v)} disabled={completed} />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Sign-off + PDF */}
        {completed && (
          <div className="overflow-hidden rounded-card border border-line bg-white">
            <div className="border-b border-line bg-slate-50 px-4 py-2.5 text-[13px] font-semibold">Sign-off & report</div>
            <div className="grid grid-cols-2 gap-6 p-4">
              <SignaturePad label="Engineer signature" onSave={sign} saved={signed} />
              <div className="flex flex-col justify-between">
                <div className="text-[12px] text-muted">
                  Generate the branded PDF; it is stored and auto-filed into the site's report folder.
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  <button className="btn btn-primary" onClick={makePdf} disabled={busy || !live}>
                    <IconFileText size={14} /> Generate PDF
                  </button>
                  {pdf && (
                    <a className="text-[12px] text-brand hover:underline" href={pdf.url} target="_blank" rel="noreferrer">
                      Open report — filed into “{pdf.filedInto}” ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
