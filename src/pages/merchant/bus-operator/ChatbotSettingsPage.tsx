import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, X, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";

interface FAQ {
  question: string;
  answer: string;
}

export default function ChatbotSettingsPage() {
  const { merchantProfile } = useMerchantAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    system_prompt: "You are a helpful customer service assistant for our bus company.",
    response_tone: "professional",
    auto_response_enabled: true,
    business_hours: {
      monday: "9:00-17:00",
      tuesday: "9:00-17:00",
      wednesday: "9:00-17:00",
      thursday: "9:00-17:00",
      friday: "9:00-17:00",
      saturday: "9:00-13:00",
      sunday: "Closed",
    },
  });
  const [faqs, setFaqs] = useState<FAQ[]>([
    { question: "", answer: "" }
  ]);

  useEffect(() => {
    fetchSettings();
  }, [merchantProfile]);

  const fetchSettings = async () => {
    if (!merchantProfile?.id) return;

    try {
      const { data, error } = await supabase
        .from("merchant_chatbot_settings")
        .select("*")
        .eq("merchant_profile_id", merchantProfile.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setSettings({
          system_prompt: data.system_prompt || settings.system_prompt,
          response_tone: data.response_tone || settings.response_tone,
          auto_response_enabled: data.auto_response_enabled ?? settings.auto_response_enabled,
          business_hours: (data.business_hours as any) || settings.business_hours,
        });
        const faqData = Array.isArray(data.faqs) ? (data.faqs as unknown as FAQ[]) : [];
        setFaqs(faqData.length > 0 ? faqData : faqs);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!merchantProfile?.id) return;
    setSaving(true);

    try {
      const validFaqs = faqs.filter(faq => faq.question && faq.answer);

      const { error } = await supabase
        .from("merchant_chatbot_settings")
        .upsert({
          merchant_profile_id: merchantProfile.id,
          system_prompt: settings.system_prompt,
          response_tone: settings.response_tone,
          auto_response_enabled: settings.auto_response_enabled,
          business_hours: settings.business_hours as any,
          faqs: validFaqs as any,
        }, {
          onConflict: 'merchant_profile_id'
        });

      if (error) throw error;
      toast.success("Chatbot settings saved successfully");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const addFAQ = () => {
    setFaqs([...faqs, { question: "", answer: "" }]);
  };

  const removeFAQ = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const updateFAQ = (index: number, field: keyof FAQ, value: string) => {
    const updated = [...faqs];
    updated[index] = { ...updated[index], [field]: value };
    setFaqs(updated);
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Chatbot Settings</h1>
          <p className="text-muted-foreground">Customize your AI assistant's behavior and responses</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Prompt</CardTitle>
          <CardDescription>Define how your chatbot should behave and respond</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={settings.system_prompt}
            onChange={(e) => setSettings({ ...settings, system_prompt: e.target.value })}
            rows={4}
            placeholder="You are a helpful assistant..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Response Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Response Tone</Label>
            <Select
              value={settings.response_tone}
              onValueChange={(value) => setSettings({ ...settings, response_tone: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-Response</Label>
              <p className="text-sm text-muted-foreground">
                Automatically respond to customer messages
              </p>
            </div>
            <Switch
              checked={settings.auto_response_enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, auto_response_enabled: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>FAQs</CardTitle>
              <CardDescription>Add common questions and answers</CardDescription>
            </div>
            <Button size="sm" onClick={addFAQ}>
              <Plus className="h-4 w-4 mr-1" />
              Add FAQ
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <Label>FAQ #{index + 1}</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFAQ(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Question"
                  value={faq.question}
                  onChange={(e) => updateFAQ(index, "question", e.target.value)}
                />
                <Textarea
                  placeholder="Answer"
                  value={faq.answer}
                  onChange={(e) => updateFAQ(index, "answer", e.target.value)}
                  rows={2}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}