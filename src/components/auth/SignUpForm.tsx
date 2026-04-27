import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ValidatedInput } from "@/components/ui/validated-input";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";
import { Loader2, Sparkles, Mail, Phone, Ticket, Car } from "lucide-react";
import type { AuthMethod } from "./useAuthFlow";
import { cn } from "@/lib/utils";

interface SignUpFormProps {
  authMethod: AuthMethod;
  setAuthMethod: (m: AuthMethod) => void;
  formData: { email: string; password: string; name: string; phone: string };
  setFormData: (d: any) => void;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  setTouched: (t: any) => void;
  validateForm: () => boolean;
  loading: boolean;
  onSubmit: () => void;
  onGoogleSignIn: () => void;
  onToggleMode: () => void;
  selectedRole?: "consumer" | "driver";
  onRoleChange?: (role: "consumer" | "driver") => void;
}

export const SignUpForm = ({
  authMethod, setAuthMethod, formData, setFormData,
  errors, touched, setTouched, validateForm, loading,
  onSubmit, onGoogleSignIn, onToggleMode, selectedRole = "consumer", onRoleChange,
}: SignUpFormProps) => {
  const isDriver = selectedRole === "driver";

  return (
    <>
      {/* Header */}
      <div className="text-center mb-6">
        <motion.div
          className="relative w-20 h-20 mx-auto mb-5"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <div className={cn(
            "absolute inset-0 rounded-3xl blur-xl opacity-40 bg-gradient-to-br",
            isDriver ? "from-amber-500 to-orange-400" : "from-blue-500 to-cyan-400"
          )} />
          <div className={cn(
            "relative w-full h-full rounded-3xl flex items-center justify-center shadow-2xl bg-gradient-to-br text-white",
            isDriver ? "from-amber-500 to-orange-400" : "from-blue-500 to-cyan-400"
          )}>
            {isDriver ? <Car className="h-10 w-10" /> : <img src="/logoTodaPay.png" alt="TodaPay" className="h-10 w-10" />}
          </div>
        </motion.div>

        <motion.h1 className="text-2xl font-bold tracking-tight" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          Create Your Account
        </motion.h1>
        <motion.div className="mt-2 flex items-center justify-center gap-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground text-sm">Join TodaPay Zimbabwe</span>
        </motion.div>
      </div>

      {/* Consumer / Driver Toggle */}
      {onRoleChange && (
        <motion.div className="flex gap-1 p-1 bg-muted/60 rounded-2xl mb-4 backdrop-blur-sm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <button
            type="button"
            onClick={() => onRoleChange("consumer")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
              selectedRole === "consumer"
                ? "bg-background text-foreground shadow-sm border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <img src="/logoTodaPay.png" alt="TodaPay" className="h-4 w-4" /> Traveler
          </button>
          <button
            type="button"
            onClick={() => onRoleChange("driver")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
              selectedRole === "driver"
                ? "bg-background text-foreground shadow-sm border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Car className="h-4 w-4" /> Driver
          </button>
        </motion.div>
      )}

      {/* Auth Method Toggle */}
      <motion.div className="flex gap-1 p-1 bg-muted/60 rounded-2xl mb-6 backdrop-blur-sm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
        <button type="button" onClick={() => setAuthMethod("email")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
            authMethod === "email"
              ? "bg-background text-foreground shadow-sm border border-border/50"
              : "text-muted-foreground hover:text-foreground"
          }`}>
          <Mail className="h-4 w-4" /> Email
        </button>
        <button type="button" onClick={() => setAuthMethod("phone")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
            authMethod === "phone"
              ? "bg-background text-foreground shadow-sm border border-border/50"
              : "text-muted-foreground hover:text-foreground"
          }`}>
          <Phone className="h-4 w-4" /> Phone
        </button>
      </motion.div>

      {/* Form */}
      <motion.form
        onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        {authMethod === "phone" ? (
          <>
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
              id="phone" type="tel" label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              onBlur={() => { setTouched({ ...touched, phone: true }); validateForm(); }}
              error={errors.phone} touched={touched.phone}
              placeholder="+263 7X XXX XXXX" required
              className="h-14 rounded-2xl bg-card border-border"
            />
          </>
        ) : (
          <>
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
              id="password" type="password" label="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              onBlur={() => { setTouched({ ...touched, password: true }); validateForm(); }}
              error={errors.password} touched={touched.password}
              placeholder="••••••••" required
              className="h-14 rounded-2xl bg-card border-border"
            />
            <PasswordStrengthIndicator password={formData.password} />
          </>
        )}

        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          By signing up, you agree to our{" "}
          <a href="/terms" target="_blank" className="text-primary font-medium underline underline-offset-2 hover:text-primary/80">Terms & Conditions</a>{" "}
          and{" "}
          <a href="/privacy" target="_blank" className="text-primary font-medium underline underline-offset-2 hover:text-primary/80">Privacy Policy</a>.
        </p>

        <Button
          type="submit"
          className="w-full h-14 rounded-2xl text-base font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
          disabled={loading}
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : authMethod === "phone" ? "Send Code" : "Create Account"}
        </Button>

        {authMethod === "email" && (
          <>
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/40" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-4 text-muted-foreground font-medium">or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-14 rounded-2xl text-base font-medium gap-3 bg-card border-border hover:bg-card/80 transition-all"
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
      </motion.form>

      {/* Toggle + Business notice */}
      <motion.div className="mt-8 text-center space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <button onClick={onToggleMode} className="text-primary font-bold hover:text-primary/80 transition-colors">Sign In</button>
        </p>
        <p className="text-xs text-muted-foreground/70">
          Business or agent accounts are created by our admin team.{" "}
          <a href="mailto:support@todapayments.com" className="text-primary/70 underline underline-offset-2 hover:text-primary">Contact us</a>
        </p>
      </motion.div>
    </>
  );
};
