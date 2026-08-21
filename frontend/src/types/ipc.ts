export type IPCStatus = 'DRAFT' | 'SITE_CERTIFIED' | 'HOD_CERTIFIED' | 'DIRECTOR_APPROVED' | 'PAID';

export interface IPCLineItem {
  id: string;
  ipc_id: string;
  boq_item_code: string;
  description: string;
  planned_quantity: number;
  certified_quantity: number;
  rate: number;
  amount: number;
  ncr_excluded: boolean;
  exclusion_reason?: string;
}

export interface IPC {
  id: string;
  site_id: string;
  site_name: string;
  period: string;
  status: IPCStatus;
  total_amount: number;
  certified_amount: number;
  submitted_by: string;
  created_at: string;
  line_items: IPCLineItem[];
}
