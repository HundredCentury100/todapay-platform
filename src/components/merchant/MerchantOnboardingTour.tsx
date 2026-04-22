import { useState, useEffect } from "react";
import { X, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface TourStep {
  title: string;
  description: string;
  target?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to Your Dashboard! 🎉",
    description: "Let's take a quick tour of your merchant dashboard and its key features.",
  },
  {
    title: "Dashboard Overview",
    description: "Here you can see your key metrics: revenue, bookings, and performance trends at a glance.",
  },
  {
    title: "Manage Your Listings",
    description: "Create and manage your bus routes or events. Keep your offerings up to date for customers.",
  },
  {
    title: "Track Bookings",
    description: "View all customer bookings, process refunds, handle cancellations, and manage customer requests.",
  },
  {
    title: "Analytics & Reports",
    description: "Get insights into your business performance with detailed analytics and revenue forecasts.",
  },
  {
    title: "You're All Set!",
    description: "You're ready to start managing your business. Need help? Check our documentation anytime.",
  },
];

interface MerchantOnboardingTourProps {
  merchantProfileId: string;
}

export const MerchantOnboardingTour = ({ merchantProfileId }: MerchantOnboardingTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, [merchantProfileId]);

  const checkOnboardingStatus = async () => {
    const { data } = await supabase
      .from('merchant_profiles')
      .select('onboarding_completed')
      .eq('id', merchantProfileId)
      .single();

    if (data && !data.onboarding_completed) {
      setShowTour(true);
    }
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTour = async () => {
    await supabase
      .from('merchant_profiles')
      .update({ onboarding_completed: true })
      .eq('id', merchantProfileId);

    setShowTour(false);
  };

  if (!showTour) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
      <Card className="w-full max-w-md mx-4 shadow-md">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2"
            onClick={completeTour}
          >
            <X className="h-4 w-4" />
          </Button>
          <CardTitle>{step.title}</CardTitle>
          <CardDescription>Step {currentStep + 1} of {TOUR_STEPS.length}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{step.description}</p>
          
          <div className="flex justify-between items-center pt-4">
            <div className="flex gap-1">
              {TOUR_STEPS.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    index === currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handlePrevious}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
              <Button onClick={handleNext}>
                {currentStep === TOUR_STEPS.length - 1 ? "Get Started" : "Next"}
                {currentStep < TOUR_STEPS.length - 1 && <ArrowRight className="h-4 w-4 ml-2" />}
              </Button>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={completeTour}
          >
            Skip Tour
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};