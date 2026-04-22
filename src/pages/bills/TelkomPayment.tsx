import { Phone } from "lucide-react";
import { GenericBillPayment } from "@/components/bills/GenericBillPayment";

const TelkomPayment = () => (
  <GenericBillPayment
    config={{
      id: "telkom",
      name: "Telkom SA",
      description: "Airtime, Data & Voice",
      icon: Phone,
      iconColor: "text-sky-600",
      iconBg: "bg-sky-600/10",
      accountLabel: "Phone Number",
      accountPlaceholder: "e.g. 0811234567",
      accountValidation: (v) => /^0(81)\d{7}$/.test(v),
      accountMaxLength: 10,
      accountInputMode: "tel",
      minAmount: 1,
      maxAmount: 5000,
      currencies: [
        { code: "ZAR", label: "🇿🇦 ZAR - South African Rand" },
        { code: "USD", label: "🇺🇸 USD - US Dollar" },
      ],
      defaultCurrency: "USD",
      infoText: "Enter a valid Telkom Mobile number starting with 081. Recharge is delivered instantly.",
    }}
  />
);

export default TelkomPayment;
