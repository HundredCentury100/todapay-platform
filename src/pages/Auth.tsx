import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PasswordResetDialog } from "@/components/PasswordResetDialog";

import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpWizard } from "@/components/auth/SignUpWizard";
import { OTPVerification } from "@/components/auth/OTPVerification";
import { useAuthFlow } from "@/components/auth/useAuthFlow";
import { ArrowLeft, Ticket, Car, Briefcase, Plane } from "lucide-react";
import MobileAppLayout from "@/components/MobileAppLayout";
import { cn } from "@/lib/utils";
import type { WizardRole } from "@/components/auth/wizard/RoleSelectionStep";

const TodaPayLogo = ({ className }: { className?: string }) => (
  <img src="/logoTodaPay.png" alt="TodaPay" className={className} />
);

const roleInfo: Record<string, { icon: any; label: string; tagline: string; gradient: string; description: string }> = {
  consumer: {
    icon: TodaPayLogo, label: "Traveler", tagline: "Book. Travel. Explore Zimbabwe.",
    gradient: "from-blue-600 via-cyan-500 to-blue-400",
    description: "Your all-in-one platform for buses, events, stays, rides and more across Zimbabwe."
  },
  driver: { 
    icon: Car, label: "Driver", tagline: "Drive. Earn. Freedom.", 
    gradient: "from-amber-600 via-orange-500 to-amber-400",
    description: "Join our driver network in Zimbabwe. Flexible hours, instant earnings."
  },
  merchant: {
    icon: Briefcase, label: "Merchant", tagline: "Grow. Manage. Scale.",
    gradient: "from-violet-600 via-purple-500 to-violet-400",
    description: "List your services, manage bookings, and grow your business on TodaPay."
  },
  agent: {
    icon: Plane, label: "Agent", tagline: "Book. Earn. Repeat.",
    gradient: "from-amber-600 via-orange-500 to-amber-400",
    description: "Book for clients, earn commissions, and manage your travel agency."
  },
};

const Auth = () => {
  const flow = useAuthFlow();
  const initialUserType = flow.isSignUp ? ((flow as any).initialUserType || "consumer") : "consumer";
  const [wizardRole] = useState<WizardRole | undefined>(
    ["consumer", "driver", "merchant", "agent"].includes(initialUserType) ? initialUserType as WizardRole : undefined
  );

  const currentRole = flow.isSignUp ? (initialUserType || "consumer") : "consumer";
  const info = roleInfo[currentRole] || roleInfo.consumer;
  const RoleIcon = info.icon;

  return (
    <MobileAppLayout hideNav>
      <div className="min-h-screen bg-background flex flex-col lg:flex-row">
        {/* ── Left Brand Panel (desktop only) ── */}
        <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] relative overflow-hidden">
          <div className={cn("absolute inset-0 bg-gradient-to-br", info.gradient)} />
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 w-32 h-32 border-2 border-white rounded-full" />
            <div className="absolute top-40 right-8 w-20 h-20 border-2 border-white rounded-full" />
            <div className="absolute bottom-32 left-20 w-16 h-16 border-2 border-white rounded-full" />
            <div className="absolute bottom-60 right-16 w-40 h-40 border border-white/50 rounded-full" />
          </div>
          <div className="relative z-10 flex flex-col justify-between p-10 text-white w-full">
            <div>
              <motion.div key={currentRole} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <RoleIcon className="h-6 w-6" />
                </div>
                <span className="text-lg font-bold tracking-wide">TodaPay</span>
              </motion.div>
            </div>
            <motion.div key={currentRole + "-text"} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <h1 className="text-4xl xl:text-5xl font-black leading-tight mb-4 tracking-tight">{info.tagline}</h1>
              <p className="text-lg text-white/70 leading-relaxed max-w-sm">{info.description}</p>
            </motion.div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-white/50 text-sm">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/10" />
                  ))}
                </div>
                <span>Trusted across Zimbabwe</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Form Panel ── */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <motion.div
            className="absolute top-20 right-0 w-64 h-64 bg-primary/8 rounded-full blur-3xl pointer-events-none"
            animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Mobile brand bar */}
          <div className="lg:hidden relative z-10 px-5 pt-6 pb-2 safe-area-pt">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => flow.handleBack()} className="h-11 w-11 rounded-2xl bg-card/60 border border-border/30">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <motion.div
                key={currentRole + "-mobile"}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r text-white text-xs font-bold", info.gradient)}
              >
                <RoleIcon className="h-3.5 w-3.5" />
                {info.label}
              </motion.div>
            </div>
          </div>

          {/* Desktop back button */}
          <div className="hidden lg:block relative z-10 px-8 pt-8">
            <Button variant="ghost" size="icon" onClick={() => flow.handleBack()} className="h-11 w-11 rounded-2xl bg-card/60 border border-border/30">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>

          {/* Form Area */}
          <div className="flex-1 flex items-start lg:items-center justify-center relative z-10">
            <div className="w-full max-w-md px-6 py-6 lg:py-0">
              <AnimatePresence mode="wait">
                {flow.step === "form" && (
                  <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                    {flow.isSignUp ? (
                      <SignUpWizard
                        initialRole={wizardRole}
                        onToggleMode={() => flow.setIsSignUp(false)}
                      />
                    ) : (
                      <SignInForm
                        authMethod={flow.authMethod}
                        setAuthMethod={flow.setAuthMethod}
                        formData={flow.formData}
                        setFormData={flow.setFormData}
                        errors={flow.errors}
                        touched={flow.touched}
                        setTouched={flow.setTouched}
                        validateForm={flow.validateForm}
                        loading={flow.loading}
                        onSubmit={flow.authMethod === "phone" ? flow.handlePhoneAuth : flow.handleSignIn}
                        onGoogleSignIn={flow.handleGoogleSignIn}
                        onForgotPassword={() => flow.setShowResetDialog(true)}
                        onToggleMode={() => flow.setIsSignUp(true)}
                      />
                    )}
                  </motion.div>
                )}

                {flow.step === "otp-verify" && (
                  <motion.div key="otp-verify" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                    <OTPVerification
                      phone={flow.formData.phone}
                      otpCode={flow.otpCode}
                      setOtpCode={flow.setOtpCode}
                      loading={flow.loading}
                      onVerify={flow.handleVerifyOTP}
                      onResend={flow.handlePhoneAuth}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <PasswordResetDialog open={flow.showResetDialog} onOpenChange={flow.setShowResetDialog} />
      </div>
    </MobileAppLayout>
  );
};

export default Auth;
