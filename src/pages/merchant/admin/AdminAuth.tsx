import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ValidatedInput } from "@/components/ui/validated-input";
import { PasswordResetDialog } from "@/components/PasswordResetDialog";
import { useToast } from "@/hooks/use-toast";
import { Shield, Loader2 } from "lucide-react";
import { ThemeProvider } from "next-themes";
import { signInSchema } from "@/lib/validationSchemas";
import { z } from "zod";

const AdminAuth = () => {
  const [signInData, setSignInData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const { user, signIn, loading: authLoading } = useAuth();
  const { isAdminUser, loading: adminCheckLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect immediately if already authenticated as admin
  useEffect(() => {
    if (!authLoading && !adminCheckLoading && user) {
      if (isAdminUser) {
        navigate("/merchant/admin", { replace: true });
      }
    }
  }, [user, isAdminUser, authLoading, adminCheckLoading, navigate]);

  const validateForm = () => {
    try {
      signInSchema.parse(signInData);
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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please check your input and try again",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await signIn(signInData.email, signInData.password);

    if (error) {
      toast({
        title: "Authentication Failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
    // useEffect handles navigation after admin check completes
  };

  // Show loading while checking existing session
  if (authLoading || (user && adminCheckLoading)) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Verifying credentials...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // If user is logged in but not admin, show access denied
  if (user && !adminCheckLoading && !isAdminUser) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-destructive/5 via-background to-primary/5">
          <Card className="w-full max-w-md shadow-2xl animate-fade-in">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-destructive/10 rounded-full">
                  <Shield className="h-8 w-8 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-2xl">Access Denied</CardTitle>
              <CardDescription>
                You do not have admin privileges. Please contact the system administrator.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={() => navigate("/")}>
                Return Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-destructive/5 via-background to-primary/5">
        <Card className="w-full max-w-md shadow-2xl animate-fade-in">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4 animate-scale-in">
              <div className="p-3 bg-destructive/10 rounded-full">
                <Shield className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl">Admin Portal</CardTitle>
            <CardDescription>
              Restricted access - Admin credentials required
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <ValidatedInput
                id="admin-email"
                type="email"
                label="Admin Email"
                value={signInData.email}
                onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                onBlur={() => {
                  setTouched({ ...touched, email: true });
                  validateForm();
                }}
                error={errors.email}
                touched={touched.email}
                placeholder="admin@example.com"
                required
                autoComplete="email"
              />
              <ValidatedInput
                id="admin-password"
                type="password"
                label="Password"
                value={signInData.password}
                onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                onBlur={() => {
                  setTouched({ ...touched, password: true });
                  validateForm();
                }}
                error={errors.password}
                touched={touched.password}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <Button type="submit" className="w-full hover-scale" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Secure Sign In
                  </>
                )}
              </Button>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowResetDialog(true)}
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg border border-border animate-fade-in">
                <p className="text-xs text-center text-muted-foreground">
                  This portal is restricted to authorized administrators only.
                  All access attempts are monitored and logged.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
        <PasswordResetDialog open={showResetDialog} onOpenChange={setShowResetDialog} />
      </div>
    </ThemeProvider>
  );
};

export default AdminAuth;
