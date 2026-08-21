export interface ContractorPerformance {
  id: string;
  contractor_id: string;
  contractor_name: string;
  site_id: string;
  site_name: string;
  cpi_score: number; // 0-100
  quality_score: number;
  timeliness_score: number;
  safety_score: number;
  period: string;
}
