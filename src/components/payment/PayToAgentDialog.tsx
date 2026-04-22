import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Banknote, CreditCard, User, MapPin, Store, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentPaymentOption {
  agentId: string;
  agentName: string;
  agentPhone: string;
  agentLocation: string;
  distance?: string;
  acceptsCash: boolean;
  acceptsPOS: boolean;
}

interface PayToAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  bookingReference: string;
  agents: AgentPaymentOption[];
  onConfirm: (agentId: string, paymentMethod: "cash" | "pos") => void;
  isProcessing?: boolean;
}

export function PayToAgentDialog({
  open,
  onOpenChange,
  amount,
  bookingReference,
  agents,
  onConfirm,
  isProcessing = false,
}: PayToAgentDialogProps) {
  const { convertPrice } = useCurrency();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "pos">("cash");
  const [step, setStep] = useState<"select-agent" | "select-method" | "confirmed">("select-agent");

  const handleConfirm = () => {
    if (!selectedAgent) return;
    onConfirm(selectedAgent, paymentMethod);
    setStep("confirmed");
  };

  const selectedAgentData = agents.find((a) => a.agentId === selectedAgent);

  const handleClose = () => {
    onOpenChange(false);
    // Reset after animation
    setTimeout(() => {
      setSelectedAgent(null);
      setPaymentMethod("cash");
      setStep("select-agent");
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === "select-agent" && "Pay via Agent"}
            {step === "select-method" && "Select Payment Method"}
            {step === "confirmed" && "Payment Instructions"}
          </DialogTitle>
          <DialogDescription>
            {step === "select-agent" &&
              "Choose a nearby agent to make your cash or POS payment"}
            {step === "select-method" && "How would you like to pay?"}
            {step === "confirmed" && "Visit the agent to complete your payment"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Step 1: Select Agent */}
          {step === "select-agent" && (
            <div className="space-y-3">
              {agents.length === 0 ? (
                <div className="text-center py-8">
                  <Store className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No agents available in your area</p>
                </div>
              ) : (
                agents.map((agent) => (
                  <button
                    key={agent.agentId}
                    onClick={() => setSelectedAgent(agent.agentId)}
                    className={cn(
                      "w-full p-4 rounded-lg border text-left transition-colors",
                      selectedAgent === agent.agentId
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{agent.agentName}</p>
                          {agent.distance && (
                            <span className="text-xs text-muted-foreground">
                              {agent.distance}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {agent.agentLocation}
                        </p>
                        <div className="flex gap-2 mt-2">
                          {agent.acceptsCash && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Banknote className="h-3 w-3" />
                              Cash
                            </Badge>
                          )}
                          {agent.acceptsPOS && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <CreditCard className="h-3 w-3" />
                              POS
                            </Badge>
                          )}
                        </div>
                      </div>
                      {selectedAgent === agent.agentId && (
                        <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Step 2: Select Payment Method */}
          {step === "select-method" && selectedAgentData && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{selectedAgentData.agentName}</span>
                </div>
                <p className="text-sm text-muted-foreground">{selectedAgentData.agentLocation}</p>
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(v) => setPaymentMethod(v as "cash" | "pos")}
                  className="grid grid-cols-2 gap-3"
                >
                  {selectedAgentData.acceptsCash && (
                    <Label
                      htmlFor="cash"
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors",
                        paymentMethod === "cash"
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-muted-foreground/30"
                      )}
                    >
                      <RadioGroupItem value="cash" id="cash" className="sr-only" />
                      <Banknote
                        className={cn("h-6 w-6", paymentMethod === "cash" && "text-primary")}
                      />
                      <span className="text-sm font-medium">Cash</span>
                    </Label>
                  )}
                  {selectedAgentData.acceptsPOS && (
                    <Label
                      htmlFor="pos"
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors",
                        paymentMethod === "pos"
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-muted-foreground/30"
                      )}
                    >
                      <RadioGroupItem value="pos" id="pos" className="sr-only" />
                      <CreditCard
                        className={cn("h-6 w-6", paymentMethod === "pos" && "text-primary")}
                      />
                      <span className="text-sm font-medium">POS / Card</span>
                    </Label>
                  )}
                </RadioGroup>
              </div>

              <div className="p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Amount to Pay</span>
                  <span className="text-2xl font-bold">{convertPrice(amount)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirmed */}
          {step === "confirmed" && selectedAgentData && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Payment Reserved</h3>
                <p className="text-sm text-muted-foreground">
                  Your booking is reserved. Visit the agent below to complete payment.
                </p>
              </div>

              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Reference</span>
                    <span className="font-mono font-medium">{bookingReference}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="font-bold text-lg">{convertPrice(amount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Method</span>
                    <Badge variant="outline" className="gap-1">
                      {paymentMethod === "cash" ? (
                        <Banknote className="h-3 w-3" />
                      ) : (
                        <CreditCard className="h-3 w-3" />
                      )}
                      {paymentMethod === "cash" ? "Cash" : "POS"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Agent Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{selectedAgentData.agentName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedAgentData.agentLocation}</span>
                  </div>
                  {selectedAgentData.agentPhone && (
                    <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                      <a href={`tel:${selectedAgentData.agentPhone}`}>
                        Call Agent: {selectedAgentData.agentPhone}
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>

              <p className="text-xs text-center text-muted-foreground">
                Payment must be completed within 24 hours or the booking will be cancelled.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === "select-agent" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={() => setStep("select-method")} disabled={!selectedAgent}>
                Continue
              </Button>
            </>
          )}
          {step === "select-method" && (
            <>
              <Button variant="outline" onClick={() => setStep("select-agent")}>
                Back
              </Button>
              <Button onClick={handleConfirm} disabled={isProcessing}>
                Confirm Payment Method
              </Button>
            </>
          )}
          {step === "confirmed" && (
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Agent payment option card for checkout page
export function AgentPaymentOptionCard({
  selected,
  onSelect,
  agentCount = 0,
}: {
  selected: boolean;
  onSelect: () => void;
  agentCount?: number;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full p-4 rounded-lg border-2 text-left transition-all",
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-muted hover:border-muted-foreground/30"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "p-2 rounded-full",
            selected ? "bg-primary text-primary-foreground" : "bg-muted"
          )}
        >
          <Store className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-medium">Pay at Agent Location</p>
          <p className="text-sm text-muted-foreground">
            Cash or POS payment at a nearby agent
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="gap-1">
            <Banknote className="h-3 w-3" />
            Cash
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <CreditCard className="h-3 w-3" />
            POS
          </Badge>
        </div>
      </div>
      {agentCount > 0 && (
        <p className="text-xs text-muted-foreground mt-2 ml-12">
          {agentCount} agent{agentCount !== 1 ? "s" : ""} available near you
        </p>
      )}
    </button>
  );
}
