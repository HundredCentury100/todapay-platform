import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import ServiceImageUpload from "@/components/admin/ServiceImageUpload";

interface EventFormAdminProps {
  merchantId: string;
  onSuccess: () => void;
  onCancel: () => void;
  actorType?: "admin" | "agent";
}

const EVENT_CATEGORIES = [
  "music", "sports", "theater", "conference", "workshop", "festival", "party",
  "networking", "school", "marathon", "comedy", "virtual", "religious",
  "exhibition", "charity", "nightlife", "food_drink", "cultural", "other",
];

const CATEGORY_LABELS: Record<string, string> = {
  music: "Music", sports: "Sports", theater: "Theater", conference: "Conference",
  workshop: "Workshop / Masterclass", festival: "Festival", party: "Party",
  networking: "Networking", school: "School", marathon: "Marathon / Running",
  comedy: "Comedy", virtual: "Virtual Event", religious: "Religious / Church",
  exhibition: "Exhibition / Expo", charity: "Charity / Fundraiser",
  nightlife: "Nightlife / Club", food_drink: "Food & Drink", cultural: "Cultural", other: "Other",
};

const EventFormAdmin = ({ merchantId, onSuccess, onCancel, actorType = "admin" }: EventFormAdminProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "", description: "", category: "", event_date: "", event_time: "", end_time: "",
    venue: "", venue_address: "", city: "", base_price: "", total_capacity: "",
    is_featured: false, is_free: false, image_url: "", tags: "",
  });
  const [categoryData, setCategoryData] = useState<Record<string, any>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const eventData: any = {
        merchant_profile_id: merchantId, title: formData.title, description: formData.description || null,
        category: formData.category, event_date: formData.event_date, event_time: formData.event_time,
        end_time: formData.end_time || null, venue: formData.venue, venue_address: formData.venue_address || null,
        city: formData.city, base_price: formData.is_free ? 0 : parseFloat(formData.base_price),
        total_capacity: parseInt(formData.total_capacity) || null,
        available_tickets: parseInt(formData.total_capacity) || null,
        is_featured: formData.is_featured, is_free: formData.is_free,
        image_url: formData.image_url || null,
        tags: formData.tags ? formData.tags.split(",").map(t => t.trim()) : null,
        status: "active", created_by_admin_id: user?.id,
        category_specific_data: Object.keys(categoryData).length > 0 ? categoryData : null,
      };
      const { data: event, error } = await supabase.from("events").insert(eventData).select().single();
      if (error) throw error;
      await supabase.from("admin_service_actions").insert({
        admin_id: user?.id, merchant_profile_id: merchantId, service_type: "event",
        service_id: event.id, action_type: "create", action_reason: `Created via ${actorType} service management`, new_data: event,
      });
      onSuccess();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create event", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const update = (field: string, value: any) => setFormData(p => ({ ...p, [field]: value }));
  const updateCat = (field: string, value: any) => setCategoryData(p => ({ ...p, [field]: value }));

  const renderCategoryFields = () => {
    const cat = formData.category;
    if (!cat) return null;

    switch (cat) {
      case "marathon":
        return (
          <Card className="border-dashed">
            <CardHeader className="py-3 px-4"><CardTitle className="text-sm">🏃 Marathon / Running Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Race Categories</Label>
                  <Input placeholder="e.g., 5K, 10K, Half, Full" value={categoryData.raceCategories || ""} onChange={e => updateCat("raceCategories", e.target.value)} />
                </div>
                <div className="space-y-1"><Label className="text-xs">Bib Pickup Location</Label>
                  <Input placeholder="Pickup location" value={categoryData.bibPickupLocation || ""} onChange={e => updateCat("bibPickupLocation", e.target.value)} />
                </div>
                <div className="space-y-1"><Label className="text-xs">Bib Pickup Date</Label>
                  <Input type="date" value={categoryData.bibPickupDate || ""} onChange={e => updateCat("bibPickupDate", e.target.value)} />
                </div>
                <div className="space-y-1"><Label className="text-xs">Cutoff Time (hours)</Label>
                  <Input type="number" placeholder="e.g., 6" value={categoryData.cutoffTime || ""} onChange={e => updateCat("cutoffTime", e.target.value)} />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {[{ id: "medicalClearanceRequired", label: "Medical Clearance Required" },
                  { id: "paceGroupsAvailable", label: "Pace Groups Available" },
                  { id: "chipTimingIncluded", label: "Chip Timing Included" },
                  { id: "medalIncluded", label: "Finisher Medal Included" },
                ].map(opt => (
                  <div key={opt.id} className="flex items-center space-x-2">
                    <Checkbox id={`cat-${opt.id}`} checked={!!categoryData[opt.id]} onCheckedChange={v => updateCat(opt.id, !!v)} />
                    <label htmlFor={`cat-${opt.id}`} className="text-xs cursor-pointer">{opt.label}</label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case "school":
        return (
          <Card className="border-dashed">
            <CardHeader className="py-3 px-4"><CardTitle className="text-sm">🏫 School Event Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">School Name</Label>
                  <Input placeholder="School name" value={categoryData.schoolName || ""} onChange={e => updateCat("schoolName", e.target.value)} />
                </div>
                <div className="space-y-1"><Label className="text-xs">Grade Levels</Label>
                  <Input placeholder="e.g., Grade 1-7" value={categoryData.gradeLevels || ""} onChange={e => updateCat("gradeLevels", e.target.value)} />
                </div>
                <div className="space-y-1"><Label className="text-xs">Supervision Ratio</Label>
                  <Input placeholder="e.g., 1:10" value={categoryData.supervisionRatio || ""} onChange={e => updateCat("supervisionRatio", e.target.value)} />
                </div>
                <div className="space-y-1"><Label className="text-xs">Pickup Time</Label>
                  <Input type="time" value={categoryData.pickupTime || ""} onChange={e => updateCat("pickupTime", e.target.value)} />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {[{ id: "guardianConsentRequired", label: "Guardian Consent Required" },
                  { id: "uniformRequired", label: "Uniform Required" },
                  { id: "mealsProvided", label: "Meals Provided" },
                  { id: "pickupAuthRequired", label: "Pickup Authorization Required" },
                ].map(opt => (
                  <div key={opt.id} className="flex items-center space-x-2">
                    <Checkbox id={`cat-${opt.id}`} checked={!!categoryData[opt.id]} onCheckedChange={v => updateCat(opt.id, !!v)} />
                    <label htmlFor={`cat-${opt.id}`} className="text-xs cursor-pointer">{opt.label}</label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case "religious":
        return (
          <Card className="border-dashed">
            <CardHeader className="py-3 px-4"><CardTitle className="text-sm">⛪ Religious / Church Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Denomination</Label>
                  <Select value={categoryData.denomination || ""} onValueChange={v => updateCat("denomination", v)}>
                    <SelectTrigger className="text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["Catholic", "Protestant", "Pentecostal", "Apostolic", "SDA", "Methodist", "Anglican", "Non-denominational", "Muslim", "Other"].map(d => (
                        <SelectItem key={d} value={d.toLowerCase()}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label className="text-xs">Event Type</Label>
                  <Select value={categoryData.religiousEventType || ""} onValueChange={v => updateCat("religiousEventType", v)}>
                    <SelectTrigger className="text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["Service", "Revival", "Crusade", "Youth Camp", "Conference", "Wedding", "Funeral", "Other"].map(t => (
                        <SelectItem key={t} value={t.toLowerCase()}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {[{ id: "prayerRequestsEnabled", label: "Prayer Requests Enabled" },
                  { id: "ministrySignUp", label: "Ministry Sign-up" },
                  { id: "childrenMinistry", label: "Children's Ministry Available" },
                  { id: "transportProvided", label: "Transport Provided" },
                ].map(opt => (
                  <div key={opt.id} className="flex items-center space-x-2">
                    <Checkbox id={`cat-${opt.id}`} checked={!!categoryData[opt.id]} onCheckedChange={v => updateCat(opt.id, !!v)} />
                    <label htmlFor={`cat-${opt.id}`} className="text-xs cursor-pointer">{opt.label}</label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case "exhibition":
        return (
          <Card className="border-dashed">
            <CardHeader className="py-3 px-4"><CardTitle className="text-sm">🎪 Exhibition / Expo Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Attendee Types</Label>
                  <Input placeholder="e.g., Visitor, Exhibitor, VIP" value={categoryData.attendeeTypes || ""} onChange={e => updateCat("attendeeTypes", e.target.value)} />
                </div>
                <div className="space-y-1"><Label className="text-xs">Number of Booths</Label>
                  <Input type="number" placeholder="e.g., 50" value={categoryData.totalBooths || ""} onChange={e => updateCat("totalBooths", e.target.value)} />
                </div>
                <div className="space-y-1"><Label className="text-xs">Exhibitor Fee (USD)</Label>
                  <Input type="number" step="0.01" placeholder="e.g., 200" value={categoryData.exhibitorFee || ""} onChange={e => updateCat("exhibitorFee", e.target.value)} />
                </div>
                <div className="space-y-1"><Label className="text-xs">Exhibition Theme</Label>
                  <Input placeholder="e.g., Tech, Agriculture" value={categoryData.theme || ""} onChange={e => updateCat("theme", e.target.value)} />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {[{ id: "b2bScheduling", label: "B2B Meeting Scheduling" },
                  { id: "boothSelectionEnabled", label: "Booth Selection Enabled" },
                  { id: "seminarIncluded", label: "Seminars Included" },
                ].map(opt => (
                  <div key={opt.id} className="flex items-center space-x-2">
                    <Checkbox id={`cat-${opt.id}`} checked={!!categoryData[opt.id]} onCheckedChange={v => updateCat(opt.id, !!v)} />
                    <label htmlFor={`cat-${opt.id}`} className="text-xs cursor-pointer">{opt.label}</label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case "charity":
        return (
          <Card className="border-dashed">
            <CardHeader className="py-3 px-4"><CardTitle className="text-sm">💝 Charity / Fundraiser Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Cause / Beneficiary</Label>
                  <Input placeholder="e.g., Children's Hospital" value={categoryData.cause || ""} onChange={e => updateCat("cause", e.target.value)} />
                </div>
                <div className="space-y-1"><Label className="text-xs">Fundraising Goal (USD)</Label>
                  <Input type="number" step="0.01" placeholder="e.g., 10000" value={categoryData.fundraisingGoal || ""} onChange={e => updateCat("fundraisingGoal", e.target.value)} />
                </div>
                <div className="space-y-1"><Label className="text-xs">Donation Tiers</Label>
                  <Input placeholder="e.g., $10, $25, $50, $100" value={categoryData.donationTiers || ""} onChange={e => updateCat("donationTiers", e.target.value)} />
                </div>
                <div className="space-y-1"><Label className="text-xs">Organization Name</Label>
                  <Input placeholder="Registered charity name" value={categoryData.organizationName || ""} onChange={e => updateCat("organizationName", e.target.value)} />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {[{ id: "taxReceiptsAvailable", label: "Tax Receipts Available" },
                  { id: "pledgesAccepted", label: "Pledges Accepted" },
                  { id: "matchingDonations", label: "Matching Donations" },
                ].map(opt => (
                  <div key={opt.id} className="flex items-center space-x-2">
                    <Checkbox id={`cat-${opt.id}`} checked={!!categoryData[opt.id]} onCheckedChange={v => updateCat(opt.id, !!v)} />
                    <label htmlFor={`cat-${opt.id}`} className="text-xs cursor-pointer">{opt.label}</label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case "nightlife":
        return (
          <Card className="border-dashed">
            <CardHeader className="py-3 px-4"><CardTitle className="text-sm">🎶 Nightlife / Club Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Minimum Age</Label>
                  <Input type="number" placeholder="e.g., 18" value={categoryData.minimumAge || ""} onChange={e => updateCat("minimumAge", e.target.value)} />
                </div>
                <div className="space-y-1"><Label className="text-xs">Dress Code</Label>
                  <Select value={categoryData.dressCode || ""} onValueChange={v => updateCat("dressCode", v)}>
                    <SelectTrigger className="text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["Casual", "Smart Casual", "Formal", "Themed", "No Restriction"].map(d => (
                        <SelectItem key={d} value={d.toLowerCase()}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label className="text-xs">Table Reservation Fee (USD)</Label>
                  <Input type="number" step="0.01" placeholder="e.g., 50" value={categoryData.tableReservationFee || ""} onChange={e => updateCat("tableReservationFee", e.target.value)} />
                </div>
                <div className="space-y-1"><Label className="text-xs">Bottle Service Min (USD)</Label>
                  <Input type="number" step="0.01" placeholder="e.g., 100" value={categoryData.bottleServiceMin || ""} onChange={e => updateCat("bottleServiceMin", e.target.value)} />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {[{ id: "tableReservationEnabled", label: "Table Reservations" },
                  { id: "bottleServiceAvailable", label: "Bottle Service" },
                  { id: "vipSectionAvailable", label: "VIP Section" },
                  { id: "ageVerificationRequired", label: "ID Verification Required" },
                ].map(opt => (
                  <div key={opt.id} className="flex items-center space-x-2">
                    <Checkbox id={`cat-${opt.id}`} checked={!!categoryData[opt.id]} onCheckedChange={v => updateCat(opt.id, !!v)} />
                    <label htmlFor={`cat-${opt.id}`} className="text-xs cursor-pointer">{opt.label}</label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case "workshop":
        return (
          <Card className="border-dashed">
            <CardHeader className="py-3 px-4"><CardTitle className="text-sm">🎓 Workshop / Masterclass Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Skill Level</Label>
                  <Select value={categoryData.skillLevel || ""} onValueChange={v => updateCat("skillLevel", v)}>
                    <SelectTrigger className="text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["Beginner", "Intermediate", "Advanced", "All Levels"].map(s => (
                        <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label className="text-xs">Instructor Name</Label>
                  <Input placeholder="Lead instructor" value={categoryData.instructorName || ""} onChange={e => updateCat("instructorName", e.target.value)} />
                </div>
                <div className="space-y-1"><Label className="text-xs">Materials Fee (USD)</Label>
                  <Input type="number" step="0.01" placeholder="e.g., 15" value={categoryData.materialsFee || ""} onChange={e => updateCat("materialsFee", e.target.value)} />
                </div>
                <div className="space-y-1"><Label className="text-xs">Prerequisites</Label>
                  <Input placeholder="Any prerequisites" value={categoryData.prerequisites || ""} onChange={e => updateCat("prerequisites", e.target.value)} />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {[{ id: "materialsIncluded", label: "Materials Included" },
                  { id: "certificateProvided", label: "Certificate Provided" },
                  { id: "recordingProvided", label: "Recording Provided" },
                  { id: "equipmentProvided", label: "Equipment Provided" },
                ].map(opt => (
                  <div key={opt.id} className="flex items-center space-x-2">
                    <Checkbox id={`cat-${opt.id}`} checked={!!categoryData[opt.id]} onCheckedChange={v => updateCat(opt.id, !!v)} />
                    <label htmlFor={`cat-${opt.id}`} className="text-xs cursor-pointer">{opt.label}</label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case "food_drink":
        return (
          <Card className="border-dashed">
            <CardHeader className="py-3 px-4"><CardTitle className="text-sm">🍷 Food & Drink Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Cuisine Type</Label>
                  <Input placeholder="e.g., Wine Tasting, BBQ, Fine Dining" value={categoryData.cuisineType || ""} onChange={e => updateCat("cuisineType", e.target.value)} />
                </div>
                <div className="space-y-1"><Label className="text-xs">Tasting Tiers</Label>
                  <Input placeholder="e.g., Basic, Premium, Grand" value={categoryData.tastingTiers || ""} onChange={e => updateCat("tastingTiers", e.target.value)} />
                </div>
                <div className="space-y-1"><Label className="text-xs">Courses / Tastings</Label>
                  <Input type="number" placeholder="e.g., 5" value={categoryData.numberOfCourses || ""} onChange={e => updateCat("numberOfCourses", e.target.value)} />
                </div>
                <div className="space-y-1"><Label className="text-xs">Chef / Sommelier</Label>
                  <Input placeholder="Featured professional" value={categoryData.featuredProfessional || ""} onChange={e => updateCat("featuredProfessional", e.target.value)} />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {[{ id: "alcoholServed", label: "Alcohol Served (18+)" },
                  { id: "vegetarianOptions", label: "Vegetarian Options" },
                  { id: "halalOptions", label: "Halal Options" },
                  { id: "designatedDriverInfo", label: "Designated Driver Info" },
                ].map(opt => (
                  <div key={opt.id} className="flex items-center space-x-2">
                    <Checkbox id={`cat-${opt.id}`} checked={!!categoryData[opt.id]} onCheckedChange={v => updateCat(opt.id, !!v)} />
                    <label htmlFor={`cat-${opt.id}`} className="text-xs cursor-pointer">{opt.label}</label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case "comedy":
        return (
          <Card className="border-dashed">
            <CardHeader className="py-3 px-4"><CardTitle className="text-sm">😂 Comedy Show Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Headliner</Label>
                  <Input placeholder="Main comedian" value={categoryData.headliner || ""} onChange={e => updateCat("headliner", e.target.value)} />
                </div>
                <div className="space-y-1"><Label className="text-xs">Show Type</Label>
                  <Select value={categoryData.showType || ""} onValueChange={v => updateCat("showType", v)}>
                    <SelectTrigger className="text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["Stand-up", "Improv", "Sketch", "Open Mic", "Roast", "Special"].map(s => (
                        <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label className="text-xs">Age Rating</Label>
                  <Select value={categoryData.ageRating || ""} onValueChange={v => updateCat("ageRating", v)}>
                    <SelectTrigger className="text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["All Ages", "PG-13", "16+", "18+"].map(r => (
                        <SelectItem key={r} value={r.toLowerCase()}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label className="text-xs">Supporting Acts</Label>
                  <Input placeholder="Other performers" value={categoryData.supportingActs || ""} onChange={e => updateCat("supportingActs", e.target.value)} />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {[{ id: "dinnerComboAvailable", label: "Dinner + Show Combo" },
                  { id: "meetAndGreet", label: "Meet & Greet Available" },
                  { id: "twoItemMinimum", label: "2-Drink Minimum" },
                ].map(opt => (
                  <div key={opt.id} className="flex items-center space-x-2">
                    <Checkbox id={`cat-${opt.id}`} checked={!!categoryData[opt.id]} onCheckedChange={v => updateCat(opt.id, !!v)} />
                    <label htmlFor={`cat-${opt.id}`} className="text-xs cursor-pointer">{opt.label}</label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case "virtual":
        return (
          <Card className="border-dashed">
            <CardHeader className="py-3 px-4"><CardTitle className="text-sm">💻 Virtual Event Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Platform</Label>
                  <Select value={categoryData.platform || ""} onValueChange={v => updateCat("platform", v)}>
                    <SelectTrigger className="text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["Zoom", "Google Meet", "Microsoft Teams", "YouTube Live", "Custom Platform", "Other"].map(p => (
                        <SelectItem key={p} value={p.toLowerCase()}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label className="text-xs">Stream URL</Label>
                  <Input placeholder="https://..." value={categoryData.streamUrl || ""} onChange={e => updateCat("streamUrl", e.target.value)} />
                </div>
                <div className="space-y-1"><Label className="text-xs">Timezone</Label>
                  <Input placeholder="e.g., CAT (UTC+2)" value={categoryData.timezone || ""} onChange={e => updateCat("timezone", e.target.value)} />
                </div>
                <div className="space-y-1"><Label className="text-xs">Access Password</Label>
                  <Input placeholder="Optional access code" value={categoryData.accessPassword || ""} onChange={e => updateCat("accessPassword", e.target.value)} />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {[{ id: "recordingAvailable", label: "Recording Available After" },
                  { id: "liveChatEnabled", label: "Live Chat Enabled" },
                  { id: "qaSessionIncluded", label: "Q&A Session Included" },
                  { id: "captionsProvided", label: "Captions Provided" },
                ].map(opt => (
                  <div key={opt.id} className="flex items-center space-x-2">
                    <Checkbox id={`cat-${opt.id}`} checked={!!categoryData[opt.id]} onCheckedChange={v => updateCat(opt.id, !!v)} />
                    <label htmlFor={`cat-${opt.id}`} className="text-xs cursor-pointer">{opt.label}</label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case "cultural":
        return (
          <Card className="border-dashed">
            <CardHeader className="py-3 px-4"><CardTitle className="text-sm">🎭 Cultural Event Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Cultural Theme</Label>
                  <Input placeholder="e.g., Shona Heritage, Pan-African" value={categoryData.culturalTheme || ""} onChange={e => updateCat("culturalTheme", e.target.value)} />
                </div>
                <div className="space-y-1"><Label className="text-xs">Art Forms</Label>
                  <Input placeholder="e.g., Dance, Music, Poetry" value={categoryData.artForms || ""} onChange={e => updateCat("artForms", e.target.value)} />
                </div>
                <div className="space-y-1"><Label className="text-xs">Featured Artists</Label>
                  <Input placeholder="Performing artists" value={categoryData.featuredArtists || ""} onChange={e => updateCat("featuredArtists", e.target.value)} />
                </div>
                <div className="space-y-1"><Label className="text-xs">Language</Label>
                  <Input placeholder="e.g., Shona, Ndebele, English" value={categoryData.language || ""} onChange={e => updateCat("language", e.target.value)} />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {[{ id: "traditionalFoodAvailable", label: "Traditional Food Available" },
                  { id: "artisanMarket", label: "Artisan Market" },
                  { id: "interactiveWorkshops", label: "Interactive Workshops" },
                  { id: "familyFriendly", label: "Family Friendly" },
                ].map(opt => (
                  <div key={opt.id} className="flex items-center space-x-2">
                    <Checkbox id={`cat-${opt.id}`} checked={!!categoryData[opt.id]} onCheckedChange={v => updateCat(opt.id, !!v)} />
                    <label htmlFor={`cat-${opt.id}`} className="text-xs cursor-pointer">{opt.label}</label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case "sports":
        return (
          <Card className="border-dashed">
            <CardHeader className="py-3 px-4"><CardTitle className="text-sm">⚽ Sports Event Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Sport</Label>
                  <Input placeholder="e.g., Football, Cricket, Rugby" value={categoryData.sportType || ""} onChange={e => updateCat("sportType", e.target.value)} />
                </div>
                <div className="space-y-1"><Label className="text-xs">Teams / Competitors</Label>
                  <Input placeholder="e.g., Dynamos vs Caps United" value={categoryData.teams || ""} onChange={e => updateCat("teams", e.target.value)} />
                </div>
                <div className="space-y-1"><Label className="text-xs">League / Tournament</Label>
                  <Input placeholder="e.g., PSL, Castle Lager Cup" value={categoryData.league || ""} onChange={e => updateCat("league", e.target.value)} />
                </div>
                <div className="space-y-1"><Label className="text-xs">Ticket Zones</Label>
                  <Input placeholder="e.g., VIP, Grandstand, General" value={categoryData.ticketZones || ""} onChange={e => updateCat("ticketZones", e.target.value)} />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {[{ id: "seasonTicketsAvailable", label: "Season Tickets Available" },
                  { id: "parkingIncluded", label: "Parking Included" },
                  { id: "fanzoneAvailable", label: "Fan Zone Available" },
                ].map(opt => (
                  <div key={opt.id} className="flex items-center space-x-2">
                    <Checkbox id={`cat-${opt.id}`} checked={!!categoryData[opt.id]} onCheckedChange={v => updateCat(opt.id, !!v)} />
                    <label htmlFor={`cat-${opt.id}`} className="text-xs cursor-pointer">{opt.label}</label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onCancel}><ArrowLeft className="h-4 w-4" /></Button>
          <CardTitle className="text-base">Create Event</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2"><Label>Event Title *</Label><Input placeholder="e.g., Summer Music Festival 2026" value={formData.title} onChange={e => update("title", e.target.value)} required /></div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={formData.category} onValueChange={v => { update("category", v); setCategoryData({}); }}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {EVENT_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>City *</Label><Input placeholder="e.g., Harare" value={formData.city} onChange={e => update("city", e.target.value)} required /></div>
            <div className="space-y-2"><Label>Event Date *</Label><Input type="date" value={formData.event_date} onChange={e => update("event_date", e.target.value)} required /></div>
            <div className="space-y-2"><Label>Start Time *</Label><Input type="time" value={formData.event_time} onChange={e => update("event_time", e.target.value)} required /></div>
            <div className="space-y-2"><Label>End Time</Label><Input type="time" value={formData.end_time} onChange={e => update("end_time", e.target.value)} /></div>
            <div className="space-y-2"><Label>Venue Name *</Label><Input placeholder="e.g., National Sports Stadium" value={formData.venue} onChange={e => update("venue", e.target.value)} required /></div>
            <div className="space-y-2 md:col-span-2"><Label>Venue Address</Label><Input placeholder="Full venue address" value={formData.venue_address} onChange={e => update("venue_address", e.target.value)} /></div>
            <div className="space-y-2"><Label>Total Capacity</Label><Input type="number" placeholder="e.g., 5000" value={formData.total_capacity} onChange={e => update("total_capacity", e.target.value)} /></div>
            <div className="space-y-2"><Label>Base Price (USD)</Label><Input type="number" step="0.01" placeholder={formData.is_free ? "Free event" : "e.g., 15.00"} value={formData.base_price} onChange={e => update("base_price", e.target.value)} disabled={formData.is_free} /></div>
            <div className="space-y-2 md:col-span-2">
              <ServiceImageUpload label="Event Image" value={formData.image_url} onChange={url => update("image_url", url)} folder="events" />
            </div>
            <div className="space-y-2"><Label>Tags (comma-separated)</Label><Input placeholder="e.g., live music, outdoor, family" value={formData.tags} onChange={e => update("tags", e.target.value)} /></div>
            <div className="flex items-center gap-6 md:col-span-2 pt-2">
              <div className="flex items-center gap-2">
                <Switch id="is_free" checked={formData.is_free} onCheckedChange={c => update("is_free", c)} />
                <Label htmlFor="is_free">Free Event</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="is_featured" checked={formData.is_featured} onCheckedChange={c => update("is_featured", c)} />
                <Label htmlFor="is_featured">Featured Event</Label>
              </div>
            </div>
          </div>

          {/* Category-specific fields */}
          {renderCategoryFields()}

          <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Describe the event..." value={formData.description} onChange={e => update("description", e.target.value)} rows={4} /></div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={loading || !formData.category}>{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create Event</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EventFormAdmin;
