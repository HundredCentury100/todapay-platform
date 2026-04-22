// Fund Collection Model Types

export type FundCollectionModel = 'platform_first' | 'merchant_collects' | 'escrow';
export type PayoutFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';
export type EscrowStatus = 'pending' | 'released' | 'refunded' | 'disputed';
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface MerchantFundSettings {
  fund_collection_model: FundCollectionModel;
  escrow_release_days: number;
  auto_payout_enabled: boolean;
  payout_frequency: PayoutFrequency;
  payout_method: string;
  payout_details: Record<string, any>;
}

export interface EscrowHold {
  id: string;
  transaction_id?: string;
  booking_id?: string;
  merchant_profile_id: string;
  amount: number;
  platform_fee_amount: number;
  merchant_amount: number;
  service_date?: string;
  hold_until: string;
  status: EscrowStatus;
  released_at?: string;
  release_notes?: string;
  dispute_reason?: string;
  disputed_at?: string;
  refund_amount?: number;
  refunded_at?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  merchant_profile?: {
    business_name: string;
    business_email: string;
  };
  booking?: {
    booking_reference: string;
    item_name: string;
  };
}

export interface MerchantPayout {
  id: string;
  merchant_profile_id: string;
  amount: number;
  fee_deducted: number;
  payout_method: string;
  payout_details: Record<string, any>;
  payout_reference?: string;
  status: PayoutStatus;
  processed_by?: string;
  processed_at?: string;
  failure_reason?: string;
  notes?: string;
  period_start?: string;
  period_end?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  merchant_profile?: {
    business_name: string;
    business_email: string;
  };
}

export interface PayoutItem {
  id: string;
  payout_id: string;
  transaction_id?: string;
  escrow_hold_id?: string;
  amount: number;
  created_at: string;
}

export interface AdminServiceAction {
  id: string;
  admin_id: string;
  merchant_profile_id: string;
  service_type: string;
  service_id: string;
  action_type: 'create' | 'update' | 'delete';
  action_reason?: string;
  previous_data?: Record<string, any>;
  new_data?: Record<string, any>;
  created_at: string;
  // Joined data
  merchant_profile?: {
    business_name: string;
  };
}

export type ServiceType = 
  | 'bus_schedule' 
  | 'event' 
  | 'venue' 
  | 'property' 
  | 'workspace' 
  | 'experience' 
  | 'vehicle' 
  | 'transfer_service';

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  bus_schedule: 'Bus Schedule',
  event: 'Event',
  venue: 'Venue',
  property: 'Property',
  workspace: 'Workspace',
  experience: 'Experience',
  vehicle: 'Vehicle',
  transfer_service: 'Transfer Service',
};

export const SERVICE_TYPE_ICONS: Record<ServiceType, string> = {
  bus_schedule: 'Bus',
  event: 'Calendar',
  venue: 'Building2',
  property: 'Hotel',
  workspace: 'Laptop',
  experience: 'Compass',
  vehicle: 'Car',
  transfer_service: 'CarTaxiFront',
};
