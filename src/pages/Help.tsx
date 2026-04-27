import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/BackButton";
import MobileAppLayout from "@/components/MobileAppLayout";
import { 
  Mail, Phone, MessageSquare, HelpCircle, Loader2, Search, 
  ChevronRight, Headphones, Shield, CreditCard,
  Bus, Calendar, MapPin, Ticket
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const quickActions = [
  { icon: Bus, label: "Track Booking", color: "bg-blue-500/10 text-blue-600", path: "/orders" },
  { icon: CreditCard, label: "Refund Status", color: "bg-green-500/10 text-green-600", path: "/orders" },
  { icon: Calendar, label: "Reschedule", color: "bg-purple-500/10 text-purple-600", path: "/orders" },
  { icon: Ticket, label: "Get Ticket", color: "bg-orange-500/10 text-orange-600", path: "/retrieve-booking" },
];

const categories = [
  { icon: Bus, label: "Bookings", count: 12 },
  { icon: CreditCard, label: "Payments", count: 8 },
  { icon: Shield, label: "Account", count: 6 },
  { icon: MapPin, label: "Travel", count: 10 },
];

const Help = () => {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      toast.success("Message sent! We'll respond within 24 hours.");
      setFormData({ name: "", email: "", subject: "", message: "" });
      setLoading(false);
    }, 1000);
  };

  const faqs = [
    {
      question: "How do I book a bus ticket?",
      answer: "Enter your departure and destination, select your travel date, browse available buses, choose your seats, and complete the booking process.",
      category: "Bookings"
    },
    {
      question: "Can I modify or cancel my booking?",
      answer: "Yes, you can modify or cancel from the My Bookings page. Cancellation policies vary by operator.",
      category: "Bookings"
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major cards, mobile money, and digital wallets. All payments are encrypted and secure.",
      category: "Payments"
    },
    {
      question: "How do I retrieve my booking?",
      answer: "Click 'Retrieve Booking' and enter your booking reference and email to get your details instantly.",
      category: "Bookings"
    },
    {
      question: "What is trip insurance?",
      answer: "Trip insurance covers cancellations, medical emergencies, and lost luggage with Basic, Standard, and Premium options.",
      category: "Travel"
    },
    {
      question: "Can I choose my seat?",
      answer: "Yes! During booking, view the seat map and select your preferred seats. Premium seats may cost extra.",
      category: "Bookings"
    },
  ];

  const filteredFaqs = searchQuery 
    ? faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;

  return (
    <MobileAppLayout>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-background border-b safe-area-pt">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <BackButton fallbackPath="/" />
              <h1 className="text-xl font-bold">Help & Support</h1>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Hero Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 overflow-hidden">
              <CardContent className="p-6 relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <div className="relative">
                  <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                    <Headphones className="h-7 w-7" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">How can we help?</h2>
                  <p className="text-primary-foreground/80 mb-4">
                    Search our help center or contact us directly
                  </p>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Search for help..."
                      className="pl-12 h-12 rounded-2xl bg-background text-foreground border-0"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="font-semibold mb-3">Quick Actions</h3>
            <div className="grid grid-cols-4 gap-3">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Link to={action.path}>
                    <Card className="p-3 rounded-2xl border-0 shadow-sm hover:shadow-md transition-all cursor-pointer tap-target active:scale-95">
                      <div className={cn("h-12 w-12 rounded-xl mx-auto mb-2 flex items-center justify-center", action.color)}>
                        <action.icon className="h-6 w-6" />
                      </div>
                      <p className="text-xs font-medium text-center">{action.label}</p>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Contact Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="font-semibold mb-3">Get in Touch</h3>
            <div className="grid gap-3">
              <a href="https://wa.me/12345678900" target="_blank" rel="noopener noreferrer">
              <Card 
                className="p-4 rounded-2xl border-0 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                    <MessageSquare className="h-7 w-7 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Live Chat</p>
                    <p className="text-sm text-muted-foreground">Chat with us now</p>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                    Online
                  </Badge>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Card>
              </a>

              <a href="tel:+12345678900">
                <Card className="p-4 rounded-2xl border-0 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98]">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Phone className="h-7 w-7 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">Call Us</p>
                      <p className="text-sm text-muted-foreground">+1 (234) 567-8900</p>
                    </div>
                    <Badge variant="outline">Mon-Fri 9-6</Badge>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Card>
              </a>

              <a href="mailto:support@todapayments.com">
                <Card className="p-4 rounded-2xl border-0 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98]">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                      <Mail className="h-7 w-7 text-violet-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">Email Support</p>
                      <p className="text-sm text-muted-foreground">support@todapayments.com</p>
                    </div>
                    <Badge variant="outline">24h response</Badge>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Card>
              </a>
            </div>
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Frequently Asked</h3>
              <Badge variant="outline">{filteredFaqs.length} articles</Badge>
            </div>
            <Card className="rounded-3xl overflow-hidden border-0 shadow-sm">
              <Accordion type="single" collapsible className="w-full">
                {filteredFaqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border-b last:border-0">
                    <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-muted/50 [&[data-state=open]>svg]:rotate-180">
                      <div className="flex items-center gap-3 text-left">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <HelpCircle className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{faq.question}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{faq.category}</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-0">
                      <div className="pl-13 ml-13">
                        <p className="text-sm text-muted-foreground pl-[52px]">{faq.answer}</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="font-semibold mb-3">Send a Message</h3>
            <Card className="p-4 rounded-3xl border-0 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your name"
                      className="h-12 rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@email.com"
                      className="h-12 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-sm font-medium">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="What's this about?"
                    className="h-12 rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm font-medium">Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your issue..."
                    rows={4}
                    className="rounded-xl resize-none"
                    required
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full h-12 rounded-2xl text-base font-semibold">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-5 w-5" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </motion.div>
        </div>
      </div>
    </MobileAppLayout>
  );
};

export default Help;
