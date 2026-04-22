import { Building2 } from "lucide-react";
import { GenericBillPayment } from "@/components/bills/GenericBillPayment";
import bccLogo from "@/assets/billers/bcc.png";

const BCCPayment = () => (
  <GenericBillPayment
    config={{
      id: "bcc",
      name: "BCC",
      description: "Bulawayo City Council",
      icon: Building2,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-500/10",
      logoUrl: bccLogo,
      accountLabel: "Account Number",
      accountPlaceholder: "Enter BCC account number",
      accountValidation: (v) => v.length >= 5 && v.length <= 20,
      accountMaxLength: 20,
      accountInputMode: "text",
      minAmount: 1,
      maxAmount: 50000,
      currencies: [
        { code: "USD", label: "🇺🇸 USD - US Dollar" },
        { code: "ZWG", label: "🇿🇼 ZWG - Zimbabwe Gold" },
      ],
      defaultCurrency: "USD",
      infoText: "Ensure your BCC account number is correct. Payments cannot be reversed once processed.",
      supportsCustomerInfo: true,
      serviceFee: 1,
    }}
  />
);

export default BCCPayment;
