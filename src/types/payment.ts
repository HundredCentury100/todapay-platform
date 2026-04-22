export type PaymentMethodType = 'cash' | 'bank_transfer' | 'mobile_money' | 'payment_gateway';
export type MobileMoneyProvider = 
  | 'mpesa' // Kenya, Tanzania, South Africa
  | 'mtn_money' // Uganda, Ghana, Nigeria, etc.
  | 'airtel_money' // 14+ African countries
  | 'orange_money' // West & Central Africa
  | 'tigo_pesa' // Tanzania
  | 'vodacom_mpesa' // DRC, Mozambique
  | 'ecocash' // Zimbabwe
  | 'moov_money' // West Africa
  | 'wave' // Senegal, Ivory Coast
  | 'chipper_cash' // Pan-African
  | 'telecash' // DRC
  | 'flooz' // Togo, Benin
  | 'tmoney' // Togo
  | 'omari' // Zimbabwe (Old Mutual);

export type PaymentGatewayProvider =
  | 'flutterwave' // Pan-African
  | 'paystack' // Nigeria, Ghana, South Africa
  | 'fawry' // Egypt
  | 'dpo' // Pan-African (DPO Group)
  | 'stripe'
  | 'paypal';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'pending_verification' | 'cash_pending';
export type BillPaymentStatus = 'pending' | 'paid' | 'overdue';
export type AccountStatus = 'active' | 'suspended' | 'warning';

export interface BankTransferConfig {
  bank_name: string;
  account_number: string;
  account_name: string;
  swift_code?: string;
  instructions?: string;
}

export interface MobileMoneyConfig {
  provider: MobileMoneyProvider;
  shortcode: string;
  business_number: string;
  instructions?: string;
  countries?: string[]; // Supported countries for this provider
}

export interface PaymentGatewayConfig {
  gateway_provider: PaymentGatewayProvider;
  merchant_id?: string;
  api_key?: string;
  test_mode?: boolean;
  supported_currencies?: string[];
  countries?: string[]; // Supported countries for this gateway
}

export interface MerchantPaymentMethod {
  id: string;
  merchant_profile_id: string;
  payment_type: PaymentMethodType;
  is_active: boolean;
  configuration: BankTransferConfig | MobileMoneyConfig | PaymentGatewayConfig | Record<string, never>;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  booking_id: string;
  merchant_profile_id: string;
  amount: number;
  platform_fee_percentage: number;
  platform_fee_amount: number;
  merchant_amount: number;
  payment_method: string;
  payment_status: PaymentStatus;
  payment_proof_url?: string;
  transaction_reference: string;
  payment_metadata: Record<string, any>;
  booked_by_agent_id?: string;
  agent_commission_deducted?: boolean;
  agent_remittance_amount?: number;
  agent_payment_method?: string;
  created_at: string;
  updated_at: string;
}

export interface PlatformFeeBill {
  id: string;
  merchant_profile_id: string;
  billing_period_start: string;
  billing_period_end: string;
  total_transactions: number;
  total_revenue: number;
  total_platform_fees: number;
  payment_status: BillPaymentStatus;
  due_date: string;
  paid_at?: string;
  payment_reference?: string;
  created_at: string;
  updated_at: string;
}

export interface MerchantAccountStatus {
  merchant_profile_id: string;
  account_status: AccountStatus;
  suspension_reason?: string;
  suspended_at?: string;
  suspended_until?: string;
  outstanding_balance: number;
  last_payment_date?: string;
  updated_at: string;
}
