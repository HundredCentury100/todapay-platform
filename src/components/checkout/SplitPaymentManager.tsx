import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Users, Plus, Trash2, Send, Copy, CheckCircle, Clock, 
  Mail, Loader2, Share2, RefreshCw
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { 
  splitPaymentService, 
  SplitPaymentRequest, 
  SplitPaymentContribution 
} from "@/services/splitPaymentService";
import { useToast } from "@/hooks/use-toast";

interface Participant {
  email: string;
  name: string;
}

interface SplitPaymentManagerProps {
  bookingId: string | null;
  totalAmount: number;
  onComplete?: () => void;
}

export const SplitPaymentManager = ({
  bookingId,
  totalAmount,
  onComplete,
}: SplitPaymentManagerProps) => {
  const { convertPrice } = useCurrency();
  const { toast } = useToast();
  const [mode, setMode] = useState<'create' | 'view'>('create');
  const [participants, setParticipants] = useState<Participant[]>([
    { email: '', name: '' }
  ]);
  const [splitRequest, setSplitRequest] = useState<SplitPaymentRequest | null>(null);
  const [contributions, setContributions] = useState<SplitPaymentContribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const addParticipant = () => {
    if (participants.length < 10) {
      setParticipants([...participants, { email: '', name: '' }]);
    }
  };

  const removeParticipant = (index: number) => {
    if (participants.length > 1) {
      setParticipants(participants.filter((_, i) => i !== index));
    }
  };

  const updateParticipant = (index: number, field: keyof Participant, value: string) => {
    const updated = [...participants];
    updated[index] = { ...updated[index], [field]: value };
    setParticipants(updated);
  };

  const amountPerPerson = participants.length > 0 
    ? Math.ceil((totalAmount / participants.length) * 100) / 100 
    : totalAmount;

  const handleCreateSplit = async () => {
    const validParticipants = participants.filter(p => p.email.trim());
    
    if (validParticipants.length < 2) {
      toast({
        title: "More Participants Needed",
        description: "Add at least 2 participants to split the payment",
        variant: "destructive",
      });
      return;
    }

    // Validate emails
    const invalidEmails = validParticipants.filter(p => 
      !p.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    );
    if (invalidEmails.length > 0) {
      toast({
        title: "Invalid Email",
        description: "Please enter valid email addresses for all participants",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { request, contributions } = await splitPaymentService.createSplitRequest(
        bookingId,
        totalAmount,
        validParticipants
      );

      setSplitRequest(request);
      setContributions(contributions);
      setMode('view');

      toast({
        title: "Split Payment Created",
        description: "Payment links have been generated for all participants",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create split payment request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshContributions = async () => {
    if (!splitRequest) return;
    
    setRefreshing(true);
    try {
      const updatedContributions = await splitPaymentService.getContributions(splitRequest.id);
      setContributions(updatedContributions);

      const progress = splitPaymentService.getPaymentProgress(updatedContributions);
      if (progress.percentage === 100) {
        toast({
          title: "All Payments Received",
          description: "Everyone has completed their payment!",
        });
        onComplete?.();
      }
    } catch (error) {
      console.error("Failed to refresh contributions:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const copyPaymentLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied",
      description: "Payment link copied to clipboard",
    });
  };

  const sharePaymentLink = async (contribution: SplitPaymentContribution) => {
    const shareData = {
      title: 'Split Payment Request',
      text: `Hi ${contribution.participant_name || 'there'}! Please pay your share of ${convertPrice(contribution.amount)} for our booking.`,
      url: contribution.payment_link || '',
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        copyPaymentLink(contribution.payment_link || '');
      }
    } else {
      copyPaymentLink(contribution.payment_link || '');
    }
  };

  const progress = contributions.length > 0 
    ? splitPaymentService.getPaymentProgress(contributions)
    : null;

  if (mode === 'view' && splitRequest) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Split Payment Status
            </h3>
            <p className="text-sm text-muted-foreground">
              Track payments from all participants
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={refreshContributions} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {progress && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {progress.paid} of {progress.total} paid
                </span>
                <span className="text-sm text-muted-foreground">
                  {progress.percentage}%
                </span>
              </div>
              <Progress value={progress.percentage} className="h-2" />
              <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                <span>Collected: {convertPrice(progress.amountCollected)}</span>
                <span>Remaining: {convertPrice(progress.amountRemaining)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {contributions.map((contribution) => (
            <Card key={contribution.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      contribution.payment_status === 'paid' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-amber-100 text-amber-600'
                    }`}>
                      {contribution.payment_status === 'paid' ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Clock className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">
                        {contribution.participant_name || contribution.participant_email}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {contribution.participant_email}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-semibold">{convertPrice(contribution.amount)}</div>
                      <Badge variant={contribution.payment_status === 'paid' ? 'default' : 'secondary'}>
                        {contribution.payment_status === 'paid' ? 'Paid' : 'Pending'}
                      </Badge>
                    </div>
                    
                    {contribution.payment_status !== 'paid' && contribution.payment_link && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyPaymentLink(contribution.payment_link!)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => sharePaymentLink(contribution)}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Alert>
          <Mail className="h-4 w-4" />
          <AlertDescription>
            Payment links have been generated. Share them with participants via WhatsApp, 
            email, or any messaging app.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          Split Payment
        </h3>
        <p className="text-sm text-muted-foreground">
          Divide the cost among multiple people
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Participants</CardTitle>
            <Button variant="outline" size="sm" onClick={addParticipant}>
              <Plus className="h-4 w-4 mr-2" />
              Add Person
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {participants.map((participant, index) => (
            <div key={index} className="flex items-end gap-3">
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Name</Label>
                  <Input
                    placeholder="John Doe"
                    value={participant.name}
                    onChange={(e) => updateParticipant(index, 'name', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Email *</Label>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    value={participant.email}
                    onChange={(e) => updateParticipant(index, 'email', e.target.value)}
                  />
                </div>
              </div>
              {participants.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeParticipant(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Total Amount</div>
              <div className="text-lg font-semibold">{convertPrice(totalAmount)}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">÷ {participants.length} people</div>
              <div className="text-2xl font-bold text-primary">{convertPrice(amountPerPerson)}</div>
              <div className="text-xs text-muted-foreground">each</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button 
        onClick={handleCreateSplit} 
        disabled={loading || participants.filter(p => p.email.trim()).length < 2}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Creating Split...
          </>
        ) : (
          <>
            <Send className="mr-2 h-5 w-5" />
            Create Split & Send Links
          </>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Each participant will receive a unique payment link valid for 48 hours
      </p>
    </div>
  );
};
