import { useState } from 'react';
import { 
  Share2, 
  Copy, 
  Mail, 
  MessageCircle, 
  Check,
  Facebook,
  Twitter
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface PropertyShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: {
    id: string;
    name: string;
    city: string;
    country: string;
    star_rating?: number;
  };
}

export function PropertyShareDialog({ open, onOpenChange, property }: PropertyShareDialogProps) {
  const [copied, setCopied] = useState(false);
  
  const shareUrl = `${window.location.origin}/stays/${property.id}`;
  const shareText = `Check out ${property.name} in ${property.city}, ${property.country}${property.star_rating ? ` - ${property.star_rating}★` : ''}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const shareViaWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
    window.open(url, '_blank');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Check out this property: ${property.name}`);
    const body = encodeURIComponent(`${shareText}\n\nView property: ${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareViaFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareViaTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.name,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Property
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-medium">{property.name}</p>
            <p className="text-sm text-muted-foreground">
              {property.city}, {property.country}
            </p>
          </div>

          <div className="flex gap-2">
            <Input value={shareUrl} readOnly className="flex-1" />
            <Button variant="outline" size="icon" onClick={copyToClipboard}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={shareViaWhatsApp}
            >
              <MessageCircle className="mr-2 h-4 w-4 text-green-600" />
              WhatsApp
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={shareViaEmail}
            >
              <Mail className="mr-2 h-4 w-4 text-blue-600" />
              Email
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={shareViaFacebook}
            >
              <Facebook className="mr-2 h-4 w-4 text-blue-700" />
              Facebook
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={shareViaTwitter}
            >
              <Twitter className="mr-2 h-4 w-4 text-sky-500" />
              Twitter
            </Button>
          </div>

          {navigator.share && (
            <Button className="w-full" onClick={shareNative}>
              <Share2 className="mr-2 h-4 w-4" />
              More Options
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
