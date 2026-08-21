/** Mirrors backend `BOQ.STATUS_CHOICES`. */
export type BOQStatus = 'DRAFT' | 'UPLOADING' | 'PARSING' | 'READY' | 'PUBLISHED';

/**
 * Writable BOQ line fields — mirrors `BOQItemWriteSerializer`.
 * Derived Excel columns are computed on the backend and omitted here.
 */
export interface BOQItemWrite {
  pc1: string;
  no: number;
  item_type: string;
  item: string;
  item_description: string;
  model_name: string;
  model: string;
  oem: string;
  unit: string;
  package_qty: number;
  qty: number;
  actual_quantity: number;
  fob: number;
  hs_code_description: string;
  hs_code: string;
  curr: string;
  tax: string;
  curr_rate: number;
  bank_charges_pct: number;
  freight_pct: number;
  landing_pct: number;
  insurance_pct: number;
  cd_pct: number;
  acd_pct: number;
  rd_pct: number;
  st_pct: number;
  ast_pct: number;
  it_pct: number;
  cess_pct: number;
  bank_charges: number;
  freight_insurance: number;
  price_with_fi: number;
  landing: number;
  insurance: number;
  custom_duty: number;
  addl_custom_duty: number;
  regulatory_duty: number;
  sales_tax: number;
  addl_sales_tax: number;
  income_tax: number;
  cess_tax: number;
  ddp_unit_usd: number;
  ddp_unit_pkr: number;
  quantity_tolerance_pct: number;
}

/**
 * Read model — mirrors `BOQItemSerializer` (includes derived + legacy aliases).
 * Decimals may arrive as strings from DRF.
 */
export interface BOQItem extends BOQItemWrite {
  id: string;
  boq_id: string;
  fob_total: number | string;
  price_with_landing: number | string;
  price_with_insurance: number | string;
  total_ddp_usd: number | string;
  total_ddp_pkr: number | string;
  item_code: string;
  description: string;
  planned_quantity: number | string;
  amount: number | string;
  created_at: string;
  updated_at: string;
}

/** Mirrors `BOQSerializer`. */
export interface BOQ {
  id: string;
  project_id: string;
  project_name: string;
  version: number;
  status: BOQStatus;
  template: string | null;
  total_amount: number | string;
  items_count: number;
  created_at: string;
  updated_at: string;
}

/** Mirrors `BOQWriteSerializer`. */
export interface BOQWrite {
  project_id: string;
  version?: number;
  template?: string;
}
