export type WorkflowState =
  'DRAFT' | 'SUBMITTED' | 'HOD_REVIEW' | 'DIR_REVIEW' | 'APPROVED' | 'REJECTED';

export interface WorkflowStep {
  state: WorkflowState;
  actor?: string;
  actorRole?: string;
  timestamp?: string;
  comment?: string;
}

export interface WorkflowHistory {
  entityId: string;
  entityType: 'project' | 'site';
  currentState: WorkflowState;
  steps: WorkflowStep[];
}
