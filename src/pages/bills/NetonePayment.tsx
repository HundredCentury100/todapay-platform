import { Radio } from "lucide-react";
import { GenericBillPayment } from "@/components/bills/GenericBillPayment";
import netoneLogo from "@/assets/billers/netone.png";

const NetonePayment = () => (
  <GenericBillPayment
    config={{
      id: "netone",
      name: "Netone",
      description: "Airtime & Data Bundles",
      icon: Radio,
      iconColor: "text-green-500",
      iconBg: "bg-green-500/10",
      logoUrl: netoneLogo,
      accountLabel: "Phone Number",
      accountPlaceholder: "e.g. 0711234567",
      accountValidation: (v) => /^071\d{7}$/.test(v),
      accountMaxLength: 10,
      accountInputMode: "tel",
      minAmount: 0.5,
      maxAmount: 5000,
      currencies: [
        { code: "USD", label: "🇺🇸 USD - US Dollar" },
        { code: "ZWG", label: "🇿🇼 ZWG - Zimbabwe Gold" },
      ],
      defaultCurrency: "USD",
      infoText: "Enter a valid Netone number starting with 071. Airtime is delivered instantly.",
    }}
  />
);

export default NetonePayment;
