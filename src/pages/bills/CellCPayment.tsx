import { Phone } from "lucide-react";
import { GenericBillPayment } from "@/components/bills/GenericBillPayment";

const CellCPayment = () => (
  <GenericBillPayment
    config={{
      id: "cellc",
      name: "Cell C",
      description: "Airtime & Data Bundles",
      icon: Phone,
      iconColor: "text-rose-600",
      iconBg: "bg-rose-600/10",
      accountLabel: "Phone Number",
      accountPlaceholder: "e.g. 0841234567",
      accountValidation: (v) => /^0(74|84)\d{7}$/.test(v),
      accountMaxLength: 10,
      accountInputMode: "tel",
      minAmount: 1,
      maxAmount: 5000,
      currencies: [
        { code: "ZAR", label: "🇿🇦 ZAR - South African Rand" },
        { code: "USD", label: "🇺🇸 USD - US Dollar" },
      ],
      defaultCurrency: "USD",
      infoText: "Enter a valid Cell C number starting with 074 or 084. Airtime is delivered instantly.",
    }}
  />
);

export default CellCPayment;
