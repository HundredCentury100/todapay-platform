import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { signInSchema, signUpSchema } from "@/lib/validationSchemas";
import { getFriendlyAuthError } from "@/utils/authErrorMessages";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { MerchantRole } from "@/types/merchant";

import { usePWAInstall } from "@/hooks/usePWAInstall";
import { z } from "zod";

export type AuthStep = "form" | "otp-verify";
export type AuthMethod = "email" | "phone";

const merchantDashboardPaths: Record<MerchantRole, string> = {
  bus_operator: "/merchant/bus-operator",
  event_organizer: "/merchant/event-organizer",
  venue_owner: "/merchant/venue-owner",
  property_owner: "/merchant/property-owner",
  airline_partner: "/merchant/airline",
  workspace_provider: "/merchant/workspace",
  car_rental_company: "/merchant/car-rental",
  transfer_provider: "/merchant/transfers",
  experience_host: "/merchant/experiences",
  travel_agent: "/merchant/agent",
  booking_agent: "/merchant/agent",
  admin: "/merchant/admin",
};

export const useAuthFlow = () => {
  const location = useLocation();
  const initialMode = (location.state as any)?.mode || "signin";
  const initialUserType = (location.state as any)?.userType as string | undefined;
  const prefillEmail = (location.state as any)?.prefillEmail as string | undefined;

  const [isSignUp, setIsSignUp] = useState(initialMode === "signup");
  const [step, setStep] = useState<AuthStep>("form");
  const [authMethod, setAuthMethod] = useState<AuthMethod>("email");
  const [formData, setFormData] = useState({
    email: prefillEmail || "",
    password: "",
    name: "",
    phone: "",
  });
  const [otpCode, setOtpCode] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  // Sign-in OTP state
  const [signInVerificationId, setSignInVerificationId] = useState<number | null>(null);
  const [signInEmail, setSignInEmail] = useState<string>("");
  const [signInPhone, setSignInPhone] = useState<string>("");
  const [maskedPhone, setMaskedPhone] = useState<string>("");

  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { canInstall, triggerInstall } = usePWAInstall();

  const returnTo = (location.state as any)?.returnTo || new URLSearchParams(location.search).get('returnTo');

  useEffect(() => {
    if (user && step === "form") {
      navigate(returnTo || "/", { replace: true });
    }
  }, [user, navigate, returnTo, step]);

  const validateForm = () => {
    try {
      if (authMethod === "phone") {
        const errs: Record<string, string> = {};
        if (!formData.phone || formData.phone.replace(/\D/g, '').length < 10) {
          errs.phone = "Please enter a valid phone number";
        }
        if (isSignUp && !formData.name) {
          errs.name = "Name is required";
        }
        if (!isSignUp && (!formData.password || formData.password.length < 6)) {
          errs.password = "Password is required";
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
      }
      if (isSignUp) {
        signUpSchema.parse(formData);
      } else {
        signInSchema.parse({ email: formData.email, password: formData.password });
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const resolveBusinessDashboard = async (userId: string): Promise<string> => {
    try {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      const userRoles = roles?.map((r) => r.role as string) || [];

      if (userRoles.includes("admin")) return "/merchant/admin";

      if (userRoles.includes("merchant")) {
        const { data: profiles } = await supabase
          .from("merchant_profiles")
          .select("id, role")
          .eq("user_id", userId);

        if (profiles && profiles.length === 1) {
          const path = merchantDashboardPaths[profiles[0].role as MerchantRole];
          if (path) return path;
        } else if (profiles && profiles.length > 1) {
          return "/merchant/portal";
        }
      }

      if (userRoles.includes("driver")) return "/driver/profile";

      const { data: corpEmployee } = await supabase
        .from("corporate_employees")
        .select("corporate_account_id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (corpEmployee) return "/corporate";
    } catch (err) {
      console.error("Error resolving dashboard:", err);
    }
    return "/";
  };

  // Resends the SMS OTP for sign-in (re-runs step 1)
  const handleResendSignInOTP = async () => {
    const identifier = authMethod === "phone" ? formData.phone : formData.email;
    if (!identifier || !formData.password) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('signin-with-otp', {
        body: { identifier, password: formData.password, brand: 'TodaPay' },
      });
      if (error || !data?.success) {
        toast({ title: "Error", description: data?.error || "Failed to resend code", variant: "destructive" });
      } else {
        setSignInVerificationId(data.verificationId);
        if (data.phone) setSignInPhone(data.phone);
        toast({ title: "Code Sent", description: `A new 6-digit code has been sent to ${data.maskedPhone || 'your phone'}.` });
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 1: validate identifier + password, send SMS OTP
  const handleSignIn = async () => {
    setTouched(authMethod === "phone" ? { phone: true, password: true } : { email: true, password: true });
    if (!validateForm()) {
      toast({ title: "Please check your details", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const identifier = authMethod === "phone" ? formData.phone : formData.email;
      const { data, error } = await supabase.functions.invoke('signin-with-otp', {
        body: { identifier, password: formData.password, brand: 'TodaPay' },
      });

      if (error || !data?.success) {
        // Extract error message from either data.error or error.message or error.context.error
        let msg = "Invalid credentials";
        if ((data as any)?.error) {
          msg = (data as any).error;
        } else if ((error as any)?.context?.error) {
          msg = (error as any).context.error;
        } else if ((error as any)?.message) {
          msg = (error as any).message;
        }
        toast({ title: "Sign In Failed", description: msg, variant: "destructive" });
        setLoading(false);
        return;
      }

      setSignInVerificationId(data.verificationId);
      setSignInEmail(data.email);
      setSignInPhone(data.phone || "");
      setMaskedPhone(data.maskedPhone || "your phone");
      setStep("otp-verify");
      toast({ title: "Verify your sign-in", description: `A 6-digit code was sent to ${data.maskedPhone || 'your phone'}.` });
    } catch (err: any) {
      toast({ title: "Sign In Failed", description: err?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: verify OTP and complete sign-in
  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      toast({ title: "Invalid Code", description: "Please enter the full 6-digit code.", variant: "destructive" });
      return;
    }
    if (!signInVerificationId || !signInEmail) {
      toast({ title: "Session expired", description: "Please sign in again.", variant: "destructive" });
      setStep("form");
      return;
    }

    setLoading(true);
    try {
      // Verify OTP via BlueDot
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('send-sms-otp', {
        body: {
          action: 'verify',
          phoneNumber: signInPhone,
          verificationCode: otpCode,
          purpose: 'signin',
        },
      });

      if (verifyError || !verifyData?.verified) {
        toast({ title: "Invalid Code", description: verifyData?.error || "Please check the code and try again", variant: "destructive" });
        setLoading(false);
        return;
      }

      // Establish the actual session
      const { error: signInErr } = await signIn(signInEmail, formData.password);
      if (signInErr) {
        toast({ title: "Sign In Failed", description: getFriendlyAuthError(signInErr), variant: "destructive" });
        setLoading(false);
        return;
      }

      toast({ title: "Welcome Back!" });
      if (returnTo) {
        navigate(returnTo, { replace: true });
      } else {
        const { data: { user: signedInUser } } = await supabase.auth.getUser();
        const destination = signedInUser ? await resolveBusinessDashboard(signedInUser.id) : "/";
        navigate(destination, { replace: true });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async () => {
    setTouched({ email: true, password: true, name: true });
    if (!validateForm()) {
      toast({ title: "Please check your details", variant: "destructive" });
      return;
    }

    // All sign-ups are consumer or driver — no business wizard
    setLoading(true);
    try {
      const { error } = await signUp(formData.email, formData.password, formData.name);
      if (error) {
        toast({ title: "Sign Up Failed", description: getFriendlyAuthError(error), variant: "destructive" });
        setLoading(false);
        return;
      }
      if (canInstall) triggerInstall();
      await new Promise(resolve => setTimeout(resolve, 1000));
      const { data: { user: newUser } } = await supabase.auth.getUser();

      if (!newUser) {
        toast({ title: "Account Created", description: "Please check your email to verify your account." });
        navigate("/");
      } else {
        const destination = initialUserType === "driver" ? "/driver/register" : (returnTo || "/");
        toast({ title: "Welcome!", description: "Your account has been created successfully." });
        navigate(destination, { replace: true });
      }
    } catch (err) {
      console.error("Error completing signup:", err);
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
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

  const handleBack = () => {
    if (step === "otp-verify") {
      setStep("form");
      setOtpCode("");
    } else {
      navigate(-1);
    }
  };

  return {
    isSignUp,
    setIsSignUp,
    step,
    authMethod,
    setAuthMethod,
    formData,
    setFormData,
    otpCode,
    setOtpCode,
    errors,
    touched,
    setTouched,
    loading,
    showResetDialog,
    setShowResetDialog,
    validateForm,
    handlePhoneAuth: handleSignIn, // alias kept for resend wiring in Auth.tsx
    handleResendSignInOTP,
    maskedPhone,
    handleVerifyOTP,
    handleSignIn,
    handleSignUpSubmit,
    handleGoogleSignIn,
    handleBack,
  };
};
