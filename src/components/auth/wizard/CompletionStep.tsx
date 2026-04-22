import { motion } from "framer-motion";
import { CheckCircle2, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WizardRole } from "./RoleSelectionStep";
import { cn } from "@/lib/utils";

interface CompletionStepProps {
  role: WizardRole;
  needsApproval: boolean;
  onContinue: () => void;
}

const roleConfig: Record<WizardRole, { gradient: string; title: string; approvalMsg: string; readyMsg: string }> = {
  consumer: {
    gradient: "from-sky-500 to-blue-600",
    title: "You're all set!",
    approvalMsg: "",
    readyMsg: "Start exploring buses, events, stays and more across Zimbabwe.",
  },
  driver: {
    gradient: "from-emerald-500 to-green-600",
    title: "Application Submitted!",
    approvalMsg: "Our team will review your details. You'll be notified once approved to start driving.",
    readyMsg: "",
  },
  merchant: {
    gradient: "from-violet-500 to-purple-600",
    title: "Application Submitted!",
    approvalMsg: "Our team will verify your business details. You'll get access to your dashboard once approved.",
    readyMsg: "",
  },
  agent: {
    gradient: "from-amber-500 to-orange-600",
    title: "Application Submitted!",
    approvalMsg: "Our team will review your agency details. You'll be notified once your account is activated.",
    readyMsg: "",
  },
};

export const CompletionStep = ({ role, needsApproval, onContinue }: CompletionStepProps) => {
  const config = roleConfig[role];
  const Icon = needsApproval ? Clock : CheckCircle2;

  return (
    <div className="text-center space-y-6 py-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="relative w-24 h-24 mx-auto"
      >
        <div className={cn("absolute inset-0 rounded-full blur-2xl opacity-30 bg-gradient-to-br", config.gradient)} />
        <div className={cn("relative w-full h-full rounded-full flex items-center justify-center bg-gradient-to-br text-white", config.gradient)}>
          <Icon className="h-12 w-12" />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h1 className="text-2xl font-bold tracking-tight">{config.title}</h1>
        <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">
          {needsApproval ? config.approvalMsg : config.readyMsg}
        </p>
        {needsApproval && (
          <p className="text-xs text-muted-foreground/70 mt-3">
            Please check your email to verify your account.
          </p>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <Button
          onClick={onContinue}
          className={cn("h-14 px-8 rounded-2xl text-base font-semibold shadow-lg bg-gradient-to-r text-white", config.gradient)}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {needsApproval ? "Go to Home" : "Start Exploring"}
        </Button>
      </motion.div>
    </div>
  );
};
