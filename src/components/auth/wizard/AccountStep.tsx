import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";
import { Mail, Phone } from "lucide-react";
import type { AuthMethod } from "../useAuthFlow";
import { cn } from "@/lib/utils";

interface AccountStepProps {
  authMethod: AuthMethod;
  setAuthMethod: (m: AuthMethod) => void;
  formData: { email: string; password: string; name: string; phone: string };
  setFormData: (d: any) => void;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  setTouched: (t: any) => void;
  validateForm: () => boolean;
  loading: boolean;
  onGoogleSignIn: () => void;
}

export const AccountStep = ({
  authMethod, setAuthMethod, formData, setFormData,
  errors, touched, setTouched, validateForm, loading, onGoogleSignIn,
}: AccountStepProps) => {
  return (
    <div className="space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
        <p className="text-muted-foreground text-sm mt-1">Enter your details to get started with SMS verification</p>
      </div>

      {/* Fields - Always collect all for SMS OTP signup */}
      <div className="space-y-4">
        <ValidatedInput
          id="name" type="text" label="Full Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          onBlur={() => { setTouched({ ...touched, name: true }); validateForm(); }}
          error={errors.name} touched={touched.name}
          placeholder="John Doe" required
          className="h-14 rounded-2xl bg-card border-border"
        />
        <ValidatedInput
          id="email" type="email" label="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          onBlur={() => { setTouched({ ...touched, email: true }); validateForm(); }}
          error={errors.email} touched={touched.email}
          placeholder="you@example.com" required
          className="h-14 rounded-2xl bg-card border-border"
        />
        <ValidatedInput
          id="phone" type="tel" label="Phone Number"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          onBlur={() => { setTouched({ ...touched, phone: true }); validateForm(); }}
          error={errors.phone} touched={touched.phone}
          placeholder="263712345678" required
          className="h-14 rounded-2xl bg-card border-border"
        />
        <ValidatedInput
          id="password" type="password" label="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          onBlur={() => { setTouched({ ...touched, password: true }); validateForm(); }}
          error={errors.password} touched={touched.password}
          placeholder="••••••••" required
          className="h-14 rounded-2xl bg-card border-border"
        />
        <PasswordStrengthIndicator password={formData.password} />
      </div>

      <p className="text-xs text-muted-foreground text-center leading-relaxed">
        By signing up, you agree to our{" "}
        <a href="/terms" target="_blank" className="text-primary font-medium underline underline-offset-2">Terms & Conditions</a>{" "}
        and{" "}
        <a href="/privacy" target="_blank" className="text-primary font-medium underline underline-offset-2">Privacy Policy</a>.
      </p>

      {authMethod === "email" && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/40" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-4 text-muted-foreground font-medium">or</span>
            </div>
          </div>
          <Button
            type="button" variant="outline"
            className="w-full h-14 rounded-2xl text-base font-medium gap-3 bg-card border-border"
            disabled={loading}
            onClick={onGoogleSignIn}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>
        </>
      )}
    </div>
  );
};
