import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Mail, Phone, FileText, Shield } from "lucide-react";

interface VerificationBadgesProps {
  emailVerified?: boolean;
  phoneVerified?: boolean;
  identityVerified?: boolean;
  onVerifyEmail?: () => void;
  onVerifyPhone?: () => void;
  onVerifyIdentity?: () => void;
}

export function VerificationBadges({
  emailVerified = false,
  phoneVerified = false,
  identityVerified = false,
  onVerifyEmail,
  onVerifyPhone,
  onVerifyIdentity,
}: VerificationBadgesProps) {
  const verifications = [
    {
      key: 'email',
      label: 'Email',
      icon: Mail,
      verified: emailVerified,
      onVerify: onVerifyEmail,
    },
    {
      key: 'phone',
      label: 'Phone',
      icon: Phone,
      verified: phoneVerified,
      onVerify: onVerifyPhone,
    },
    {
      key: 'identity',
      label: 'Identity',
      icon: FileText,
      verified: identityVerified,
      onVerify: onVerifyIdentity,
    },
  ];

  const verifiedCount = verifications.filter((v) => v.verified).length;
  const allVerified = verifiedCount === verifications.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Verification Status
          </CardTitle>
          <Badge variant={allVerified ? "default" : "secondary"}>
            {verifiedCount}/{verifications.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {verifications.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      item.verified
                        ? 'bg-green-100 dark:bg-green-900'
                        : 'bg-muted'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${
                        item.verified
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.verified ? 'Verified' : 'Not verified'}
                    </p>
                  </div>
                </div>
                {item.verified ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : item.onVerify ? (
                  <Button size="sm" variant="outline" onClick={item.onVerify}>
                    Verify
                  </Button>
                ) : (
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            );
          })}
        </div>

        {allVerified && (
          <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-700 dark:text-green-400 text-center">
              🎉 Your account is fully verified!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
