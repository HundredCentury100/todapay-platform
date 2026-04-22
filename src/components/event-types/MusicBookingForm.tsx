import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Music, Ticket, ShoppingBag, Sparkles, Users, Car } from "lucide-react";

interface MusicBookingFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

const MusicBookingForm = ({ formData, setFormData }: MusicBookingFormProps) => {
  const genreTypes = [
    { value: "afrobeats", label: "Afrobeats / Amapiano" },
    { value: "sungura", label: "Sungura" },
    { value: "chimurenga", label: "Chimurenga" },
    { value: "gospel", label: "Gospel" },
    { value: "jazz", label: "Jazz / Blues" },
    { value: "hip-hop", label: "Hip-Hop / Rap" },
    { value: "dancehall", label: "Dancehall / Reggae" },
    { value: "rock", label: "Rock / Alternative" },
    { value: "classical", label: "Classical / Orchestral" },
    { value: "mixed", label: "Mixed Genre" },
  ];

  const experienceTiers = [
    { value: "general", label: "General Admission", description: "Standing/open floor access", price: "Included" },
    { value: "earlybird", label: "Early Bird GA", description: "General admission at discounted rate", price: "-20%" },
    { value: "golden-circle", label: "Golden Circle", description: "Front-of-stage priority area", price: "+$40" },
    { value: "vip-lounge", label: "VIP Lounge", description: "Elevated area, private bar, cushioned seating", price: "+$80" },
    { value: "backstage", label: "Backstage Pass", description: "All-access + artist meet & greet", price: "+$150" },
  ];

  const merchBundles = [
    { value: "none", label: "No merchandise" },
    { value: "tee", label: "Concert T-Shirt", description: "Official tour tee", price: "$25" },
    { value: "bundle", label: "Merch Bundle", description: "T-shirt + poster + wristband", price: "$45" },
    { value: "premium", label: "Premium Bundle", description: "Signed poster + hoodie + lanyard", price: "$90" },
  ];

  const addOns = [
    { id: "meet-greet", label: "Artist Meet & Greet", description: "Photo + autograph session", price: "$50" },
    { id: "drinks-voucher", label: "Drinks Voucher (x3)", description: "3 drink tokens redeemable at bars", price: "$20" },
    { id: "photo-pack", label: "Pro Photo Package", description: "Professional event photos emailed next day", price: "$15" },
    { id: "cloakroom", label: "Cloakroom", description: "Secure bag/coat storage", price: "$5" },
    { id: "phone-charge", label: "Portable Charger Hire", description: "Power bank rental for the event", price: "$8" },
  ];

  return (
    <div className="space-y-6">
      {/* Genre */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Music className="h-4 w-4" />
            Music Genre
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.genre || ""}
            onValueChange={(value) => setFormData({ ...formData, genre: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select genre" />
            </SelectTrigger>
            <SelectContent>
              {genreTypes.map((g) => (
                <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Experience Tier */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Ticket className="h-4 w-4" />
            Experience Tier
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.experienceTier || "general"}
            onValueChange={(value) => setFormData({ ...formData, experienceTier: value })}
            className="space-y-3"
          >
            {experienceTiers.map((tier) => (
              <div key={tier.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:border-primary transition-colors">
                <RadioGroupItem value={tier.value} id={`tier-${tier.value}`} />
                <Label htmlFor={`tier-${tier.value}`} className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{tier.label}</p>
                      <p className="text-sm text-muted-foreground">{tier.description}</p>
                    </div>
                    <Badge variant="outline">{tier.price}</Badge>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Group */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Group Size
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.groupSize || "1"}
            onValueChange={(value) => setFormData({ ...formData, groupSize: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="How many attending?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Solo</SelectItem>
              <SelectItem value="2">Duo (2 people)</SelectItem>
              <SelectItem value="3-4">Small group (3-4)</SelectItem>
              <SelectItem value="5-8">Crew (5-8)</SelectItem>
              <SelectItem value="9+">Large group (9+ — discount applies)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Merch */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingBag className="h-4 w-4" />
            Merchandise Pre-Order
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.merchBundle || "none"}
            onValueChange={(value) => setFormData({ ...formData, merchBundle: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select merchandise" />
            </SelectTrigger>
            <SelectContent>
              {merchBundles.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  <div className="flex items-center gap-2">
                    <span>{m.label}</span>
                    {m.price && <span className="text-muted-foreground">- {m.price}</span>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formData.merchBundle && formData.merchBundle !== "none" && (
            <>
              <p className="text-sm text-muted-foreground mt-2">
                {merchBundles.find(m => m.value === formData.merchBundle)?.description}
              </p>
              {(formData.merchBundle === "tee" || formData.merchBundle === "bundle" || formData.merchBundle === "premium") && (
                <div className="mt-3">
                  <Label>T-Shirt Size</Label>
                  <Select
                    value={formData.tshirtSize || ""}
                    onValueChange={(value) => setFormData({ ...formData, tshirtSize: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {["XS", "S", "M", "L", "XL", "XXL"].map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add-ons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4" />
            Concert Add-ons
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {addOns.map((addon) => (
            <div key={addon.id} className="flex items-start space-x-3 p-3 border rounded-lg">
              <Checkbox
                id={`music-${addon.id}`}
                checked={formData.addOns?.includes(addon.id)}
                onCheckedChange={(checked) => {
                  const current = formData.addOns || [];
                  setFormData({
                    ...formData,
                    addOns: checked
                      ? [...current, addon.id]
                      : current.filter((id: string) => id !== addon.id),
                  });
                }}
              />
              <Label htmlFor={`music-${addon.id}`} className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{addon.label}</p>
                    <p className="text-sm text-muted-foreground">{addon.description}</p>
                  </div>
                  <Badge variant="secondary">{addon.price}</Badge>
                </div>
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Transport */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Car className="h-4 w-4" />
            Getting There
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.transport || "none"}
            onValueChange={(value) => setFormData({ ...formData, transport: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Need transport?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">I'll sort my own transport</SelectItem>
              <SelectItem value="shuttle">Event Shuttle from CBD ($10 return)</SelectItem>
              <SelectItem value="vip-transfer">VIP Transfer ($35 return)</SelectItem>
              <SelectItem value="parking">Self-drive + Parking ($8)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
};

export default MusicBookingForm;
