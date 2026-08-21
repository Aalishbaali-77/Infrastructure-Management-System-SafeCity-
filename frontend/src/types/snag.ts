export interface SnagItem {
  id: string;
  site_id: string;
  site_name: string;
  description: string;
  priority: 'CRITICAL' | 'MAJOR' | 'MINOR';
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'WAIVED';
  raised_by: string;
  created_at: string;
}
