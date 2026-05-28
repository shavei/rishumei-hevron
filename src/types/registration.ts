// Domain types for registrations + questions (spec §13).

export type QuestionType =
  | 'presence'
  | 'yes_no'
  | 'single_choice'
  | 'multi_choice'
  | 'text';

export interface QuestionOption {
  value: string;
  label: string;
}

export interface ConditionalRule {
  question_id: string;
  /** For presence: 'present' | 'absent' | 'undecided'. */
  equals: string | number | boolean;
}

export interface QuestionLabels {
  present?: string;
  absent?: string;
  undecided?: string;
  yes?: string;
  no?: string;
}

export interface QuestionDef {
  id: string;
  type: QuestionType;
  label: string;
  help_text?: string | null;
  required: boolean;
  options?: QuestionOption[];
  allow_other?: boolean;
  labels?: QuestionLabels;
  conditional_on?: ConditionalRule | null;
}

/** A single response answer, keyed by question id. */
export type ResponseValue = string | string[] | number | boolean;
export type ResponseValues = Record<string, ResponseValue>;

export type RegistrationStatus =
  | 'draft'
  | 'scheduled'
  | 'open'
  | 'closed'
  | 'archived';

export interface Registration {
  id: string;
  title: string;
  description: string | null;
  status: RegistrationStatus;
  opens_at: string | null;
  closes_at: string;
  edit_until: string | null;
  questions_schema: QuestionDef[];
  audience_summary: Record<string, unknown>;
  created_at: string;
  published_at: string | null;
  closed_at: string | null;
  archived_at: string | null;
  admin_note: string | null;
  template_id: string | null;
}

/** Per-student three-state status (spec §24, Glossary). Distinct from answer values. */
export type StudentRegStatus = 'sent' | 'seen' | 'responded';

/** Default Hebrew labels for fixed-value question types (spec §13.1). */
export const DEFAULT_PRESENCE_LABELS = {
  present: 'נוכח',
  absent: 'לא נוכח',
  undecided: 'מתלבט',
} as const;

export const DEFAULT_YES_NO_LABELS = {
  yes: 'כן',
  no: 'לא',
} as const;
