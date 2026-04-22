import { Tv } from "lucide-react";
import { GenericBillPayment } from "@/components/bills/GenericBillPayment";

const DSTVPayment = () => (
  <GenericBillPayment
    config={{
      id: "dstv",
      name: "DStv",
      description: "MultiChoice Subscription",
      icon: Tv,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-600/10",
      accountLabel: "DStv Smartcard / Account Number",
      accountPlaceholder: "e.g. 1234567890",
      accountValidation: (v) => /^\d{9,12}$/.test(v),
      accountMaxLength: 12,
      accountInputMode: "numeric",
      minAmount: 5,
      maxAmount: 5000,
      currencies: [
        { code: "ZAR", label: "🇿🇦 ZAR - South African Rand" },
        { code: "USD", label: "🇺🇸 USD - US Dollar" },
      ],
      defaultCurrency: "USD",
      infoText: "Enter your DStv smartcard or account number. Your subscription is renewed instantly upon successful payment.",
      serviceFee: 1,
    }}
  />
);

export default DSTVPayment;
