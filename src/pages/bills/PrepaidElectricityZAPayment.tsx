import { Zap } from "lucide-react";
import { GenericBillPayment } from "@/components/bills/GenericBillPayment";

const PrepaidElectricityZAPayment = () => (
  <GenericBillPayment
    config={{
      id: "sa-electricity",
      name: "SA Prepaid Electricity",
      description: "Eskom & Municipal Prepaid",
      icon: Zap,
      iconColor: "text-yellow-500",
      iconBg: "bg-yellow-500/10",
      accountLabel: "Meter Number",
      accountPlaceholder: "e.g. 04001234567",
      accountValidation: (v) => /^\d{11}$/.test(v),
      accountMaxLength: 11,
      accountInputMode: "numeric",
      minAmount: 10,
      maxAmount: 10000,
      currencies: [
        { code: "ZAR", label: "🇿🇦 ZAR - South African Rand" },
        { code: "USD", label: "🇺🇸 USD - US Dollar" },
      ],
      defaultCurrency: "USD",
      infoText: "Enter your 11-digit meter number. Token is delivered via SMS within seconds.",
      serviceFee: 1,
    }}
  />
);

export default PrepaidElectricityZAPayment;
