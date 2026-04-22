import { Globe, MessageCircle, MapPin, Phone, Mail, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { GoogleMapsLink } from "@/components/ui/GoogleMapsLink";
import { Button } from "@/components/ui/button";

interface MerchantContactInfoProps {
  websiteUrl?: string | null;
  whatsappNumber?: string | null;
  address?: string | null;
  supportPhone?: string | null;
  supportEmail?: string | null;
  className?: string;
  showPlaceholder?: boolean;
  merchantName?: string;
}

export function MerchantContactInfo({
  websiteUrl,
  whatsappNumber,
  address,
  supportPhone,
  supportEmail,
  className,
  showPlaceholder = true,
  merchantName,
}: MerchantContactInfoProps) {
  const hasAnyContact = websiteUrl || whatsappNumber || address || supportPhone || supportEmail;

  const formatWhatsAppLink = (number: string) => {
    const cleaned = number.replace(/[^\d+]/g, '');
    return `https://wa.me/${cleaned.replace('+', '')}`;
  };


  // Show placeholder if no contact info and showPlaceholder is true
  if (!hasAnyContact && showPlaceholder) {
    return (
      <Card className={`p-4 ${className}`}>
        <h3 className="font-semibold mb-3 text-sm">Contact Information</h3>
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            Contact information not available for {merchantName || "this operator"}. 
            Please use the general support for assistance.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full gap-2"
          onClick={() => window.open('https://wa.me/263789583003', '_blank')}
        >
          <MessageCircle className="w-4 h-4" />
          Contact fulticket Support
        </Button>
      </Card>
    );
  }

  if (!hasAnyContact) return null;

  return (
    <Card className={`p-4 ${className}`}>
      <h3 className="font-semibold mb-3 text-sm">Contact Information</h3>
      <div className="space-y-2">
        {whatsappNumber && (
          <a
            href={formatWhatsAppLink(whatsappNumber)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm bg-green-500/10 text-green-600 hover:bg-green-500/20 px-3 py-2 rounded-lg transition-colors font-medium"
          >
            <MessageCircle className="w-4 h-4 flex-shrink-0" />
            <span>Chat on WhatsApp</span>
          </a>
        )}

        {websiteUrl && (
          <a
            href={websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary hover:underline transition-colors"
          >
            <Globe className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{websiteUrl.replace(/^https?:\/\//, '')}</span>
          </a>
        )}

        {supportPhone && (
          <a
            href={`tel:${supportPhone}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Phone className="w-4 h-4 flex-shrink-0" />
            <span>{supportPhone}</span>
          </a>
        )}

        {supportEmail && (
          <a
            href={`mailto:${supportEmail}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Mail className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{supportEmail}</span>
          </a>
        )}

        {address && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <GoogleMapsLink 
              address={address} 
              className="text-sm text-muted-foreground hover:text-foreground line-clamp-2"
              showIcon={false}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
