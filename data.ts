export const ORDER_REPORT_HEADERS = [
  'sale_id',
  'event_id_raw',
  'confirmation_number',
  'order_email',
  'ca_address',
  'ca_city',
  'ca_state',
  'ca_country',
  'ca_zip',
  'sale_time',
  'customer_first_name',
  'customer_last_name',
  'total_paid',
  'num_canceled_tickets',
  'customer_address',
  'customer_phone_number',
  'reservation_start',
  'event_start_date',
  'member_id',
] as const;

export const SALES_REPORT_HEADERS_BASE = [
  'transaction_type',
  'event_name',
  'event_id',
  'confirmation_number',
  'price_level_name',
  'count_canceled_tickets',
  'count_transactions',
  'count_live_tickets',
  'total_charges_amount',
  'total_amount',
  'event_start',
  'venue_timezone_name',
] as const;

export const SALES_REPORT_BASE_EXPANDING_COLUMNS = [
  'ticket_fees_ti',
  'transaction_details_financials_collected',
  'ticket_fees_sc',
  'transaction_details_financials_owed',
] as const;

export const SALES_REPORT_EXPANDING_COLUMNS = [
  'credit_card_fee_collected',
  'seller_tax_collected',
  'ticket_face_value_collected',
  'ticket_service_fees_collected',
  'ticket_discounts_collected',
  'credit_card_processing_fee_owed',
  'service_fee_owed',
] as const;

export const SALES_REPORT_HEADERS = [
  ...SALES_REPORT_HEADERS_BASE,
  ...SALES_REPORT_EXPANDING_COLUMNS,
] as const;

export const ATTENDEES_REPORT_HEADERS = [
  'confirmation_number',
  'name_on_order',
  'name_on_ticket',
  'event_name',
  'price_level_name',
  'status',
  'order_email',
  'sale_id',
  'barcode',
  'latest_scan_status',
  'ticket_id',
  'event_id',
  'member_id',
  'customer_first_name',
  'customer_last_name',
  'order_id',
  'purchase_time',
  'ip_address',
  'event_start',
  'order_completed_time',
] as const;
