export type DeviationSource = 'AUTO' | 'MANUAL';

export type DeviationType = 'QTY_OVERRUN' | 'QTY_UNDERRUN' | 'OTHER';

export type DeviationSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR';

export type DeviationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'HOD_REVIEW'
  | 'DIR_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CONDITIONAL'
  | 'CLOSED';

/** Mirrors backend ExecutionDeviationReadSerializer. */
export interface Deviation {
  id: string;
  ncr_number: string;
  site_id: string;
  site_name: string;
  site_task_id: string | null;
  site_task_name: string | null;
  boq_item_id: string | null;
  boq_item_name: string | null;
  source: DeviationSource;
  deviation_type: DeviationType;
  severity: DeviationSeverity;
  status: DeviationStatus;
  planned_quantity: number | string | null;
  actual_quantity: number | string | null;
  variance_quantity: number | string | null;
  variance_pct: number | string | null;
  description: string;
  remarks: string;
  evidence_document_ids: string[];
  linked_progress_ids: string[];
  blocks_fac: boolean;
  raised_by_id: string | null;
  raised_by_name: string | null;
  approved_by_id: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Mirrors backend ExecutionDeviationWriteSerializer (manual create only). */
export type DeviationWrite = {
  site_id: string;
  site_task_id?: string | null;
  deviation_type: 'OTHER';
  severity: DeviationSeverity;
  description: string;
  remarks?: string;
};
