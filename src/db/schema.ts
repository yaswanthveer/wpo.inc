export interface Firm {
  id: string;
  name: string;
  registration_number?: string;
  city?: string;
  state?: string;
  created_at: string;
}

export interface User {
  id: string;
  firm_id: string;
  full_name: string;
  designation: 'Partner' | 'Manager' | 'Senior' | 'Article';
  initials: string;
  email: string;
  created_at: string;
}

export interface Client {
  id: string;
  firm_id: string;
  name: string;
  pan?: string;
  city?: string;
  industry?: string;
  created_at: string;
}

// ── Stage 1: Planning Canvas ──
export interface PlanningData {
  engagement_letter_file?: string;       // file path to uploaded SA 210 letter
  engagement_letter_name?: string;
  engagement_letter_validated?: boolean;  // green checkmark state
  knowledge_of_business?: string;         // SA 315 text area content
  planning_finalized?: boolean;
  planning_finalized_at?: string;
}

// ── Stage 6: Archive & Compliance ──
export interface EngagementArchive {
  engagement_id: string;
  audit_report_date: string;
  assembly_deadline: string;             // report_date + 60 days
  archive_locked_at?: string;            // Day 61 lock timestamp
  is_locked: boolean;
  retention_expires_at: string;          // report_date + 7 years
  locked_by?: string;
}

export interface Engagement {
  id: string;
  firm_id: string;
  client_id: string;
  financial_year: string; // e.g., 'FY 2024-25'
  engagement_type: 'Statutory Audit' | 'Tax Audit' | 'Internal Audit';
  status: 'not-started' | 'in-progress' | 'review' | 'complete';
  partner_id?: string;
  manager_id?: string;
  created_at: string;
  updated_at: string;
  planning?: PlanningData;
  archive?: EngagementArchive;
}

export interface AuditArea {
  id: string;
  engagement_id: string;
  code: string; // 'GEN', 'RSK', 'CAN', 'TRE', 'INV', 'REV', 'PPE', 'LAD', 'EMP', 'TAX', 'RPT', 'CLO'
  name: string;
  status: 'pending' | 'in-progress' | 'review' | 'complete';
  completion_pct: number;
  assigned_to?: string;
  assigner_id?: string;  // Stage 2 assignment matrix
  assignee_id?: string; // Stage 2 assignment matrix
  target_date?: string; // Stage 2 target completion date
  is_custom?: boolean;  // Stage 2 custom injector
  created_at: string;
  updated_at: string;
}

// ── Stage 4: Submission Lock ──
export interface SubmissionLock {
  working_paper_id: string;
  audit_objective_assessed: string;
  sample_size_basis: string;
  substantive_conclusion: 'Satisfactory' | 'Modified' | 'Significant Unresolved Matters';
  positive_confirmation_checked: boolean;  // SA 200 guardrail
  locked_at: string;
  locked_by: string;
  lead_sheet_hash?: string;               // SHA-256 hash of uploaded raw test file
  version: number;                        // for bounce-back versioning
}

export interface WorkingPaper {
  id: string;
  area_id: string;
  engagement_id: string;
  reference_code: string; // 'WP-TRE-001'
  title: string;
  objective?: string;
  observations?: string;
  conclusion?: string; // AUDITOR WRITES THIS. NEVER AUTO-FILLED.
  status: 'draft' | 'review' | 'approved';
  prepared_by?: string;
  reviewed_by?: string;
  submission_lock?: SubmissionLock;       // Stage 4 lockout details
  version: number;                        // default is 1, increments on reject bounce-back
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  working_paper_id: string;
  name: string;
  reference_code?: string; // 'TRE/D/01'
  status: 'obtained' | 'alternative' | 'not-available' | 'skip-justified' | 'pending';
  note?: string; // auditor's note for alt/NA/skip decisions
  file_path?: string;
  file_name?: string;
  file_size?: number;
  uploaded_by?: string;
  created_at: string;
}

export interface Procedure {
  id: string;
  working_paper_id: string;
  description: string;
  status: 'pending' | 'done' | 'skipped';
  performed_by?: string;
  performed_at?: string; // date string YYYY-MM-DD
  skip_reason?: string;
  sort_order: number;
  created_at: string;
}

export interface AuditTrail {
  id: string;
  engagement_id?: string;
  working_paper_id?: string;
  user_id?: string;
  action: string;
  detail: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface SupabaseSettings {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isEnabled: boolean;
}

// ── Stage 3: Client Document Requests (PBC Matrix) ──
export interface ClientRequest {
  id: string;
  engagement_id: string;
  area_id: string;
  document_requested: string;
  period_context: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'pending-internal' | 'approved' | 'received' | 'verified' | 'rejected';
  requested_by: string; // FK → User
  client_uploaded_file?: string;
  client_uploaded_at?: string;
  manager_verified?: boolean;
  manager_comment?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientPortalToken {
  id: string;
  engagement_id: string;
  token: string;           // 14-day expiry encrypted/random token
  client_email: string;
  expires_at: string;
  otp_code?: string;       // Simulated SMS OTP code
  is_used: boolean;
  created_at: string;
}

// ── Stage 4: Interactive Observation Ledger ──
export interface Observation {
  id: string;
  working_paper_id: string;
  engagement_id: string;
  title: string;
  financial_impact: number;
  findings_description: string;
  excel_row_reference: string;
  disposition?: 'rectified' | 'waived' | 'escalated' | 'pending'; // Stage 5 Manager disposition
  disposition_reference?: string; // JV Number reference for rectified
  review_note?: string;           // Manager query text
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ── Stage 5: Quality Review Notes (Persisted) ──
export interface ReviewNote {
  id: string;
  working_paper_id: string;
  author_id: string;
  author_name: string;
  text: string;
  is_resolution?: boolean;
  created_at: string;
}

// ── Stage 6: Post-Lockdown Modification Override ──
export interface PostLockdownAddendum {
  id: string;
  engagement_id: string;
  reason: string;
  preparer_id: string;
  reviewer_id: string;
  content: string;
  ip_address: string;
  created_at: string;
}

// ── Accidental Deletion Protection Trash Bin ──
export interface TrashBinItem {
  id: string;
  deleted_at: string;
  type: 'audit_area';
  name: string;
  engagement_id: string;
  data: {
    area: AuditArea;
    workingPaper?: WorkingPaper;
    documents: Document[];
    procedures: Procedure[];
    clientRequests: ClientRequest[];
    observations: Observation[];
    reviewNotes: ReviewNote[];
  };
}
