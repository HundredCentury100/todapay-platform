export interface KYCRequirement {
  type: string;
  label: string;
  required: boolean;
}

export type EntityType = 'user' | 'merchant' | 'agent' | 'corporate' | 'driver';

export const KYC_REQUIREMENTS: Record<EntityType, KYCRequirement[]> = {
  user: [
    { type: 'national_id', label: 'National ID / Passport', required: true },
    { type: 'proof_of_address', label: 'Proof of Address (utility bill, bank statement)', required: true },
    { type: 'selfie', label: 'Selfie with ID (liveness check)', required: false },
  ],
  merchant: [
    { type: 'business_registration', label: 'Business Registration Certificate', required: true },
    { type: 'tax_clearance', label: 'Tax Clearance Certificate (ZIMRA)', required: true },
    { type: 'business_license', label: 'Business License / Operating Permit', required: true },
    { type: 'director_id', label: "Director's National ID or Passport", required: true },
    { type: 'business_proof_of_address', label: 'Proof of Business Address', required: true },
    { type: 'bank_confirmation', label: 'Bank Account Confirmation Letter', required: true },
  ],
  agent: [
    { type: 'national_id', label: 'National ID or Passport', required: true },
    { type: 'agent_license', label: 'Agent License Certificate', required: true },
    { type: 'tax_clearance', label: 'Tax Clearance (ZIMRA)', required: true },
    { type: 'proof_of_address', label: 'Proof of Address', required: true },
    { type: 'bank_confirmation', label: 'Bank Account Confirmation Letter', required: true },
  ],
  corporate: [
    { type: 'certificate_of_incorporation', label: 'Certificate of Incorporation', required: true },
    { type: 'company_tax_clearance', label: 'Company Tax Clearance (ZIMRA)', required: true },
    { type: 'signatory_id', label: 'Authorized Signatory ID', required: true },
    { type: 'company_proof_of_address', label: 'Company Proof of Address', required: true },
    { type: 'board_resolution', label: 'Board Resolution (authorizing platform usage)', required: true },
  ],
  driver: [
    { type: 'drivers_license', label: "Driver's License", required: true },
    { type: 'national_id', label: 'National ID', required: true },
    { type: 'vehicle_insurance', label: 'Vehicle Insurance', required: true },
    { type: 'vehicle_registration', label: 'Vehicle Registration (Fitness Certificate)', required: true },
    { type: 'police_clearance', label: 'Police Clearance', required: true },
  ],
};

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  user: 'User',
  merchant: 'Merchant',
  agent: 'Agent',
  corporate: 'Corporate',
  driver: 'Driver',
};
