export type Discipline = 'CIVIL' | 'ELECTRICAL' | 'FIBER' | 'CONDUIT' | 'NETWORKING';

export type TCPhase =
  | 'NOT_STARTED'
  | 'FAT'
  | 'SAT'
  | 'SIT'
  | 'PAT'
  | 'UAT'
  | 'RLT'
  | 'COMMISSIONING'
  | 'HANDOVER'
  | 'COMPLETE';

export type WorkPackageStatus = 'PLANNED' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';

export interface WorkPackage {
  id: string;
  site_id: string;
  discipline: Discipline;
  name: string;
  contractor_id: string | null;
  contract_reference: string | null;
  tc_phase: TCPhase;
  status: WorkPackageStatus;
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkPackageDto {
  site_id: string;
  discipline: Discipline;
  name: string;
  contractor_id?: string | null;
  contract_reference?: string | null;
  start_date: string;
  end_date?: string;
}

export interface UpdateWorkPackageDto extends Partial<CreateWorkPackageDto> {
  tc_phase?: TCPhase;
  status?: WorkPackageStatus;
}
