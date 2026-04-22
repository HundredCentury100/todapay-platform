import { useState } from "react";
import { Share2, Copy, Check, Users, Mail, MessageCircle, Link2, Loader2, QrCode } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { createBookingLink, getBookingLinkUrl } from "@/services/bookingLinkService";
import QRCode from "react-qr-code";

interface EventShareDialogProps {
  eventId: string;
  eventName: string;
  eventDate: string;
  eventVenue: string;
  trigger?: React.ReactNode;
}

const EventShareDialog = ({ eventId, eventName, eventDate, eventVenue, trigger }: EventShareDialogProps) => {
  const [copied, setCopied] = useState(false);
  const [friendEmails, setFriendEmails] = useState("");
  const [generatingLink, setGeneratingLink] = useState(false);
  const [generatedBookingLink, setGeneratedBookingLink] = useState<string | null>(null);
  const [bookingLinkCopied, setBookingLinkCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const shareUrl = `${window.location.origin}/events/${eventId}`;
  const shareText = `Check out ${eventName} at ${eventVenue} on ${new Date(eventDate).toLocaleDateString()}! 🎉`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateBookingLink = async () => {
    setGeneratingLink(true);
    try {
      const link = await createBookingLink({
        link_type: 'booking',
        service_type: 'event',
        service_id: eventId,
        service_name: eventName,
      });
      const url = getBookingLinkUrl(link.link_code);
      setGeneratedBookingLink(url);
      toast.success("Booking link created!");
    } catch (error) {
      console.error('Error creating booking link:', error);
      toast.error("Failed to create booking link");
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopyBookingLink = async () => {
    if (!generatedBookingLink) return;
    await navigator.clipboard.writeText(generatedBookingLink);
    setBookingLinkCopied(true);
    toast.success("Booking link copied!");
    setTimeout(() => setBookingLinkCopied(false), 2000);
  };

  const handleShareBookingLink = (platform: 'whatsapp' | 'email') => {
    const linkToShare = generatedBookingLink || shareUrl;
    const text = `Book tickets for ${eventName} at ${eventVenue}: ${linkToShare}`;

    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    } else {
      const subject = encodeURIComponent(`Book tickets: ${eventName}`);
      const body = encodeURIComponent(`Hi,\n\nBook your tickets for ${eventName} happening at ${eventVenue} on ${new Date(eventDate).toLocaleDateString()}.\n\nBook here: ${linkToShare}\n\nSee you there! 🎉`);
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }
  };

  const shareOptions = [
    {
      name: "WhatsApp",
      icon: <MessageCircle className="h-5 w-5" />,
      color: "bg-green-500 hover:bg-green-600",
      url: `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
    },
    {
      name: "Facebook",
      icon: <span className="font-bold text-lg">f</span>,
      color: "bg-blue-600 hover:bg-blue-700",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
    },
    {
      name: "Twitter",
      icon: <span className="font-bold">𝕏</span>,
      color: "bg-black hover:bg-gray-800",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "LinkedIn",
      icon: <span className="font-bold text-sm">in</span>,
      color: "bg-blue-700 hover:bg-blue-800",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
  ];

  const handleEmailInvite = () => {
    if (!friendEmails.trim()) {
      toast.error("Please enter at least one email address");
      return;
    }
    
    const subject = encodeURIComponent(`You're invited: ${eventName}`);
    const body = encodeURIComponent(`Hey!\n\nI wanted to invite you to ${eventName} happening at ${eventVenue} on ${new Date(eventDate).toLocaleDateString()}.\n\nCheck it out and let's go together: ${shareUrl}\n\nSee you there! 🎉`);
    
    window.location.href = `mailto:${friendEmails}?subject=${subject}&body=${body}`;
    toast.success("Opening email client...");
  };

  const handleSMSInvite = () => {
    const body = encodeURIComponent(`${shareText} ${shareUrl}`);
    window.location.href = `sms:?body=${body}`;
    toast.success("Opening SMS...");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share Event
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Share This Event
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="share" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="share" className="text-xs sm:text-sm">Share</TabsTrigger>
            <TabsTrigger value="invite" className="text-xs sm:text-sm">Invite</TabsTrigger>
            <TabsTrigger value="booking-link" className="text-xs sm:text-sm">Booking Link</TabsTrigger>
          </TabsList>

          {/* Share Tab */}
          <TabsContent value="share" className="space-y-4 mt-4">
            <div>
              <Label className="text-sm text-muted-foreground mb-3 block">Share on social media</Label>
              <div className="grid grid-cols-4 gap-2">
                {shareOptions.map((option) => (
                  <Button
                    key={option.name}
                    className={`${option.color} text-white flex flex-col items-center gap-1 h-auto py-3`}
                    onClick={() => window.open(option.url, "_blank", "width=600,height=400")}
                  >
                    {option.icon}
                    <span className="text-xs">{option.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">Or copy event link</Label>
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="text-sm" />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Invite Tab */}
          <TabsContent value="invite" className="space-y-4 mt-4">
            <div>
              <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-primary" />
                Invite Friends
              </Label>
              
              <div className="space-y-3">
                <Input
                  placeholder="Enter email addresses (comma separated)"
                  value={friendEmails}
                  onChange={(e) => setFriendEmails(e.target.value)}
                  className="text-sm"
                />
                
                <div className="flex gap-2">
                  <Button 
                    variant="default" 
                    className="flex-1 gap-2"
                    onClick={handleEmailInvite}
                  >
                    <Mail className="h-4 w-4" />
                    Email Invite
                  </Button>
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={handleSMSInvite}
                  >
                    <MessageCircle className="h-4 w-4" />
                    SMS
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Booking Link Tab */}
          <TabsContent value="booking-link" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Generate a trackable booking link that takes people directly to this event's ticket page. Track how many times it's used.
            </p>

            {!generatedBookingLink ? (
              <Button
                onClick={handleGenerateBookingLink}
                disabled={generatingLink}
                className="w-full gap-2"
              >
                {generatingLink ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
                Generate Booking Link
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <Label className="text-xs text-muted-foreground mb-1 block">Your booking link</Label>
                  <p className="font-mono text-xs break-all">{generatedBookingLink}</p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={handleCopyBookingLink}>
                    {bookingLinkCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    {bookingLinkCopied ? 'Copied' : 'Copy'}
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => handleShareBookingLink('whatsapp')}>
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => handleShareBookingLink('email')}>
                    <Mail className="h-4 w-4" />
                    Email
                  </Button>
                </div>

                {/* QR Code */}
                <div className="border-t pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full gap-2 text-muted-foreground"
                    onClick={() => setShowQR(!showQR)}
                  >
                    <QrCode className="h-4 w-4" />
                    {showQR ? 'Hide' : 'Show'} QR Code
                  </Button>
                  {showQR && (
                    <div className="flex justify-center mt-3 p-4 bg-white rounded-lg">
                      <QRCode value={generatedBookingLink} size={160} />
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground"
                  onClick={() => {
                    setGeneratedBookingLink(null);
                    setShowQR(false);
                  }}
                >
                  Generate another link
                </Button>
              </div>
            )}

            <p className="text-xs text-muted-foreground border-t pt-3">
              💡 Each generated link has a unique code. Usage stats are tracked in your dashboard.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EventShareDialog;
