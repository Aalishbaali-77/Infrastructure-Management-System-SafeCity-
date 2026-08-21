export type Role = string;
export interface DummyUser {
  id: string;
  email: string;
  password: string; // dummy-only, removed before it reaches AuthUser
  name: string;
  phone: string;
  is_active: boolean;
  role: Role;
  province_ids: string[];
  site_ids: string[];
  project_ids: string[];
  contractor_id: string | null;
  created_at: string;
}
