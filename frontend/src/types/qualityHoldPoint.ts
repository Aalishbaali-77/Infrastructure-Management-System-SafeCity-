export type HoldPointStatus = 'PENDING' | 'PASSED' | 'FAILED' | 'WAIVED';

export interface QualityHoldPoint {
  id: string;
  site_id: string;
  site_name: string;
  template_code: string;
  status: HoldPointStatus;
  work_package: string;
}
