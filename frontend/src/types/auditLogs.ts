export interface AuditLogEntry {
  id: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  actor_name: string;
  actor_role: string;
  site_id: string | null;
  site_name: string | null;
  created_at: string;
}
