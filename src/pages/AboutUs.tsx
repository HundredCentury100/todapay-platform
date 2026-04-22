import MobileAppLayout from "@/components/MobileAppLayout";
import BackButton from "@/components/BackButton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Ticket, Globe, Users, Award, MapPin, Phone, Mail, 
  Shield, Clock, Languages, CreditCard, Wifi, 
  Smartphone, Bus, Calendar, Building2, Briefcase,
  CheckCircle2, Star, TrendingUp, Zap, Heart
} from "lucide-react";
import { Link } from "react-router-dom";

const AboutUs = () => {
  const competitiveAdvantages = [
    { icon: <Globe className="h-6 w-6" />, title: "Zimbabwe Coverage", description: "From Harare to Victoria Falls, Bulawayo to Mutare - we cover routes and events across Zimbabwe.", highlight: "Nationwide" },
    { icon: <Languages className="h-6 w-6" />, title: "Multi-Language Support", description: "Available in English, Shona, and Ndebele with localized experiences.", highlight: "Local First" },
    { icon: <CreditCard className="h-6 w-6" />, title: "Local Payment Methods", description: "EcoCash, InnBucks, O'mari, OneMoney, TeleCash - pay your way with local wallets.", highlight: "All Methods" },
    { icon: <Wifi className="h-6 w-6" />, title: "Offline-First PWA", description: "Works seamlessly even with limited connectivity - perfect for travelers on the go.", highlight: "Always Available" },
    { icon: <Shield className="h-6 w-6" />, title: "Verified Operators", description: "All bus operators and event organizers are vetted for safety and reliability.", highlight: "100% Verified" },
    { icon: <Zap className="h-6 w-6" />, title: "AI-Powered Search", description: "Find the perfect trip or event with our intelligent search assistant.", highlight: "Smart Tech" }
  ];

  const platformStats = [
    { number: "100K+", label: "Tickets Sold", icon: <Ticket className="h-5 w-5" /> },
    { number: "500+", label: "Verified Partners", icon: <CheckCircle2 className="h-5 w-5" /> },
    { number: "16+", label: "Cities", icon: <Globe className="h-5 w-5" /> },
    { number: "24/7", label: "Support Available", icon: <Clock className="h-5 w-5" /> }
  ];

  const services = [
    { icon: <Bus className="h-8 w-8" />, name: "Bus Tickets", description: "Cross-border and local routes" },
    { icon: <Calendar className="h-8 w-8" />, name: "Event Tickets", description: "Concerts, sports, festivals" },
    { icon: <Building2 className="h-8 w-8" />, name: "Stays", description: "Hotels and lodges" },
    { icon: <Briefcase className="h-8 w-8" />, name: "Workspaces", description: "Co-working and meeting rooms" }
  ];

  const regions = [
    { name: "Mashonaland", cities: ["Harare", "Chinhoyi", "Marondera", "Bindura"] },
    { name: "Matabeleland", cities: ["Bulawayo", "Hwange", "Victoria Falls", "Gwanda"] },
    { name: "Midlands & South", cities: ["Gweru", "Kwekwe", "Masvingo", "Chivhu"] },
    { name: "Cross-Border", cities: ["Johannesburg", "Lusaka", "Gaborone", "Maputo"] },
  ];

  return (
    <MobileAppLayout>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background border-b safe-area-pt">
          <div className="px-4 py-3 flex items-center gap-3">
            <BackButton fallbackPath="/" />
            <div className="flex-1">
              <h1 className="font-bold text-lg">About FulTicket</h1>
              <p className="text-xs text-muted-foreground">Zimbabwe's Super App</p>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 space-y-8">
          {/* Hero */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-primary/10">
                <Ticket className="h-10 w-10 text-primary" />
              </div>
            </div>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Connecting Zimbabweans through seamless travel, events, and unforgettable experiences.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {platformStats.map((stat, index) => (
              <Card key={index} className="p-4 text-center rounded-2xl border-0 shadow-md">
                <div className="flex justify-center mb-2 text-primary">{stat.icon}</div>
                <p className="text-2xl font-bold">{stat.number}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </Card>
            ))}
          </div>

          {/* Mission */}
          <Card className="p-5 rounded-2xl bg-gradient-to-br from-primary/5 to-background border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Our Mission</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              FulTicket is revolutionizing travel and event booking in Zimbabwe, making experiences 
              accessible, affordable, and delightful for every Zimbabwean.
            </p>
          </Card>

          {/* Services */}
          <div>
            <h2 className="text-lg font-bold mb-3">What We Offer</h2>
            <div className="grid grid-cols-2 gap-3">
              {services.map((service, index) => (
                <Card key={index} className="p-4 text-center rounded-2xl border-0 shadow-md">
                  <div className="text-primary mb-2 flex justify-center">{service.icon}</div>
                  <h3 className="font-semibold text-sm mb-1">{service.name}</h3>
                  <p className="text-xs text-muted-foreground">{service.description}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Advantages */}
          <div>
            <h2 className="text-lg font-bold mb-3">Why Choose Us?</h2>
            <div className="space-y-3">
              {competitiveAdvantages.map((adv, index) => (
                <Card key={index} className="p-4 rounded-2xl border-0 shadow-md">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">{adv.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-sm">{adv.title}</h3>
                        <Badge variant="outline" className="text-[10px] shrink-0">{adv.highlight}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{adv.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Regions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Where We Operate</h2>
            </div>
            <div className="space-y-3">
              {regions.map((region) => (
                <Card key={region.name} className="p-4 rounded-2xl border-0 shadow-md">
                  <div className="flex items-center gap-2 mb-1">
                    <Globe className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">{region.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{region.cities.join(" • ")} & more</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Trust & Safety */}
          <Card className="p-5 rounded-2xl border-0 shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Trust & Safety</h2>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="p-3 rounded-full bg-green-500/10 w-fit mx-auto mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-xs font-medium">Verified</p>
              </div>
              <div>
                <div className="p-3 rounded-full bg-blue-500/10 w-fit mx-auto mb-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-xs font-medium">Encrypted</p>
              </div>
              <div>
                <div className="p-3 rounded-full bg-purple-500/10 w-fit mx-auto mb-2">
                  <Smartphone className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-xs font-medium">Digital QR</p>
              </div>
            </div>
          </Card>

          {/* Contact */}
          <Card className="p-5 rounded-2xl border-0 shadow-md">
            <h2 className="text-lg font-bold mb-4">Get in Touch</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Globe className="h-4 w-4 text-primary" />
                </div>
                <div>
                   <p className="font-medium text-sm">Headquarters</p>
                   <p className="text-xs text-muted-foreground">Harare, Zimbabwe</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500/10">
                  <Phone className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">24/7 Support</p>
                  <p className="text-xs text-muted-foreground">In your language</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-500/10">
                  <Mail className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Email</p>
                  <a href="mailto:support@fulticket.com" className="text-xs text-primary hover:underline">
                    support@fulticket.com
                  </a>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t flex gap-3">
              <Link to="/" className="flex-1">
                <Button className="w-full rounded-xl">Start Booking</Button>
              </Link>
              <Link to="/merchant/portal" className="flex-1">
                <Button variant="outline" className="w-full rounded-xl">Partner With Us</Button>
              </Link>
            </div>
          </Card>
        </main>
      </div>
    </MobileAppLayout>
  );
};

export default AboutUs;
