export type ProjectStatus = 'PLANNED' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CLOSED';

export interface Project {
  id: string;
  name: string;
  province: string;
  province_id?: string;
  program_code?: string;
  start_date: string;
  end_date?: string | null;
  budget?: number | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectDto {
  name: string;
  province_id: string;
  program_code?: string;
  start_date: string;
  end_date?: string;
  budget?: number;
  status?: ProjectStatus;
}

export interface UpdateProjectDto extends Partial<CreateProjectDto> {
  status?: ProjectStatus;
}
