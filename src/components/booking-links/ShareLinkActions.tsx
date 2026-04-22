import { Button } from '@/components/ui/button';
import { Copy, Mail, MessageCircle, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ShareLinkActionsProps {
  linkUrl: string;
  serviceName: string;
}

const ShareLinkActions = ({ linkUrl, serviceName }: ShareLinkActionsProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(linkUrl);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Book ${serviceName}: ${linkUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Book ${serviceName}`);
    const body = encodeURIComponent(`Hi,\n\nClick this link to book ${serviceName}:\n${linkUrl}\n\nBest regards`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleCopy}>
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
      <Button variant="outline" size="sm" onClick={handleWhatsApp}>
        <MessageCircle className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" onClick={handleEmail}>
        <Mail className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ShareLinkActions;
