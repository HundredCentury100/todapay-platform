import { Phone } from "lucide-react";
import { GenericBillPayment } from "@/components/bills/GenericBillPayment";
import econetLogo from "@/assets/billers/econet.png";

const EconetPayment = () => (
  <GenericBillPayment
    config={{
      id: "econet",
      name: "Econet",
      description: "Airtime & Data Bundles",
      icon: Phone,
      iconColor: "text-red-500",
      iconBg: "bg-red-500/10",
      logoUrl: econetLogo,
      accountLabel: "Phone Number",
      accountPlaceholder: "e.g. 0771234567",
      accountValidation: (v) => /^0(77|78)\d{7}$/.test(v),
      accountMaxLength: 10,
      accountInputMode: "tel",
      minAmount: 0.5,
      maxAmount: 5000,
      currencies: [
        { code: "USD", label: "🇺🇸 USD - US Dollar" },
        { code: "ZWG", label: "🇿🇼 ZWG - Zimbabwe Gold" },
      ],
      defaultCurrency: "USD",
      infoText: "Enter a valid Econet number starting with 077 or 078. Airtime is delivered instantly.",
    }}
  />
);

export default EconetPayment;
