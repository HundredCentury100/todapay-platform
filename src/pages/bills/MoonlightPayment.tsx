import { Heart } from "lucide-react";
import { GenericBillPayment } from "@/components/bills/GenericBillPayment";
import moonlightLogo from "@/assets/billers/moonlight.png";

const MoonlightPayment = () => (
  <GenericBillPayment
    config={{
      id: "moonlight",
      name: "Moonlight",
      description: "Funeral Services",
      icon: Heart,
      iconColor: "text-cyan-500",
      iconBg: "bg-cyan-500/10",
      logoUrl: moonlightLogo,
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
      infoText: "Enter your Moonlight policy number. Payments are applied to your account within 24 hours.",
      supportsCustomerInfo: true,
      serviceFee: 1,
    }}
  />
);

export default MoonlightPayment;
