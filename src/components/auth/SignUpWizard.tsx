import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { getFriendlyAuthError } from "@/utils/authErrorMessages";
import { signUpSchema } from "@/lib/validationSchemas";
import { z } from "zod";

import { RoleSelectionStep, type WizardRole } from "./wizard/RoleSelectionStep";
import { AccountStep } from "./wizard/AccountStep";
import { RoleDetailsStep, type RoleDetailsData } from "./wizard/RoleDetailsStep";
import { CompletionStep } from "./wizard/CompletionStep";
import type { AuthMethod } from "./useAuthFlow";

const STEPS_BY_ROLE: Record<WizardRole, string[]> = {
  consumer: ["role", "account", "otp-verify", "complete"],
  driver: ["role", "account", "otp-verify", "details", "complete"],
  merchant: ["role", "account", "otp-verify", "details", "complete"],
  agent: ["role", "account", "otp-verify", "details", "complete"],
};

interface SignUpWizardProps {
  initialRole?: WizardRole;
  onToggleMode: () => void;
}

export const SignUpWizard = ({ initialRole, onToggleMode }: SignUpWizardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp } = useAuth();
  const { toast } = useToast();
  const { canInstall, triggerInstall } = usePWAInstall();
  const returnTo = (location.state as any)?.returnTo || new URLSearchParams(location.search).get("returnTo");

  const [selectedRole, setSelectedRole] = useState<WizardRole | null>(initialRole || null);
  const [currentStepIndex, setCurrentStepIndex] = useState(initialRole ? 1 : 0);
  const [authMethod, setAuthMethod] = useState<AuthMethod>("email");
  const [formData, setFormData] = useState({ email: "", password: "", name: "", phone: "" });
  const [roleDetails, setRoleDetails] = useState<RoleDetailsData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [verificationId, setVerificationId] = useState<number | null>(null);
  const [otpCode, setOtpCode] = useState("");

  const steps = selectedRole ? STEPS_BY_ROLE[selectedRole] : ["role", "account", "complete"];
  const currentStep = steps[currentStepIndex];
  const totalSteps = steps.length;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  const validateForm = () => {
    try {
      const errs: Record<string, string> = {};

      // Validate all fields for SMS OTP signup
      if (!formData.name || formData.name.trim().length < 2) {
        errs.name = "Name must be at least 2 characters";
      }
      if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errs.email = "Please enter a valid email";
      }
      if (!formData.phone || formData.phone.replace(/\D/g, '').length < 10) {
        errs.phone = "Please enter a valid phone number (min 10 digits)";
      }
      if (!formData.password || formData.password.length < 8) {
        errs.password = "Password must be at least 8 characters";
      }

      setErrors(errs);
      return Object.keys(errs).length === 0;
    } catch (error) {
      return false;
    }
  };

  const validateRoleDetails = (): boolean => {
    if (!selectedRole || selectedRole === "consumer") return true;
    if (selectedRole === "driver") return !!(roleDetails.vehicleType && roleDetails.licensePlate);
    if (selectedRole === "merchant") return !!(roleDetails.businessName && roleDetails.merchantRole);
    if (selectedRole === "agent") return !!(roleDetails.agencyName && roleDetails.agentType);
    return true;
  };

  const createRoleRecords = async (userId: string) => {
    if (!selectedRole || selectedRole === "consumer") return;

    try {
      if (selectedRole === "driver") {
        await supabase.from("user_roles").upsert(
          { user_id: userId, role: "driver" as any },
          { onConflict: "user_id,role" }
        );
      } else if (selectedRole === "merchant") {
        await supabase.from("merchant_profiles").insert({
          user_id: userId,
          business_name: roleDetails.businessName || "My Business",
          business_email: formData.email || "pending@todapayments.com",
          role: (roleDetails.merchantRole || "bus_operator") as any,
          business_address: roleDetails.businessAddress || "",
          verification_status: "pending",
        } as any);
        await supabase.from("user_roles").upsert(
          { user_id: userId, role: "merchant" as any },
          { onConflict: "user_id,role" }
        );
      } else if (selectedRole === "agent") {
        await supabase.from("merchant_profiles").insert({
          user_id: userId,
          business_name: roleDetails.agencyName || "My Agency",
          business_email: formData.email || "pending@todapayments.com",
          role: (roleDetails.agentType || "travel_agent") as any,
          agent_license_number: roleDetails.licenseNumber || null,
          verification_status: "pending",
        } as any);
        await supabase.from("user_roles").upsert(
          { user_id: userId, role: "merchant" as any },
          { onConflict: "user_id,role" }
        );
      }
    } catch (err) {
      console.error("Error creating role records:", err);
    }
  };

  const handleSendOTP = async (): Promise<boolean> => {
    setTouched({ email: true, password: true, name: true, phone: true });
    if (!validateForm()) {
      toast({ title: "Please check your details", variant: "destructive" });
      return false;
    }

    setLoading(true);
    try {
      // Send OTP via BlueDotSMS
      const { data, error } = await supabase.functions.invoke('send-sms-otp', {
        body: {
          action: 'send',
          phoneNumber: formData.phone,
          brand: 'TodaPay',
        },
      });

      if (error || !data?.success) {
        toast({
          title: "Failed to send OTP",
          description: data?.error || error?.message || "Please try again",
          variant: "destructive"
        });
        return false;
      }

      setVerificationId(data.verificationId);
      toast({
        title: "OTP Sent",
        description: `Verification code sent to ${formData.phone}`
      });
      return true;
    } catch (err: any) {
      console.error('Send OTP error:', err);
      toast({
        title: "Error",
        description: err?.message || "Failed to send OTP. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (): Promise<boolean> => {
    if (!verificationId || !otpCode) {
      toast({ title: "Please enter the verification code", variant: "destructive" });
      return false;
    }

    setLoading(true);
    try {
      // Verify OTP via BlueDotSMS
      const { data, error } = await supabase.functions.invoke('send-sms-otp', {
        body: {
          action: 'verify',
          phoneNumber: formData.phone,
          verificationId,
          verificationCode: otpCode,
        },
      });

      if (error || !data?.verified) {
        toast({
          title: "Invalid Code",
          description: data?.error || "Please check the code and try again",
          variant: "destructive"
        });
        return false;
      }

      // OTP verified, now create the Supabase account
      const { error: signUpError } = await signUp(formData.email, formData.password, formData.name, formData.phone);
      if (signUpError) {
        toast({
          title: "Sign Up Failed",
          description: getFriendlyAuthError(signUpError),
          variant: "destructive"
        });
        return false;
      }

      toast({ title: "Account Created", description: "Your phone number is verified!" });
      if (canInstall) triggerInstall();
      return true;
    } catch (err: any) {
      console.error('Verify OTP error:', err);
      toast({
        title: "Error",
        description: err?.message || "Verification failed. Please try again.",
        variant: "destructive"
        });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const finalizeSignUp = async () => {
    await new Promise((r) => setTimeout(r, 1000));
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await createRoleRecords(user.id);
    }
    setCompleted(true);
    setCurrentStepIndex(steps.length - 1);
  };

  const handleNext = async () => {
    if (currentStep === "role") {
      if (!selectedRole) {
        toast({ title: "Please select a role", variant: "destructive" });
        return;
      }
      setCurrentStepIndex(1);
    } else if (currentStep === "account") {
      // Send OTP to user's phone
      const success = await handleSendOTP();
      if (!success) return;
      // Move to OTP verification step
      setCurrentStepIndex(currentStepIndex + 1);
    } else if (currentStep === "otp-verify") {
      // Verify OTP and create account
      const success = await handleVerifyOTP();
      if (!success) return;

      // Consumer has no details step — finalize immediately
      if (selectedRole === "consumer") {
        setLoading(true);
        await finalizeSignUp();
        setLoading(false);
      } else {
        // Has details step — move to it
        setCurrentStepIndex(currentStepIndex + 1);
      }
    } else if (currentStep === "details") {
      if (!validateRoleDetails()) {
        toast({ title: "Please fill in the required fields", variant: "destructive" });
        return;
      }
      setLoading(true);
      await finalizeSignUp();
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    } else {
      navigate(-1);
    }
  };

  const handleComplete = () => {
    if (selectedRole === "driver") {
      navigate("/driver/register", { replace: true });
    } else {
      navigate(returnTo || "/", { replace: true });
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + (returnTo || "/"),
      });
      if (error) {
        toast({ title: "Google Sign-In Failed", description: error.message, variant: "destructive" });
        setLoading(false);
      }
    } catch (err: any) {
      toast({ title: "Google Sign-In Failed", description: err?.message || "Something went wrong", variant: "destructive" });
      setLoading(false);
    }
  };

  const slideVariants = {
    enter: { x: 50, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 },
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      {!completed && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Step {currentStepIndex + 1} of {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25 }}
        >
          {currentStep === "role" && (
            <RoleSelectionStep selectedRole={selectedRole} onSelect={setSelectedRole} />
          )}
          {currentStep === "account" && (
            <AccountStep
              authMethod={authMethod}
              setAuthMethod={setAuthMethod}
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              touched={touched}
              setTouched={setTouched}
              validateForm={validateForm}
              loading={loading}
              onGoogleSignIn={handleGoogleSignIn}
            />
          )}
          {currentStep === "otp-verify" && (
            <div className="space-y-5">
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight">Verify your phone</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  We sent a verification code to <strong>{formData.phone}</strong>
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium mb-2">
                    Verification Code
                  </label>
                  <input
                    id="otp"
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit code"
                    className="w-full h-14 rounded-2xl bg-card border-border border px-4 text-center text-2xl font-bold tracking-widest"
                    autoFocus
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="w-full text-sm"
                >
                  Didn't receive code? Resend
                </Button>
              </div>
            </div>
          )}
          {currentStep === "details" && selectedRole && (
            <RoleDetailsStep role={selectedRole} data={roleDetails} onChange={setRoleDetails} />
          )}
          {currentStep === "complete" && selectedRole && (
            <CompletionStep
              role={selectedRole}
              needsApproval={selectedRole !== "consumer"}
              onContinue={handleComplete}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      {currentStep !== "complete" && (
        <Button
          type="button"
          onClick={handleNext}
          disabled={loading || (currentStep === "role" && !selectedRole)}
          className="w-full h-14 rounded-2xl text-base font-semibold bg-primary shadow-lg shadow-primary/20"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              {currentStep === "account" ? "Send Verification Code" :
               currentStep === "otp-verify" ? "Verify & Create Account" :
               "Continue"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      )}

      {/* Toggle to Sign In */}
      {currentStep !== "complete" && (
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <button onClick={onToggleMode} className="text-primary font-bold hover:text-primary/80 transition-colors">
            Sign In
          </button>
        </p>
      )}
    </div>
  );
};
