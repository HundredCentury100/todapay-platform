import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getAllMerchantProfiles, createMerchantProfile } from "@/services/merchantService";
import { MerchantRole } from "@/types/merchant";
import { Loader2, CheckCircle2, Bus, Calendar, Briefcase, Users, Hotel, Plane, Laptop, Car, CarTaxiFront, Building2, Compass } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const businessTypes = [
  {
    role: "bus_operator" as MerchantRole,
    title: "Bus Operator",
    description: "Manage your fleet, routes, and schedules",
    icon: Bus,
    dashboardPath: "/merchant/bus-operator"
  },
  {
    role: "event_organizer" as MerchantRole,
    title: "Event Organizer",
    description: "Create and manage events, sell tickets",
    icon: Calendar,
    dashboardPath: "/merchant/event-organizer"
  },
  {
    role: "venue_owner" as MerchantRole,
    title: "Venue Owner",
    description: "Rent out venues for events and meetings",
    icon: Building2,
    dashboardPath: "/merchant/venue-owner"
  },
  {
    role: "property_owner" as MerchantRole,
    title: "Property Owner",
    description: "Manage hotels, lodges, and accommodations",
    icon: Hotel,
    dashboardPath: "/merchant/property-owner"
  },
  {
    role: "airline_partner" as MerchantRole,
    title: "Airline Partner",
    description: "Partner with airlines for flight bookings",
    icon: Plane,
    dashboardPath: "/merchant/airline"
  },
  {
    role: "workspace_provider" as MerchantRole,
    title: "Workspace Provider",
    description: "List remote workspaces and coworking spaces",
    icon: Laptop,
    dashboardPath: "/merchant/workspace"
  },
  {
    role: "car_rental_company" as MerchantRole,
    title: "Car Rental",
    description: "Manage your fleet and rental bookings",
    icon: Car,
    dashboardPath: "/merchant/car-rental"
  },
  {
    role: "transfer_provider" as MerchantRole,
    title: "Transfer Provider",
    description: "Offer airport transfers and shuttle services",
    icon: CarTaxiFront,
    dashboardPath: "/merchant/transfers"
  },
  {
    role: "experience_host" as MerchantRole,
    title: "Experience Host",
    description: "Host tours, activities, and local experiences",
    icon: Compass,
    dashboardPath: "/merchant/experiences"
  },
  {
    role: "travel_agent" as MerchantRole,
    title: "Travel Agent",
    description: "Book tickets for clients, earn commissions",
    icon: Briefcase,
    dashboardPath: "/merchant/agent"
  },
  {
    role: "booking_agent" as MerchantRole,
    title: "Booking Agent",
    description: "Process bookings and earn per transaction",
    icon: Users,
    dashboardPath: "/merchant/agent"
  }
];
const MerchantPortal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<MerchantRole | null>(null);
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/merchant/auth');
      return;
    }

    checkProfiles();
  }, [user, navigate]);

  const checkProfiles = async () => {
    try {
      setLoading(true);
      const allProfiles = await getAllMerchantProfiles();
      
      const foundProfiles = allProfiles.map(profile => ({
        role: profile.role,
        profile: profile
      }));

      setProfiles(foundProfiles);

      // Auto-redirect if only one profile exists
      if (foundProfiles.length === 1) {
        const role = foundProfiles[0].role;
        const typeInfo = businessTypes.find(t => t.role === role);
        navigate(typeInfo?.dashboardPath || '/merchant/portal');
      }

      setLoading(false);
    } catch (error) {
      console.error('Error checking profiles:', error);
      setLoading(false);
    }
  };

  // Listen for profile updates via realtime
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('merchant-profile-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'merchant_profiles',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          checkProfiles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSelectBusinessType = async (type: typeof businessTypes[0]) => {
    if (!user) return;
    
    // Check if already has this role
    if (profiles.find(p => p.role === type.role)) {
      navigate(type.dashboardPath);
      return;
    }

    setCreating(type.role);
    
    try {
      // Create minimal profile - user completes details in dashboard
      await createMerchantProfile({
        role: type.role,
        business_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'My Business',
        business_email: user.email || '',
        business_phone: '',
        business_address: '',
      });

      toast({
        title: "Welcome!",
        description: "Your account is set up. Complete your profile to get verified.",
      });

      // Navigate directly to dashboard
      navigate(type.dashboardPath);
    } catch (error: any) {
      console.error('Error creating profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreating(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // No profiles - show business type selector for quick selection
  if (profiles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Get Started with fulticket</h1>
            <p className="text-muted-foreground">Select your business type to continue</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {businessTypes.map((type) => {
              const Icon = type.icon;
              const isCreating = creating === type.role;
              
              return (
                <Card 
                  key={type.role}
                  className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50 group"
                  onClick={() => !creating && handleSelectBusinessType(type)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{type.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{type.description}</CardDescription>
                    {isCreating && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-primary">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Setting up...
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Multiple profiles - show selection
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-center">Select Your Business</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {profiles.map(({ role, profile }) => {
            const typeInfo = businessTypes.find(t => t.role === role);
            const Icon = typeInfo?.icon || Bus;
            
            return (
              <Card 
                key={role} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(typeInfo?.dashboardPath || '/merchant/bus-operator')}
              >
                <CardHeader>
            <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {typeInfo?.title || role}
                        </CardTitle>
                        <CardDescription>{profile.business_name}</CardDescription>
                      </div>
                    </div>
                    <Badge 
                      variant={profile.verification_status === 'verified' ? 'default' : 'secondary'}
                      className={profile.verification_status === 'verified' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                        : ''}
                    >
                      {profile.verification_status === 'verified' && (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      )}
                      {profile.verification_status}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Add another business type */}
        {profiles.length < businessTypes.length && (
          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">Add another business type</p>
            <div className="flex flex-wrap justify-center gap-2">
              {businessTypes
                .filter(type => !profiles.find(p => p.role === type.role))
                .map(type => {
                  const Icon = type.icon;
                  const isCreating = creating === type.role;
                  
                  return (
                    <Button
                      key={type.role}
                      variant="outline"
                      onClick={() => handleSelectBusinessType(type)}
                      disabled={!!creating}
                    >
                      {isCreating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Icon className="h-4 w-4 mr-2" />
                      )}
                      {type.title}
                    </Button>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchantPortal;
