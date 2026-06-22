import { useState } from 'react';
import type { FormField, FormSchema } from '@fsm/shared';
import { IconSignature, IconPaperclip } from '@tabler/icons-react';

// Maps a data-driven FormSchema field → an input. Adding a field type here is the
// only code change ever needed; the forms themselves are pure data.
function Field({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const base =
    'w-full rounded-md border border-line px-2.5 py-1.5 text-[13px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/10';

  const outOfRange =
    field.type === 'reading' &&
    typeof value === 'string' &&
    value !== '' &&
    ((field.min != null && Number(value) < field.min) ||
      (field.max != null && Number(value) > field.max));

  switch (field.type) {
    case 'textarea':
      return <textarea className={`${base} min-h-[64px]`} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'select':
      return (
        <select className={base} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {field.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    case 'checkbox':
      return (
        <label className="flex items-center gap-2 text-[13px]">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-brand" />
          <span className="text-muted">Done / verified</span>
        </label>
      );
    case 'date':
      return <input type="date" className={base} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'number':
      return <input type="number" className={base} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'reading':
      return (
        <div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              className={`${base} ${outOfRange ? 'border-danger focus:border-danger focus:ring-danger/10' : ''}`}
              value={(value as string) ?? ''}
              onChange={(e) => onChange(e.target.value)}
            />
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
        <button className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-line py-3 text-[12px] text-muted hover:border-brand hover:text-brand">
          <IconPaperclip size={14} /> Add photo{field.multiple ? 's' : ''}
        </button>
      );
    case 'signature':
      return (
        <button className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-line py-4 text-[12px] text-muted hover:border-brand hover:text-brand">
          <IconSignature size={16} /> Capture signature
        </button>
      );
    default:
      return <input className={base} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />;
  }
}

export function FormRenderer({ schema, onClose }: { schema: FormSchema; onClose: () => void }) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const set = (k: string, v: unknown) => setAnswers((a) => ({ ...a, [k]: v }));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold">{schema.title}</h2>
          <p className="text-[12px] text-muted">
            Data-driven template · {schema.sections.length} sections · auto-saves as draft
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={onClose}>
            Back to templates
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            Complete & generate PDF
          </button>
        </div>
      </div>

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
                  <Field field={f} value={answers[f.key]} onChange={(v) => set(f.key, v)} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
