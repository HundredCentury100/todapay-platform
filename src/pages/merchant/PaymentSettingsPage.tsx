import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { getMerchantPaymentMethods, createOrUpdatePaymentMethod } from "@/services/paymentService";
import { MerchantPaymentMethod, BankTransferConfig, MobileMoneyConfig, PaymentGatewayConfig } from "@/types/payment";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Building2, Smartphone, Wallet, Loader2, Banknote } from "lucide-react";
import { useSearchParams } from "react-router-dom";

interface PayoutBankDetails {
  bank_name: string;
  account_name: string;
  account_number: string;
  branch_code: string;
  swift_code: string;
  mobile_money_number: string;
  mobile_money_provider: string;
  preferred_method: string;
}

export default function PaymentSettingsPage() {
  const { merchantProfile } = useMerchantAuth();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "cash";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [methods, setMethods] = useState<MerchantPaymentMethod[]>([]);

  const [cashEnabled, setCashEnabled] = useState(false);
  const [bankTransferEnabled, setBankTransferEnabled] = useState(false);
  const [mobileMoneyEnabled, setMobileMoneyEnabled] = useState(false);
  const [paymentGatewayEnabled, setPaymentGatewayEnabled] = useState(false);

  const [bankConfig, setBankConfig] = useState<BankTransferConfig>({
    bank_name: "",
    account_number: "",
    account_name: "",
    swift_code: "",
    instructions: "",
  });

  const [mobileConfig, setMobileConfig] = useState<MobileMoneyConfig>({
    provider: "mpesa",
    shortcode: "",
    business_number: "",
    instructions: "",
  });

  const [gatewayConfig, setGatewayConfig] = useState<PaymentGatewayConfig>({
    gateway_provider: "stripe",
    merchant_id: "",
    test_mode: true,
  });

  const [payoutDetails, setPayoutDetails] = useState<PayoutBankDetails>({
    bank_name: "",
    account_name: "",
    account_number: "",
    branch_code: "",
    swift_code: "",
    mobile_money_number: "",
    mobile_money_provider: "",
    preferred_method: "bank_transfer",
  });
  const [savingPayout, setSavingPayout] = useState(false);

  useEffect(() => {
    loadPaymentMethods();
    loadPayoutDetails();
  }, [merchantProfile]);

  const loadPaymentMethods = async () => {
    if (!merchantProfile) return;
    try {
      const data = await getMerchantPaymentMethods(merchantProfile.id);
      setMethods(data);

      data.forEach((method) => {
        if (method.payment_type === "cash") {
          setCashEnabled(method.is_active);
        } else if (method.payment_type === "bank_transfer") {
          setBankTransferEnabled(method.is_active);
          setBankConfig(method.configuration as BankTransferConfig);
        } else if (method.payment_type === "mobile_money") {
          setMobileMoneyEnabled(method.is_active);
          setMobileConfig(method.configuration as MobileMoneyConfig);
        } else if (method.payment_type === "payment_gateway") {
          setPaymentGatewayEnabled(method.is_active);
          setGatewayConfig(method.configuration as PaymentGatewayConfig);
        }
      });
    } catch (error) {
      console.error("Error loading payment methods:", error);
      toast.error("Failed to load payment methods");
    } finally {
      setLoading(false);
    }
  };

  const loadPayoutDetails = async () => {
    if (!merchantProfile) return;
    try {
      const { data, error } = await supabase
        .from("merchant_profiles")
        .select("payout_details")
        .eq("id", merchantProfile.id)
        .single();

      if (error) throw error;
      if (data?.payout_details && typeof data.payout_details === 'object') {
        setPayoutDetails(prev => ({ ...prev, ...(data.payout_details as Record<string, any>) }));
      }
    } catch (error) {
      console.error("Error loading payout details:", error);
    }
  };

  const handleSave = async (methodType: string, config: any, enabled: boolean) => {
    if (!merchantProfile) return;
    setSaving(true);
    try {
      await createOrUpdatePaymentMethod(merchantProfile.id, methodType, config, enabled);
      toast.success("Payment method updated successfully");
      await loadPaymentMethods();
    } catch (error) {
      console.error("Error saving payment method:", error);
      toast.error("Failed to update payment method");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePayoutDetails = async () => {
    if (!merchantProfile) return;
    setSavingPayout(true);
    try {
      const { error } = await supabase
        .from("merchant_profiles")
        .update({
          payout_details: payoutDetails as any,
          payout_method: payoutDetails.preferred_method,
        })
        .eq("id", merchantProfile.id);

      if (error) throw error;
      toast.success("Payout banking details saved successfully");
    } catch (error) {
      console.error("Error saving payout details:", error);
      toast.error("Failed to save payout details");
    } finally {
      setSavingPayout(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Payment Settings</h1>
        <p className="text-sm md:text-base text-muted-foreground">Configure how you receive payments and where payouts are sent</p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="cash">
            <Wallet className="h-4 w-4 mr-2 hidden sm:inline" />
            Cash
          </TabsTrigger>
          <TabsTrigger value="bank">
            <Building2 className="h-4 w-4 mr-2 hidden sm:inline" />
            Bank
          </TabsTrigger>
          <TabsTrigger value="mobile">
            <Smartphone className="h-4 w-4 mr-2 hidden sm:inline" />
            Mobile
          </TabsTrigger>
          <TabsTrigger value="gateway">
            <CreditCard className="h-4 w-4 mr-2 hidden sm:inline" />
            Gateway
          </TabsTrigger>
          <TabsTrigger value="payout">
            <Banknote className="h-4 w-4 mr-2 hidden sm:inline" />
            Payouts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cash">
          <Card>
            <CardHeader>
              <CardTitle>Cash on Delivery / Collection</CardTitle>
              <CardDescription>Accept cash payments at pickup or delivery</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="cash-enabled">Enable Cash Payments</Label>
                <Switch
                  id="cash-enabled"
                  checked={cashEnabled}
                  onCheckedChange={(checked) => {
                    setCashEnabled(checked);
                    handleSave("cash", {}, checked);
                  }}
                />
              </div>
              {cashEnabled && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Customers will be required to pay cash on delivery or at the point of service.
                    Please ensure your staff is trained to handle cash transactions securely.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank">
          <Card>
            <CardHeader>
              <CardTitle>Bank Transfer</CardTitle>
              <CardDescription>Accept payments via bank transfer with proof of payment upload</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="bank-enabled">Enable Bank Transfer</Label>
                <Switch
                  id="bank-enabled"
                  checked={bankTransferEnabled}
                  onCheckedChange={setBankTransferEnabled}
                />
              </div>

              {bankTransferEnabled && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bank-name">Bank Name *</Label>
                      <Input
                        id="bank-name"
                        value={bankConfig.bank_name}
                        onChange={(e) => setBankConfig({ ...bankConfig, bank_name: e.target.value })}
                        placeholder="e.g., First National Bank"
                      />
                    </div>
                    <div>
                      <Label htmlFor="account-number">Account Number *</Label>
                      <Input
                        id="account-number"
                        value={bankConfig.account_number}
                        onChange={(e) => setBankConfig({ ...bankConfig, account_number: e.target.value })}
                        placeholder="1234567890"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="account-name">Account Name *</Label>
                      <Input
                        id="account-name"
                        value={bankConfig.account_name}
                        onChange={(e) => setBankConfig({ ...bankConfig, account_name: e.target.value })}
                        placeholder="Business Name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="swift-code">SWIFT/Routing Code</Label>
                      <Input
                        id="swift-code"
                        value={bankConfig.swift_code || ""}
                        onChange={(e) => setBankConfig({ ...bankConfig, swift_code: e.target.value })}
                        placeholder="FNBSZA01"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bank-instructions">Payment Instructions</Label>
                    <Textarea
                      id="bank-instructions"
                      value={bankConfig.instructions || ""}
                      onChange={(e) => setBankConfig({ ...bankConfig, instructions: e.target.value })}
                      placeholder="Enter any additional instructions for customers"
                      rows={3}
                    />
                  </div>

                  <Button onClick={() => handleSave("bank_transfer", bankConfig, bankTransferEnabled)} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Bank Details
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mobile">
          <Card>
            <CardHeader>
              <CardTitle>Mobile Money</CardTitle>
              <CardDescription>Accept mobile money payments with USSD dial functionality</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="mobile-enabled">Enable Mobile Money</Label>
                <Switch
                  id="mobile-enabled"
                  checked={mobileMoneyEnabled}
                  onCheckedChange={setMobileMoneyEnabled}
                />
              </div>

              {mobileMoneyEnabled && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="provider">Provider *</Label>
                    <Select
                      value={mobileConfig.provider}
                      onValueChange={(value: any) => setMobileConfig({ ...mobileConfig, provider: value })}
                    >
                      <SelectTrigger id="provider">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ecocash">EcoCash</SelectItem>
                        <SelectItem value="onemoney">OneMoney</SelectItem>
                        <SelectItem value="innbucks">InnBucks</SelectItem>
                        <SelectItem value="telecash">TeleCash</SelectItem>
                        <SelectItem value="omari">O'mari</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="shortcode">Business Shortcode *</Label>
                      <Input
                        id="shortcode"
                        value={mobileConfig.shortcode}
                        onChange={(e) => setMobileConfig({ ...mobileConfig, shortcode: e.target.value })}
                        placeholder="e.g., *150*00#"
                      />
                    </div>
                    <div>
                      <Label htmlFor="business-number">Business Number *</Label>
                      <Input
                        id="business-number"
                        value={mobileConfig.business_number}
                        onChange={(e) => setMobileConfig({ ...mobileConfig, business_number: e.target.value })}
                        placeholder="e.g., 123456"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="mobile-instructions">Payment Instructions</Label>
                    <Textarea
                      id="mobile-instructions"
                      value={mobileConfig.instructions || ""}
                      onChange={(e) => setMobileConfig({ ...mobileConfig, instructions: e.target.value })}
                      placeholder="Enter any additional instructions for customers"
                      rows={3}
                    />
                  </div>

                  <Button onClick={() => handleSave("mobile_money", mobileConfig, mobileMoneyEnabled)} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Mobile Money Details
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gateway">
          <Card>
            <CardHeader>
              <CardTitle>Payment Gateway</CardTitle>
              <CardDescription>Integrate with payment processors for card and online payments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="gateway-enabled">Enable Payment Gateway</Label>
                <Switch
                  id="gateway-enabled"
                  checked={paymentGatewayEnabled}
                  onCheckedChange={setPaymentGatewayEnabled}
                />
              </div>

              {paymentGatewayEnabled && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="gateway-provider">Gateway Provider *</Label>
                    <Select
                      value={gatewayConfig.gateway_provider}
                      onValueChange={(value: any) => setGatewayConfig({ ...gatewayConfig, gateway_provider: value })}
                    >
                      <SelectTrigger id="gateway-provider">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flutterwave">Flutterwave (Pan-African)</SelectItem>
                        <SelectItem value="paystack">Paystack (Nigeria, Ghana, SA)</SelectItem>
                        <SelectItem value="fawry">Fawry (Egypt)</SelectItem>
                        <SelectItem value="dpo">DPO Group (Pan-African)</SelectItem>
                        <SelectItem value="stripe">Stripe</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="merchant-id">Merchant ID</Label>
                    <Input
                      id="merchant-id"
                      value={gatewayConfig.merchant_id || ""}
                      onChange={(e) => setGatewayConfig({ ...gatewayConfig, merchant_id: e.target.value })}
                      placeholder="Your gateway merchant ID"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="test-mode"
                      checked={gatewayConfig.test_mode || false}
                      onCheckedChange={(checked) => setGatewayConfig({ ...gatewayConfig, test_mode: checked })}
                    />
                    <Label htmlFor="test-mode">Test Mode</Label>
                  </div>

                  <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <strong>Important:</strong> API keys are stored securely. For full gateway integration, contact support or configure your API keys in the advanced settings.
                    </p>
                  </div>

                  <Button onClick={() => handleSave("payment_gateway", gatewayConfig, paymentGatewayEnabled)} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Gateway Settings
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payout">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5" />
                Payout Banking Details
              </CardTitle>
              <CardDescription>
                Enter the bank account or mobile wallet where your earnings and payouts will be sent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Preferred method */}
              <div>
                <Label htmlFor="payout-method">Preferred Payout Method *</Label>
                <Select
                  value={payoutDetails.preferred_method}
                  onValueChange={(value) => setPayoutDetails({ ...payoutDetails, preferred_method: value })}
                >
                  <SelectTrigger id="payout-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bank Transfer Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Bank Account Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="payout-bank-name">Bank Name *</Label>
                    <Input
                      id="payout-bank-name"
                      value={payoutDetails.bank_name}
                      onChange={(e) => setPayoutDetails({ ...payoutDetails, bank_name: e.target.value })}
                      placeholder="e.g., CBZ Bank, Stanbic"
                    />
                  </div>
                  <div>
                    <Label htmlFor="payout-account-name">Account Holder Name *</Label>
                    <Input
                      id="payout-account-name"
                      value={payoutDetails.account_name}
                      onChange={(e) => setPayoutDetails({ ...payoutDetails, account_name: e.target.value })}
                      placeholder="As it appears on your bank account"
                    />
                  </div>
                  <div>
                    <Label htmlFor="payout-account-number">Account Number *</Label>
                    <Input
                      id="payout-account-number"
                      value={payoutDetails.account_number}
                      onChange={(e) => setPayoutDetails({ ...payoutDetails, account_number: e.target.value })}
                      placeholder="Your bank account number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="payout-branch-code">Branch Code</Label>
                    <Input
                      id="payout-branch-code"
                      value={payoutDetails.branch_code}
                      onChange={(e) => setPayoutDetails({ ...payoutDetails, branch_code: e.target.value })}
                      placeholder="Branch sort code"
                    />
                  </div>
                  <div>
                    <Label htmlFor="payout-swift">SWIFT Code</Label>
                    <Input
                      id="payout-swift"
                      value={payoutDetails.swift_code}
                      onChange={(e) => setPayoutDetails({ ...payoutDetails, swift_code: e.target.value })}
                      placeholder="e.g., CBZIZWHX"
                    />
                  </div>
                </div>
              </div>

              {/* Mobile Money Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Mobile Money Details (Alternative)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="payout-mm-provider">Mobile Money Provider</Label>
                    <Select
                      value={payoutDetails.mobile_money_provider}
                      onValueChange={(value) => setPayoutDetails({ ...payoutDetails, mobile_money_provider: value })}
                    >
                      <SelectTrigger id="payout-mm-provider">
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ecocash">EcoCash</SelectItem>
                        <SelectItem value="onemoney">OneMoney</SelectItem>
                        <SelectItem value="telecash">TeleCash</SelectItem>
                        <SelectItem value="innbucks">InnBucks</SelectItem>
                        <SelectItem value="mpesa">M-Pesa</SelectItem>
                        <SelectItem value="mtn_money">MTN Money</SelectItem>
                        <SelectItem value="omari">O'mari</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="payout-mm-number">Mobile Money Number</Label>
                    <Input
                      id="payout-mm-number"
                      value={payoutDetails.mobile_money_number}
                      onChange={(e) => setPayoutDetails({ ...payoutDetails, mobile_money_number: e.target.value })}
                      placeholder="e.g., 0771234567"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Payouts are processed weekly. Ensure your banking details are correct to avoid delays.
                  A Bank Account Confirmation Letter may be required as part of your KYC verification.
                </p>
              </div>

              <Button onClick={handleSavePayoutDetails} disabled={savingPayout}>
                {savingPayout ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Payout Details
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
