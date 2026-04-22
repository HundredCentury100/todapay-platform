import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Phone, Loader2 } from "lucide-react";

interface OTPVerificationProps {
  phone: string;
  otpCode: string;
  setOtpCode: (code: string) => void;
  loading: boolean;
  onVerify: () => void;
  onResend: () => void;
}

export const OTPVerification = ({
  phone, otpCode, setOtpCode, loading, onVerify, onResend,
}: OTPVerificationProps) => {
  return (
    <>
      <div className="text-center mb-8">
        <motion.div
          className="w-20 h-20 mx-auto mb-5 bg-primary rounded-3xl flex items-center justify-center shadow-super-lg"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Phone className="h-10 w-10 text-primary-foreground" />
        </motion.div>
        <h2 className="text-2xl font-bold">Enter Verification Code</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          We sent a 6-digit code to <span className="font-semibold text-foreground">{phone}</span>
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
          <InputOTPGroup>
            <InputOTPSlot index={0} className="w-12 h-14 text-lg rounded-xl border-border/50" />
            <InputOTPSlot index={1} className="w-12 h-14 text-lg rounded-xl border-border/50" />
            <InputOTPSlot index={2} className="w-12 h-14 text-lg rounded-xl border-border/50" />
            <InputOTPSlot index={3} className="w-12 h-14 text-lg rounded-xl border-border/50" />
            <InputOTPSlot index={4} className="w-12 h-14 text-lg rounded-xl border-border/50" />
            <InputOTPSlot index={5} className="w-12 h-14 text-lg rounded-xl border-border/50" />
          </InputOTPGroup>
        </InputOTP>
      </div>

      <Button
        onClick={onVerify}
        disabled={otpCode.length !== 6 || loading}
        className="w-full h-14 rounded-2xl text-base font-semibold bg-primary shadow-glow"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & Continue"}
      </Button>

      <div className="mt-4 text-center">
        <button type="button" onClick={onResend} disabled={loading} className="text-sm text-primary font-semibold">
          Resend Code
        </button>
      </div>
    </>
  );
};
