export type SiteStatus = 'PLANNED' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CLOSED';

export interface Province {
  id: string;
  name: string;
  code: string;
  created_at?: string;
  updated_at?: string;
}

export interface District {
  id: string;
  province_id: string;
  province_name?: string;
  name: string;
  code: string;
  created_at?: string;
  updated_at?: string;
}

export interface Town {
  id: string;
  district_id: string;
  district_name?: string;
  province_id: string;
  province_name?: string;
  name: string;
  code: string;
  created_at?: string;
  updated_at?: string;
}

/** @deprecated Use Town — kept temporarily for gradual migration */
export type City = Town;

export interface Site {
  id: string;
  project_id: string;
  town_id: string;
  town_name?: string;
  district_id?: string;
  district_name?: string;
  province_id?: string;
  province_name?: string;
  name: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  geofence_radius_m: number;
  status: SiteStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateSiteDto {
  project_id: string;
  town_id: string;
  name: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  geofence_radius_m?: number;
}

export interface UpdateSiteDto extends Partial<CreateSiteDto> {
  status?: SiteStatus;
}
