import { ShoppingBag } from "lucide-react";
import { GenericBillPayment } from "@/components/bills/GenericBillPayment";
import jetLogo from "@/assets/billers/jet.png";

const JetPayment = () => (
  <GenericBillPayment
    config={{
      id: "jet",
      name: "Jet",
      description: "Retail Account Payments",
      icon: ShoppingBag,
      iconColor: "text-orange-500",
      iconBg: "bg-orange-500/10",
      logoUrl: jetLogo,
      accountLabel: "Account Number",
      accountPlaceholder: "Enter Jet account number",
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
      infoText: "Enter your Jet store account number. Payments are reflected within 24 hours.",
      supportsCustomerInfo: true,
      serviceFee: 1,
    }}
  />
);

export default JetPayment;
