export type HSESeverity = 'MINOR' | 'MAJOR' | 'CRITICAL';
export type HSEStatus = 'OPEN' | 'CLEARED';

export interface HSEIncident {
  id: string;
  site_id: string;
  site_name: string;
  incident_number: string;
  severity: HSESeverity;
  status: HSEStatus;
  occurred_at: string;
}
