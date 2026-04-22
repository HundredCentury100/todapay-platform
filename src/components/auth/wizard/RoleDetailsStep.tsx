import { ValidatedInput } from "@/components/ui/validated-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { WizardRole } from "./RoleSelectionStep";

export interface RoleDetailsData {
  // Driver
  vehicleType?: string;
  licensePlate?: string;
  vehicleMake?: string;
  // Merchant
  businessName?: string;
  merchantRole?: string;
  businessAddress?: string;
  // Agent
  agencyName?: string;
  agentType?: string;
  licenseNumber?: string;
}

interface RoleDetailsStepProps {
  role: WizardRole;
  data: RoleDetailsData;
  onChange: (data: RoleDetailsData) => void;
}

const merchantRoles = [
  { value: "bus_operator", label: "Bus Operator" },
  { value: "event_organizer", label: "Event Organizer" },
  { value: "property_owner", label: "Property / Stays" },
  { value: "car_rental_company", label: "Car Rental" },
  { value: "transfer_provider", label: "Transfer Provider" },
  { value: "workspace_provider", label: "Workspace Provider" },
  { value: "experience_host", label: "Experience Host" },
];

export const RoleDetailsStep = ({ role, data, onChange }: RoleDetailsStepProps) => {
  const update = (field: keyof RoleDetailsData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  if (role === "driver") {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Vehicle Details</h1>
          <p className="text-muted-foreground text-sm mt-1">Tell us about your vehicle</p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Vehicle Type</Label>
            <Select value={data.vehicleType || ""} onValueChange={(v) => update("vehicleType", v)}>
              <SelectTrigger className="h-14 rounded-2xl bg-card border-border">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sedan">Sedan</SelectItem>
                <SelectItem value="suv">SUV</SelectItem>
                <SelectItem value="hatchback">Hatchback</SelectItem>
                <SelectItem value="minivan">Minivan</SelectItem>
                <SelectItem value="pickup">Pickup Truck</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ValidatedInput
            id="vehicleMake" label="Vehicle Make & Model"
            value={data.vehicleMake || ""}
            onChange={(e) => update("vehicleMake", e.target.value)}
            placeholder="e.g. Toyota Corolla 2020"
            className="h-14 rounded-2xl bg-card border-border"
          />
          <ValidatedInput
            id="licensePlate" label="License Plate"
            value={data.licensePlate || ""}
            onChange={(e) => update("licensePlate", e.target.value)}
            placeholder="e.g. ABC 1234"
            className="h-14 rounded-2xl bg-card border-border"
          />
        </div>
      </div>
    );
  }

  if (role === "merchant") {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Business Details</h1>
          <p className="text-muted-foreground text-sm mt-1">Tell us about your business</p>
        </div>
        <div className="space-y-4">
          <ValidatedInput
            id="businessName" label="Business Name"
            value={data.businessName || ""}
            onChange={(e) => update("businessName", e.target.value)}
            placeholder="e.g. Zim Express Buses"
            className="h-14 rounded-2xl bg-card border-border"
          />
          <div className="space-y-2">
            <Label>Business Type</Label>
            <Select value={data.merchantRole || ""} onValueChange={(v) => update("merchantRole", v)}>
              <SelectTrigger className="h-14 rounded-2xl bg-card border-border">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {merchantRoles.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ValidatedInput
            id="businessAddress" label="Business Address"
            value={data.businessAddress || ""}
            onChange={(e) => update("businessAddress", e.target.value)}
            placeholder="e.g. 123 Samora Machel Ave, Harare"
            className="h-14 rounded-2xl bg-card border-border"
          />
        </div>
      </div>
    );
  }

  if (role === "agent") {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Agency Details</h1>
          <p className="text-muted-foreground text-sm mt-1">Tell us about your agency</p>
        </div>
        <div className="space-y-4">
          <ValidatedInput
            id="agencyName" label="Agency Name"
            value={data.agencyName || ""}
            onChange={(e) => update("agencyName", e.target.value)}
            placeholder="e.g. Safari Travel Agency"
            className="h-14 rounded-2xl bg-card border-border"
          />
          <div className="space-y-2">
            <Label>Agent Type</Label>
            <Select value={data.agentType || ""} onValueChange={(v) => update("agentType", v)}>
              <SelectTrigger className="h-14 rounded-2xl bg-card border-border">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="travel_agent">Travel Agent</SelectItem>
                <SelectItem value="booking_agent">Booking Agent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ValidatedInput
            id="licenseNumber" label="License Number (optional)"
            value={data.licenseNumber || ""}
            onChange={(e) => update("licenseNumber", e.target.value)}
            placeholder="e.g. ZTA-12345"
            className="h-14 rounded-2xl bg-card border-border"
          />
        </div>
      </div>
    );
  }

  return null;
};
