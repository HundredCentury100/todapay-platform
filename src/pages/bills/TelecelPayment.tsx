import { Phone } from "lucide-react";
import { GenericBillPayment } from "@/components/bills/GenericBillPayment";
import telecelLogo from "@/assets/billers/telecel.png";

const TelecelPayment = () => (
  <GenericBillPayment
    config={{
      id: "telecel",
      name: "Telecel",
      description: "Airtime & Data Bundles",
      icon: Phone,
      iconColor: "text-purple-500",
      iconBg: "bg-purple-500/10",
      logoUrl: telecelLogo,
      accountLabel: "Phone Number",
      accountPlaceholder: "e.g. 0731234567",
      accountValidation: (v) => /^073\d{7}$/.test(v),
      accountMaxLength: 10,
      accountInputMode: "tel",
      minAmount: 0.5,
      maxAmount: 5000,
      currencies: [
        { code: "USD", label: "🇺🇸 USD - US Dollar" },
        { code: "ZWG", label: "🇿🇼 ZWG - Zimbabwe Gold" },
      ],
      defaultCurrency: "USD",
      infoText: "Enter a valid Telecel number starting with 073. Airtime is delivered instantly.",
    }}
  />
);

export default TelecelPayment;
