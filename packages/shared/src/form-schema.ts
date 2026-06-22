// Data-driven form schema shared by the renderer (web), validation (api), and
// PDF generation. A FormTemplate.schema is a FormSchema. Adding an asset type or
// revising a checklist is pure data — no code change.

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'date'
  | 'reading' // numeric reading with unit + optional pass range
  | 'attachment'
  | 'signature';

export interface FormField {
  key: string;
  label: string;
  type: FieldType;
  unit?: string;
  required?: boolean;
  options?: string[];
  multiple?: boolean;
  /** For `reading` fields: inclusive pass band; values outside flag a warning. */
  min?: number;
  max?: number;
  help?: string;
}

export interface FormSection {
  title: string;
  description?: string;
  fields: FormField[];
}

export interface FormSchema {
  /** Stable identifier, e.g. "chiller_ppm_6m". */
  key: string;
  title: string;
  /** Free-form metadata used for routing templates to assets/jobs. */
  assetType?: string;
  jobType?: string;
  ppmScope?: string;
  sections: FormSection[];
  requiresSignoff?: boolean;
}

/** Answers are keyed by field.key. Attachment/signature values are storage refs. */
export type FormAnswers = Record<string, unknown>;
