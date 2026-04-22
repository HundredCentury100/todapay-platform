import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  User, 
  Car, 
  FileText, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight,
  Upload,
  Loader2,
  Shield,
  DollarSign,
  Banknote,
  Plus,
  X,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { VEHICLE_TYPES } from "@/types/ride";
import { SERVICE_TYPES } from "@/types/transfer";
import { Checkbox } from "@/components/ui/checkbox";

const STEPS = [
  { id: 'personal', title: 'Personal Info', icon: User },
  { id: 'vehicle', title: 'Vehicle Info', icon: Car },
  { id: 'pricing', title: 'Pricing & Services', icon: DollarSign },
  { id: 'documents', title: 'Documents', icon: FileText },
  { id: 'review', title: 'Review', icon: CheckCircle },
];

const REQUIRED_DOCUMENTS = [
  { key: 'drivers_license', label: "Driver's License", description: 'Valid driver\'s license' },
  { key: 'vehicle_registration', label: 'Vehicle Registration', description: 'Vehicle registration certificate' },
  { key: 'insurance', label: 'Insurance Certificate', description: 'Comprehensive vehicle insurance' },
  { key: 'id_document', label: 'ID Document', description: 'National ID or passport' },
];

interface FixedRoute {
  name: string;
  from: string;
  to: string;
  price: string;
}

export default function DriverRegister() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    vehicle_type: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_year: '',
    vehicle_color: '',
    license_plate: '',
  });

  const [pricingData, setPricingData] = useState({
    base_fare: '',
    price_per_km: '',
    minimum_fare: '',
    service_types: ['point_to_point', 'on_demand_taxi'] as string[],
  });

  const [fixedRoutes, setFixedRoutes] = useState<FixedRoute[]>([]);
  const [newRoute, setNewRoute] = useState<FixedRoute>({ name: '', from: '', to: '', price: '' });

  const [payoutDetails, setPayoutDetails] = useState({
    bank_name: '',
    account_name: '',
    account_number: '',
    mobile_money_provider: '',
    mobile_money_number: '',
    preferred_method: 'bank_transfer',
  });

  const [documents, setDocuments] = useState<Record<string, { file: File; url?: string; name: string }>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDocumentUpload = async (docType: string, file: File) => {
    setUploadingDoc(docType);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('driver-documents')
        .upload(`pending/${fileName}`, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('driver-documents')
        .getPublicUrl(`pending/${fileName}`);

      setDocuments(prev => ({
        ...prev,
        [docType]: { file, url: publicUrl, name: file.name }
      }));
      
      toast.success(`${REQUIRED_DOCUMENTS.find(d => d.key === docType)?.label} uploaded`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploadingDoc(null);
    }
  };

  const toggleServiceType = (serviceId: string) => {
    setPricingData(prev => ({
      ...prev,
      service_types: prev.service_types.includes(serviceId)
        ? prev.service_types.filter(s => s !== serviceId)
        : [...prev.service_types, serviceId],
    }));
  };

  const addFixedRoute = () => {
    if (newRoute.name && newRoute.from && newRoute.to && newRoute.price) {
      setFixedRoutes(prev => [...prev, newRoute]);
      setNewRoute({ name: '', from: '', to: '', price: '' });
    }
  };

  const removeFixedRoute = (index: number) => {
    setFixedRoutes(prev => prev.filter((_, i) => i !== index));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!(formData.full_name && formData.email && formData.phone);
      case 1:
        return !!(formData.vehicle_type && formData.license_plate);
      case 2:
        return !!(pricingData.base_fare && pricingData.price_per_km);
      case 3:
        return Object.keys(documents).length >= 3;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      toast.error('Please fill in all required fields');
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to register as a driver');
        navigate('/auth');
        return;
      }

      const { data: driver, error: driverError } = await supabase
        .from('drivers')
        .insert({
          user_id: user.id,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          vehicle_type: formData.vehicle_type,
          vehicle_make: formData.vehicle_make || null,
          vehicle_model: formData.vehicle_model || null,
          vehicle_year: formData.vehicle_year ? parseInt(formData.vehicle_year) : null,
          vehicle_color: formData.vehicle_color || null,
          license_plate: formData.license_plate,
          base_fare: parseFloat(pricingData.base_fare) || 0,
          price_per_km: parseFloat(pricingData.price_per_km) || 0,
          minimum_fare: parseFloat(pricingData.minimum_fare) || 0,
          service_types: pricingData.service_types,
          fixed_routes: fixedRoutes.map(r => ({ ...r, price: parseFloat(r.price) })),
          payout_details: payoutDetails,
          status: 'pending',
        } as any)
        .select()
        .single();

      if (driverError) throw driverError;

      const documentRecords = Object.entries(documents).map(([docType, doc]) => ({
        driver_id: driver.id,
        document_type: docType,
        file_url: doc.url || '',
        file_name: doc.name,
        status: 'pending',
      }));

      if (documentRecords.length > 0) {
        const { error: docsError } = await supabase
          .from('driver_documents')
          .insert(documentRecords);
        if (docsError) throw docsError;
      }

      toast.success('Application submitted! We\'ll review your documents and get back to you soon.');
      navigate('/driver/profile');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container-wide section-padding pt-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Become a Driver</h1>
            <p className="text-muted-foreground">Join our driver network and start earning</p>
          </div>

          <div className="mb-8">
            <Progress value={progress} className="h-2 mb-4" />
            <div className="flex justify-between">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isComplete = index < currentStep;
                return (
                  <div
                    key={step.id}
                    className={`flex flex-col items-center gap-1 ${
                      isActive ? 'text-primary' : isComplete ? 'text-green-600' : 'text-muted-foreground'
                    }`}
                  >
                    <div className={`p-2 rounded-full ${
                      isActive ? 'bg-primary/10' : isComplete ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'
                    }`}>
                      {isComplete ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <span className="text-xs font-medium hidden sm:block">{step.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{STEPS[currentStep].title}</CardTitle>
              <CardDescription>
                {currentStep === 0 && 'Tell us about yourself'}
                {currentStep === 1 && 'Enter your vehicle details'}
                {currentStep === 2 && 'Set your pricing and services'}
                {currentStep === 3 && 'Upload required documents'}
                {currentStep === 4 && 'Review your application'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Personal Info */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input id="full_name" placeholder="John Doe" value={formData.full_name} onChange={(e) => handleInputChange('full_name', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input id="email" type="email" placeholder="john@example.com" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input id="phone" placeholder="+263 77 123 4567" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} />
                  </div>
                </div>
              )}

              {/* Step 2: Vehicle Info */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_type">Vehicle Type *</Label>
                    <Select value={formData.vehicle_type} onValueChange={(value) => handleInputChange('vehicle_type', value)}>
                      <SelectTrigger><SelectValue placeholder="Select vehicle type" /></SelectTrigger>
                      <SelectContent>
                        {VEHICLE_TYPES.map(type => (
                          <SelectItem key={type.id} value={type.id}>{type.name} (Up to {type.capacity} passengers)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Make</Label>
                      <Input placeholder="Toyota" value={formData.vehicle_make} onChange={(e) => handleInputChange('vehicle_make', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Model</Label>
                      <Input placeholder="Corolla" value={formData.vehicle_model} onChange={(e) => handleInputChange('vehicle_model', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <Input type="number" placeholder="2022" value={formData.vehicle_year} onChange={(e) => handleInputChange('vehicle_year', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <Input placeholder="White" value={formData.vehicle_color} onChange={(e) => handleInputChange('vehicle_color', e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="license_plate">License Plate *</Label>
                    <Input id="license_plate" placeholder="AAA 1234" value={formData.license_plate} onChange={(e) => handleInputChange('license_plate', e.target.value.toUpperCase())} className="uppercase" />
                  </div>
                </div>
              )}

              {/* Step 3: Pricing & Services */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  {/* Per-km Pricing */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Per-Kilometer Pricing
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Base Fare ($) *</Label>
                        <Input type="number" step="0.50" placeholder="3.00" value={pricingData.base_fare} onChange={(e) => setPricingData(p => ({ ...p, base_fare: e.target.value }))} />
                        <p className="text-xs text-muted-foreground">Starting price</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Per KM ($) *</Label>
                        <Input type="number" step="0.10" placeholder="1.00" value={pricingData.price_per_km} onChange={(e) => setPricingData(p => ({ ...p, price_per_km: e.target.value }))} />
                        <p className="text-xs text-muted-foreground">Rate per kilometer</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Minimum Fare ($)</Label>
                        <Input type="number" step="0.50" placeholder="5.00" value={pricingData.minimum_fare} onChange={(e) => setPricingData(p => ({ ...p, minimum_fare: e.target.value }))} />
                        <p className="text-xs text-muted-foreground">Min charge</p>
                      </div>
                    </div>
                  </div>

                  {/* Service Types */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Services Offered</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {SERVICE_TYPES.map(svc => (
                        <label
                          key={svc.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            pricingData.service_types.includes(svc.id) ? 'border-primary bg-primary/5' : 'border-border'
                          }`}
                        >
                          <Checkbox
                            checked={pricingData.service_types.includes(svc.id)}
                            onCheckedChange={() => toggleServiceType(svc.id)}
                          />
                          <div>
                            <p className="text-sm font-medium">{svc.icon} {svc.name}</p>
                            <p className="text-xs text-muted-foreground">{svc.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Fixed Routes */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Fixed Route Pricing (Optional)</h4>
                    <p className="text-sm text-muted-foreground">Set fixed prices for popular routes like Airport → CBD</p>
                    
                    {fixedRoutes.map((route, i) => (
                      <div key={i} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{route.name}</p>
                          <p className="text-xs text-muted-foreground">{route.from} → {route.to}</p>
                        </div>
                        <span className="font-semibold text-sm">${route.price}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeFixedRoute(i)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Route name" value={newRoute.name} onChange={(e) => setNewRoute(r => ({ ...r, name: e.target.value }))} />
                      <Input placeholder="Price ($)" type="number" value={newRoute.price} onChange={(e) => setNewRoute(r => ({ ...r, price: e.target.value }))} />
                      <Input placeholder="From location" value={newRoute.from} onChange={(e) => setNewRoute(r => ({ ...r, from: e.target.value }))} />
                      <Input placeholder="To location" value={newRoute.to} onChange={(e) => setNewRoute(r => ({ ...r, to: e.target.value }))} />
                    </div>
                    <Button variant="outline" size="sm" onClick={addFixedRoute} disabled={!newRoute.name || !newRoute.price}>
                      <Plus className="h-4 w-4 mr-1" /> Add Route
                    </Button>
                  </div>

                  {/* Payout Details */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      Payout Banking Details
                    </h4>
                    <div className="space-y-2">
                      <Label>Preferred Payout Method</Label>
                      <Select value={payoutDetails.preferred_method} onValueChange={(v) => setPayoutDetails(p => ({ ...p, preferred_method: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="mobile_money">Mobile Money</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Bank Name</Label>
                        <Input placeholder="CBZ Bank" value={payoutDetails.bank_name} onChange={(e) => setPayoutDetails(p => ({ ...p, bank_name: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Account Name</Label>
                        <Input placeholder="Account holder" value={payoutDetails.account_name} onChange={(e) => setPayoutDetails(p => ({ ...p, account_name: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Account Number</Label>
                        <Input placeholder="1234567890" value={payoutDetails.account_number} onChange={(e) => setPayoutDetails(p => ({ ...p, account_number: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Mobile Money Number</Label>
                        <Input placeholder="0771234567" value={payoutDetails.mobile_money_number} onChange={(e) => setPayoutDetails(p => ({ ...p, mobile_money_number: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Documents */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  {REQUIRED_DOCUMENTS.map((doc) => (
                    <Card key={doc.key} className={documents[doc.key] ? 'border-green-200 dark:border-green-800' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{doc.label}</p>
                            <p className="text-sm text-muted-foreground">{doc.description}</p>
                            {documents[doc.key] && (
                              <p className="text-sm text-green-600 mt-1">✓ {documents[doc.key].name}</p>
                            )}
                          </div>
                          <div>
                            <input type="file" id={doc.key} className="hidden" accept="image/*,.pdf" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleDocumentUpload(doc.key, file); }} />
                            <Button variant={documents[doc.key] ? 'secondary' : 'outline'} size="sm" disabled={uploadingDoc === doc.key} onClick={() => document.getElementById(doc.key)?.click()}>
                              {uploadingDoc === doc.key ? <Loader2 className="h-4 w-4 animate-spin" /> : documents[doc.key] ? <><CheckCircle className="h-4 w-4 mr-1" />Replace</> : <><Upload className="h-4 w-4 mr-1" />Upload</>}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Your documents are securely stored and only used for verification purposes.</p>
                  </div>
                </div>
              )}

              {/* Step 5: Review */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-2">Personal Information</h4>
                    <Card>
                      <CardContent className="p-4 space-y-2">
                        <p><span className="text-muted-foreground">Name:</span> {formData.full_name}</p>
                        <p><span className="text-muted-foreground">Email:</span> {formData.email}</p>
                        <p><span className="text-muted-foreground">Phone:</span> {formData.phone}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Vehicle Information</h4>
                    <Card>
                      <CardContent className="p-4 space-y-2">
                        <p><span className="text-muted-foreground">Type:</span> {formData.vehicle_type}</p>
                        <p><span className="text-muted-foreground">Vehicle:</span> {formData.vehicle_color} {formData.vehicle_make} {formData.vehicle_model} {formData.vehicle_year}</p>
                        <p><span className="text-muted-foreground">License Plate:</span> {formData.license_plate}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Pricing</h4>
                    <Card>
                      <CardContent className="p-4 space-y-2">
                        <p><span className="text-muted-foreground">Base Fare:</span> ${pricingData.base_fare}</p>
                        <p><span className="text-muted-foreground">Per KM:</span> ${pricingData.price_per_km}</p>
                        {pricingData.minimum_fare && <p><span className="text-muted-foreground">Minimum Fare:</span> ${pricingData.minimum_fare}</p>}
                        <p><span className="text-muted-foreground">Services:</span> {pricingData.service_types.length} selected</p>
                        {fixedRoutes.length > 0 && <p><span className="text-muted-foreground">Fixed Routes:</span> {fixedRoutes.length} routes</p>}
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Documents ({Object.keys(documents).length}/4)</h4>
                    <Card>
                      <CardContent className="p-4 space-y-2">
                        {REQUIRED_DOCUMENTS.map(doc => (
                          <div key={doc.key} className="flex items-center gap-2">
                            {documents[doc.key] ? <CheckCircle className="h-4 w-4 text-green-600" /> : <div className="h-4 w-4 rounded-full border-2 border-muted" />}
                            <span className={documents[doc.key] ? '' : 'text-muted-foreground'}>{doc.label}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="p-4 bg-primary/5 rounded-lg">
                    <p className="text-sm">
                      By submitting this application, you agree to our{' '}
                      <a href="/terms" className="text-primary hover:underline">Terms of Service</a>{' '}
                      and{' '}
                      <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {currentStep < STEPS.length - 1 ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</>
                ) : (
                  <><CheckCircle className="h-4 w-4 mr-2" />Submit Application</>
                )}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
