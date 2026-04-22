import { ShoppingBag } from "lucide-react";
import { GenericBillPayment } from "@/components/bills/GenericBillPayment";
import edgarsLogo from "@/assets/billers/edgars.png";

const EdgarsPayment = () => (
  <GenericBillPayment
    config={{
      id: "edgars",
      name: "Edgars",
      description: "Retail Account Payments",
      icon: ShoppingBag,
      iconColor: "text-rose-500",
      iconBg: "bg-rose-500/10",
      logoUrl: edgarsLogo,
      accountLabel: "Account Number",
      accountPlaceholder: "Enter Edgars account number",
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
      infoText: "Enter your Edgars store account number. Payments are reflected within 24 hours.",
      supportsCustomerInfo: true,
      serviceFee: 1,
    }}
  />
);

export default EdgarsPayment;
