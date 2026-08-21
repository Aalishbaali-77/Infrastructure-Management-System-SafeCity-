export type VOStatus =
  'DRAFT' | 'SUBMITTED' | 'HOD_REVIEW' | 'DIR_REVIEW' | 'APPROVED' | 'REJECTED';

export interface VariationOrder {
  id: string;
  site_id: string;
  site_name: string;
  deviation_id?: string;
  title: string;
  description: string;
  amount: number;
  status: VOStatus;
  submitted_by: string;
  created_at: string;
}
