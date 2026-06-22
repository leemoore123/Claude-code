import type { FormSchema } from '@fsm/shared';

export interface ValidationReport {
  missingRequired: { key: string; label: string; section: string }[];
  outOfRange: { key: string; label: string; value: number; min?: number; max?: number; unit?: string }[];
}

/**
 * Validates answers against a (snapshotted) schema. Missing required fields
 * block completion; out-of-range readings are warnings only.
 */
export function validateSubmission(schema: FormSchema, answers: Record<string, unknown>): ValidationReport {
  const report: ValidationReport = { missingRequired: [], outOfRange: [] };

  for (const section of schema.sections) {
    for (const f of section.fields) {
      // Signatures and attachments are captured outside the answers map, so
      // they are never "missing required" here.
      if (f.type === 'signature' || f.type === 'attachment') continue;
      const v = answers[f.key];
      const empty = v === undefined || v === null || v === '';
      if (f.required && empty) {
        report.missingRequired.push({ key: f.key, label: f.label, section: section.title });
      }
      if (f.type === 'reading' && !empty) {
        const n = Number(v);
        if (!Number.isNaN(n) && ((f.min != null && n < f.min) || (f.max != null && n > f.max))) {
          report.outOfRange.push({ key: f.key, label: f.label, value: n, min: f.min, max: f.max, unit: f.unit });
        }
      }
    }
  }
  return report;
}
