import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, MessageCircle, Link as LinkIcon, Facebook, Twitter, Copy } from "lucide-react";
import { shareViaEmail, shareViaWhatsApp, shareOnSocial, copyShareLink } from "@/services/ticketSharingService";
import { toast } from "@/hooks/use-toast";

interface TicketShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  bookingData: any;
}

const TicketShareDialog = ({ open, onOpenChange, bookingId, bookingData }: TicketShareDialogProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailShare = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await shareViaEmail(bookingId, email);
      toast({
        title: "Email Opened",
        description: "Email client opened with ticket details",
      });
      setEmail("");
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to share via email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppShare = async () => {
    setLoading(true);
    try {
      await shareViaWhatsApp(bookingId, bookingData);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to share via WhatsApp",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    setLoading(true);
    try {
      await copyShareLink(bookingId);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialShare = (platform: 'facebook' | 'twitter') => {
    shareOnSocial(platform, bookingData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Ticket</DialogTitle>
          <DialogDescription>
            Share your ticket with friends or save it for later
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="direct" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="direct">Direct Share</TabsTrigger>
            <TabsTrigger value="social">Social Media</TabsTrigger>
          </TabsList>

          <TabsContent value="direct" className="space-y-4 mt-4">
            {/* Email Share */}
            <div className="space-y-2">
              <Label htmlFor="email">Share via Email</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="recipient@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button onClick={handleEmailShare} disabled={loading}>
                  <Mail className="w-4 h-4 mr-2" />
                  Send
                </Button>
              </div>
            </div>

            {/* WhatsApp Share */}
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleWhatsAppShare}
              disabled={loading}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Share on WhatsApp
            </Button>

            {/* Copy Link */}
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleCopyLink}
              disabled={loading}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Shareable Link
            </Button>
          </TabsContent>

          <TabsContent value="social" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Share your attendance (ticket details not included)
            </p>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleSocialShare('facebook')}
            >
              <Facebook className="w-4 h-4 mr-2" />
              Share on Facebook
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleSocialShare('twitter')}
            >
              <Twitter className="w-4 h-4 mr-2" />
              Share on Twitter
            </Button>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                ℹ️ Social media shares won't include sensitive ticket information
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="pt-4 border-t text-xs text-muted-foreground">
          <p>⚠️ Share links expire after 72 hours. Direct transfers are permanent.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TicketShareDialog;
