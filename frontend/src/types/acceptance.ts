export type TCPhase = 'FAT' | 'SAT' | 'SIT' | 'PAT' | 'UAT' | 'RLT' | 'FAC';

export type TCStatus =
  'SCHEDULED' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'CONDITIONAL_PASS' | 'REWORK' | 'CANCELLED';

export type ChecklistResult = 'PENDING' | 'PASS' | 'FAIL' | 'NA' | 'CONDITIONAL';

export interface ChecklistItem {
  id: string;
  test_id: string;
  sequence: number;
  description: string;
  expected_result: string;
  result: ChecklistResult;
  remarks?: string;
  evidence_url?: string;
}

export interface AcceptanceTest {
  id: string;
  site_id: string;
  site_name: string;
  phase: TCPhase;
  status: TCStatus;
  discipline: string;
  scheduled_date: string;
  completed_date?: string;
  inspector: string;
  checklist_items: ChecklistItem[];
}
