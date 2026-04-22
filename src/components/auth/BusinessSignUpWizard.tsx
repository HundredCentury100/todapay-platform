import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
import {
  Briefcase, Users, Building2, Bus, Calendar, Hotel, Plane,
  Laptop, Car, CarTaxiFront, Compass, ArrowLeft, Loader2, Check,
} from "lucide-react";
import { MerchantRole } from "@/types/merchant";

export type BusinessCategory = "merchant" | "agent" | "corporate";

interface BusinessSignUpWizardProps {
  defaultEmail?: string;
  loading?: boolean;
  onComplete: (data: {
    category: BusinessCategory;
    verticals: MerchantRole[];
    businessName: string;
    businessEmail: string;
    businessPhone: string;
    country: string;
  }) => void;
  onBack: () => void;
}

const categories = [
  {
    id: "merchant" as BusinessCategory,
    icon: Briefcase,
    title: "Service Provider / Merchant",
    description: "I run a transport, hospitality, events, or experiences business",
  },
  {
    id: "agent" as BusinessCategory,
    icon: Users,
    title: "Travel / Booking Agent",
    description: "I book services on behalf of clients",
  },
  {
    id: "corporate" as BusinessCategory,
    icon: Building2,
    title: "Corporate / Company",
    description: "I manage business travel for my company",
  },
];

const verticals = [
  { role: "bus_operator" as MerchantRole, title: "Buses", icon: Bus },
  { role: "event_organizer" as MerchantRole, title: "Events", icon: Calendar },
  { role: "venue_owner" as MerchantRole, title: "Venues", icon: Building2 },
  { role: "property_owner" as MerchantRole, title: "Properties", icon: Hotel },
  { role: "airline_partner" as MerchantRole, title: "Flights", icon: Plane },
  { role: "workspace_provider" as MerchantRole, title: "Workspaces", icon: Laptop },
  { role: "car_rental_company" as MerchantRole, title: "Car Rental", icon: Car },
  { role: "transfer_provider" as MerchantRole, title: "Transfers", icon: CarTaxiFront },
  { role: "experience_host" as MerchantRole, title: "Experiences", icon: Compass },
];

type WizardStep = "category" | "verticals" | "info";

export const BusinessSignUpWizard = ({
  defaultEmail = "",
  loading = false,
  onComplete,
  onBack,
}: BusinessSignUpWizardProps) => {
  const [step, setStep] = useState<WizardStep>("category");
  const [category, setCategory] = useState<BusinessCategory | null>(null);
  const [selectedVerticals, setSelectedVerticals] = useState<MerchantRole[]>([]);
  const [info, setInfo] = useState({
    businessName: "",
    businessEmail: defaultEmail,
    businessPhone: "",
    country: "",
  });

  const totalSteps = category === "merchant" ? 3 : 2;
  const currentStep = step === "category" ? 1 : step === "verticals" ? 2 : category === "merchant" ? 3 : 2;

  const toggleVertical = (role: MerchantRole) => {
    setSelectedVerticals((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleCategorySelect = (cat: BusinessCategory) => {
    setCategory(cat);
    if (cat === "merchant") {
      setStep("verticals");
    } else {
      setStep("info");
    }
  };

  const handleBack = () => {
    if (step === "info" && category === "merchant") {
      setStep("verticals");
    } else if (step === "verticals") {
      setStep("category");
      setCategory(null);
    } else if (step === "info") {
      setStep("category");
      setCategory(null);
    } else {
      onBack();
    }
  };

  const handleSubmit = () => {
    if (!category) return;
    onComplete({
      category,
      verticals: category === "merchant" ? selectedVerticals : [],
      businessName: info.businessName,
      businessEmail: info.businessEmail,
      businessPhone: info.businessPhone,
      country: info.country,
    });
  };

  const canProceed = () => {
    if (step === "verticals") return selectedVerticals.length > 0;
    if (step === "info") return info.businessName.trim().length > 0;
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-2">
        <Button variant="ghost" size="icon" onClick={handleBack} className="h-9 w-9 rounded-xl">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          {currentStep}/{totalSteps}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Category */}
        {step === "category" && (
          <motion.div
            key="category"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold">What describes you best?</h2>
              <p className="text-muted-foreground text-sm mt-1">Choose your business category</p>
            </div>

            <div className="grid gap-3">
              {categories.map((cat, idx) => {
                const Icon = cat.icon;
                return (
                  <motion.button
                    key={cat.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    onClick={() => handleCategorySelect(cat.id)}
                    className="w-full p-4 rounded-2xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                        <Icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{cat.title}</h3>
                        <p className="text-sm text-muted-foreground">{cat.description}</p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Step 2: Vertical Selection (Merchants only) */}
        {step === "verticals" && (
          <motion.div
            key="verticals"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold">What services do you offer?</h2>
              <p className="text-muted-foreground text-sm mt-1">Select all that apply — you can add more later</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {verticals.map((v, idx) => {
                const Icon = v.icon;
                const isSelected = selectedVerticals.includes(v.role);
                return (
                  <motion.button
                    key={v.role}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => toggleVertical(v.role)}
                    className={`relative p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-center leading-tight">{v.title}</span>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
                      >
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            <Button
              onClick={() => setStep("info")}
              disabled={!canProceed()}
              className="w-full h-14 rounded-2xl text-base font-semibold mt-4"
            >
              Continue
            </Button>
          </motion.div>
        )}

        {/* Step 3: Business Info */}
        {step === "info" && (
          <motion.div
            key="info"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold">
                {category === "corporate" ? "Company Details" : "Business Details"}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Just the essentials to get you started
              </p>
            </div>

            <div className="space-y-4">
              <ValidatedInput
                id="businessName"
                type="text"
                label={category === "corporate" ? "Company Name" : "Business Name"}
                value={info.businessName}
                onChange={(e) => setInfo({ ...info, businessName: e.target.value })}
                placeholder={category === "corporate" ? "Acme Corp" : "My Travel Business"}
                required
                 className="h-14 rounded-2xl bg-card border-border/50"
              />
              <ValidatedInput
                id="businessEmail"
                type="email"
                label="Business Email"
                value={info.businessEmail}
                onChange={(e) => setInfo({ ...info, businessEmail: e.target.value })}
                placeholder="hello@business.com"
                 className="h-14 rounded-2xl bg-card border-border/50"
              />
              <ValidatedInput
                id="businessPhone"
                type="tel"
                label="Business Phone"
                value={info.businessPhone}
                onChange={(e) => setInfo({ ...info, businessPhone: e.target.value })}
                placeholder="+263 7X XXX XXXX"
                 className="h-14 rounded-2xl bg-card border-border/50"
              />
              <ValidatedInput
                id="country"
                type="text"
                label="Country"
                value={info.country}
                onChange={(e) => setInfo({ ...info, country: e.target.value })}
                placeholder="Zimbabwe"
                className="h-14 rounded-2xl bg-card border-border/50"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || loading}
              className="w-full h-14 rounded-2xl text-base font-semibold mt-4"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Complete Setup"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BusinessSignUpWizard;
