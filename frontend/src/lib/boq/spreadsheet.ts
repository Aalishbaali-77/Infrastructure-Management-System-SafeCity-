import * as XLSX from 'xlsx';
import type { GridColDef } from '@mui/x-data-grid';
import type { BOQItemWrite } from '@/types/boq';

export function formatBoqNumber(value: unknown, digits = 2) {
  const n = Number(value ?? 0);
  if (Number.isNaN(n)) return '0';
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

/** Exact spreadsheet column order provided for SC-GIMS BOQ import. */
export const BOQ_SPREADSHEET_COLUMNS: GridColDef[] = [
  { field: 'pc1', headerName: 'PC1', width: 90 },
  { field: 'no', headerName: 'NO.', width: 70 },
  { field: 'item_type', headerName: 'ITEM TYPE', width: 120 },
  { field: 'item', headerName: 'ITEM', width: 140 },
  { field: 'item_description', headerName: 'Item Description', width: 240 },
  { field: 'model_name', headerName: 'Model Name', width: 140 },
  { field: 'model', headerName: 'Model', width: 120 },
  { field: 'oem', headerName: 'OEM', width: 120 },
  { field: 'unit', headerName: 'UNIT', width: 80 },
  {
    field: 'package_qty',
    headerName: 'Package Qty',
    width: 110,
    valueFormatter: (v) => formatBoqNumber(v),
  },
  {
    field: 'qty',
    headerName: 'QTY',
    width: 90,
    valueFormatter: (v) => formatBoqNumber(v),
  },
  {
    field: 'fob',
    headerName: 'FOB',
    width: 100,
    valueFormatter: (v) => formatBoqNumber(v, 4),
  },
  {
    field: 'fob_total',
    headerName: 'FOB Total',
    width: 120,
    valueFormatter: (v) => formatBoqNumber(v, 4),
  },
  { field: 'hs_code_description', headerName: 'HS Code Description', width: 180 },
  { field: 'hs_code', headerName: 'HS Code', width: 110 },
  { field: 'curr', headerName: 'CURR', width: 80 },
  { field: 'tax', headerName: 'TAX', width: 80 },
  {
    field: 'curr_rate',
    headerName: 'CURR Rate',
    width: 100,
    valueFormatter: (v) => formatBoqNumber(v, 4),
  },
  {
    field: 'bank_charges_pct',
    headerName: 'Bank Charges %',
    width: 120,
    valueFormatter: (v) => formatBoqNumber(v, 4),
  },
  {
    field: 'freight_pct',
    headerName: 'Freight %',
    width: 100,
    valueFormatter: (v) => formatBoqNumber(v, 4),
  },
  {
    field: 'landing_pct',
    headerName: 'Landing %',
    width: 100,
    valueFormatter: (v) => formatBoqNumber(v, 4),
  },
  {
    field: 'insurance_pct',
    headerName: 'Insurance %',
    width: 110,
    valueFormatter: (v) => formatBoqNumber(v, 4),
  },
  {
    field: 'cd_pct',
    headerName: 'CD%',
    width: 80,
    valueFormatter: (v) => formatBoqNumber(v, 4),
  },
  {
    field: 'acd_pct',
    headerName: 'ACD%',
    width: 80,
    valueFormatter: (v) => formatBoqNumber(v, 4),
  },
  {
    field: 'rd_pct',
    headerName: 'RD%',
    width: 80,
    valueFormatter: (v) => formatBoqNumber(v, 4),
  },
  {
    field: 'st_pct',
    headerName: 'ST%',
    width: 80,
    valueFormatter: (v) => formatBoqNumber(v, 4),
  },
  {
    field: 'ast_pct',
    headerName: 'AST%',
    width: 80,
    valueFormatter: (v) => formatBoqNumber(v, 4),
  },
  {
    field: 'it_pct',
    headerName: 'IT%',
    width: 80,
    valueFormatter: (v) => formatBoqNumber(v, 4),
  },
  {
    field: 'cess_pct',
    headerName: 'CESS%',
    width: 80,
    valueFormatter: (v) => formatBoqNumber(v, 4),
  },
  {
    field: 'bank_charges',
    headerName: 'BankCharges',
    width: 120,
    valueFormatter: (v) => formatBoqNumber(v, 4),
  },
  {
    field: 'freight_insurance',
    headerName: 'F/I',
    width: 100,
    valueFormatter: (v) => formatBoqNumber(v, 4),
  },
  {
    field: 'price_with_fi',
    headerName: 'PriceWithF/I',
    width: 120,
    valueFormatter: (v) => formatBoqNumber(v, 4),
  },
  {
    field: 'landing',
    headerName: 'Landing',
    width: 100,
    valueFormatter: (v) => formatBoqNumber(v, 4),
  },
  {
    field: 'price_with_landing',
    headerName: 'PriceWithLanding (AF+AG)',
    width: 170,
    valueFormatter: (v) => formatBoqNumber(v, 4),
  },
  {
    field: 'insurance',
    headerName: 'Insurance',
    width: 100,
    valueFormatter: (v) => formatBoqNumber(v, 4),
  },
  {
    field: 'price_with_insurance',
    headerName: 'PriceWithInsurance (AH+AI)',
    width: 180,
    valueFormatter: (v) => formatBoqNumber(v, 4),
  },
  {
    field: 'custom_duty',
    headerName: 'CustomDuty',
    width: 110,
    valueFormatter: (v) => formatBoqNumber(v, 4),
  },
  {
    field: 'addl_custom_duty',
    headerName: 'AddlCustomDuty',
    width: 130,
    valueFormatter: (v) => formatBoqNumber(v, 4),
  },
  {
    field: 'regulatory_duty',
    headerName: 'RegulatoryDuty',
    width: 130,
    valueFormatter: (v) => formatBoqNumber(v, 4),
  },
  {
    field: 'sales_tax',
    headerName: 'SalesTax',
    width: 100,
    valueFormatter: (v) => formatBoqNumber(v, 4),
  },
  {
    field: 'addl_sales_tax',
    headerName: 'AddlSalesTax',
    width: 120,
    valueFormatter: (v) => formatBoqNumber(v, 4),
  },
  {
    field: 'income_tax',
    headerName: 'IncomeTax',
    width: 100,
    valueFormatter: (v) => formatBoqNumber(v, 4),
  },
  {
    field: 'cess_tax',
    headerName: 'CessTax',
    width: 100,
    valueFormatter: (v) => formatBoqNumber(v, 4),
  },
  {
    field: 'ddp_unit_usd',
    headerName: 'DDPUnit USD',
    width: 120,
    valueFormatter: (v) => formatBoqNumber(v, 4),
  },
  {
    field: 'total_ddp_usd',
    headerName: 'TotalDDP USD',
    width: 120,
    valueFormatter: (v) => formatBoqNumber(v, 4),
  },
  {
    field: 'ddp_unit_pkr',
    headerName: 'DDPUnit PKR',
    width: 120,
    valueFormatter: (v) => formatBoqNumber(v),
  },
  {
    field: 'total_ddp_pkr',
    headerName: 'TotalDDP PKR',
    width: 130,
    valueFormatter: (v) => formatBoqNumber(v),
  },
];

type FieldKey = keyof BOQItemWrite;

const HEADER_ALIASES: Record<string, FieldKey> = {
  pc1: 'pc1',
  no: 'no',
  'no.': 'no',
  itemtype: 'item_type',
  item: 'item',
  itemdescription: 'item_description',
  modelname: 'model_name',
  model: 'model',
  oem: 'oem',
  unit: 'unit',
  packageqty: 'package_qty',
  qty: 'qty',
  fob: 'fob',
  // fob total is derived — ignore on write
  hscodedescription: 'hs_code_description',
  hscode: 'hs_code',
  curr: 'curr',
  tax: 'tax',
  currrate: 'curr_rate',
  freight: 'freight_pct',
  cd: 'cd_pct',
  acd: 'acd_pct',
  rd: 'rd_pct',
  st: 'st_pct',
  ast: 'ast_pct',
  it: 'it_pct',
  cess: 'cess_pct',
  fi: 'freight_insurance',
  'f/i': 'freight_insurance',
  pricewithfi: 'price_with_fi',
  'pricewithf/i': 'price_with_fi',
  customduty: 'custom_duty',
  addlcustomduty: 'addl_custom_duty',
  regulatoryduty: 'regulatory_duty',
  salestax: 'sales_tax',
  addlsalestax: 'addl_sales_tax',
  incometax: 'income_tax',
  cesstax: 'cess_tax',
  ddpunitusd: 'ddp_unit_usd',
  ddpunitpkr: 'ddp_unit_pkr',
};

function normalizeHeader(raw: unknown): string {
  return String(raw ?? '')
    .replace(/\r?\n/g, ' ')
    .replace(/["']/g, '')
    .replace(/%/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-zA-Z0-9/]/g, '')
    .toLowerCase()
    .trim();
}

function toNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  const cleaned = String(value).replace(/,/g, '').trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : fallback;
}

function toString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

const EMPTY_ITEM = (): BOQItemWrite => ({
  pc1: '',
  no: 1,
  item_type: '',
  item: '',
  item_description: '',
  model_name: '',
  model: '',
  oem: '',
  unit: 'NOS',
  package_qty: 0,
  qty: 0,
  actual_quantity: 0,
  fob: 0,
  hs_code_description: '',
  hs_code: '',
  curr: 'USD',
  tax: '',
  curr_rate: 0,
  bank_charges_pct: 0,
  freight_pct: 0,
  landing_pct: 0,
  insurance_pct: 0,
  cd_pct: 0,
  acd_pct: 0,
  rd_pct: 0,
  st_pct: 0,
  ast_pct: 0,
  it_pct: 0,
  cess_pct: 0,
  bank_charges: 0,
  freight_insurance: 0,
  price_with_fi: 0,
  landing: 0,
  insurance: 0,
  custom_duty: 0,
  addl_custom_duty: 0,
  regulatory_duty: 0,
  sales_tax: 0,
  addl_sales_tax: 0,
  income_tax: 0,
  cess_tax: 0,
  ddp_unit_usd: 0,
  ddp_unit_pkr: 0,
  quantity_tolerance_pct: 5,
});

const STRING_FIELDS = new Set<FieldKey>([
  'pc1',
  'item_type',
  'item',
  'item_description',
  'model_name',
  'model',
  'oem',
  'unit',
  'hs_code_description',
  'hs_code',
  'curr',
  'tax',
]);

const SKIP_HEADERS = new Set([
  'fobtotal',
  'pricewithlanding',
  'pricewithlandingafag',
  'pricewithinsurance',
  'pricewithinsuranceahai',
  'totalddpusd',
  'totalddppkr',
]);

/**
 * Map spreadsheet headers → fields, disambiguating duplicate names
 * (Landing % vs Landing amount, Insurance % vs Insurance amount, Bank Charges).
 */
function resolveField(normalized: string, seen: Set<string>): FieldKey | null {
  if (SKIP_HEADERS.has(normalized)) return null;

  if (normalized === 'bankcharges') {
    if (!seen.has('bank_charges_pct')) return 'bank_charges_pct';
    return 'bank_charges';
  }
  if (normalized === 'landing') {
    if (!seen.has('landing_pct')) return 'landing_pct';
    return 'landing';
  }
  if (normalized === 'insurance') {
    if (!seen.has('insurance_pct')) return 'insurance_pct';
    return 'insurance';
  }
  if (normalized === 'freight') {
    return 'freight_pct';
  }

  return HEADER_ALIASES[normalized] ?? null;
}

export function parseBoqSpreadsheet(file: ArrayBuffer): BOQItemWrite[] {
  const workbook = XLSX.read(file, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: '',
    raw: true,
  });
  if (rows.length < 2) return [];

  const headerRow = rows[0] ?? [];
  const fieldByIndex: Array<FieldKey | null> = [];
  const seen = new Set<string>();

  headerRow.forEach((cell, idx) => {
    const normalized = normalizeHeader(cell);
    const field = resolveField(normalized, seen);
    if (field) seen.add(field);
    fieldByIndex[idx] = field;
  });

  const items: BOQItemWrite[] = [];
  for (let r = 1; r < rows.length; r += 1) {
    const row = rows[r] ?? [];
    const item = EMPTY_ITEM();
    let hasIdentity = false;

    row.forEach((cell, idx) => {
      const field = fieldByIndex[idx];
      if (!field) return;
      if (STRING_FIELDS.has(field)) {
        const s = toString(cell);
        (item as unknown as Record<string, string | number>)[field] = s;
        if ((field === 'item' || field === 'item_description') && s) hasIdentity = true;
      } else if (field === 'no') {
        item.no = Math.max(1, Math.floor(toNumber(cell, r)));
        if (toString(cell)) hasIdentity = true;
      } else {
        (item as unknown as Record<string, string | number>)[field] = toNumber(cell);
      }
    });

    if (!hasIdentity && !item.item && !item.item_description) continue;
    if (!item.item) item.item = `ROW-${r}`;
    if (!item.item_description) item.item_description = item.item;
    if (!item.unit) item.unit = 'NOS';
    if (!item.price_with_fi && item.fob) item.price_with_fi = item.fob;
    items.push(item);
  }

  return items;
}
