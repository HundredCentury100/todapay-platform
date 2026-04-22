import { Heart } from "lucide-react";
import { GenericBillPayment } from "@/components/bills/GenericBillPayment";
import nyaradzoLogo from "@/assets/billers/nyaradzo.png";

const NyaradzoPayment = () => (
  <GenericBillPayment
    config={{
      id: "nyaradzo",
      name: "Nyaradzo",
      description: "Funeral Services",
      icon: Heart,
      iconColor: "text-indigo-500",
      iconBg: "bg-indigo-500/10",
      logoUrl: nyaradzoLogo,
      accountLabel: "Policy Number",
      accountPlaceholder: "Enter policy number",
      accountValidation: (v) => v.length >= 4 && v.length <= 20,
      accountMaxLength: 20,
      accountInputMode: "text",
      minAmount: 1,
      maxAmount: 10000,
      currencies: [
        { code: "USD", label: "🇺🇸 USD - US Dollar" },
        { code: "ZWG", label: "🇿🇼 ZWG - Zimbabwe Gold" },
      ],
      defaultCurrency: "USD",
      infoText: "Enter your Nyaradzo policy number. Payments are applied to your account within 24 hours.",
      supportsCustomerInfo: true,
      serviceFee: 1,
    }}
  />
);

export default NyaradzoPayment;
