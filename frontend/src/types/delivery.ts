export interface DeliveryConfirmation {
  id: string;
  site_id: string;
  site_name: string;
  vendor_id: string;
  item_code: string;
  description: string;
  quantity: number;
  unit: string;
  status: 'PENDING' | 'CONFIRMED' | 'DISPUTED';
  delivery_date: string;
}
