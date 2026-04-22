import MobileAppLayout from "@/components/MobileAppLayout";
import BackButton from "@/components/BackButton";
import { Card } from "@/components/ui/card";
import { FileText, Shield, ScrollText, Scale, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const legalItems = [
  {
    icon: ScrollText,
    title: "Terms of Service",
    description: "Our terms and conditions",
    path: "/terms",
    iconColor: "text-blue-500",
    iconBg: "bg-blue-100",
  },
  {
    icon: Shield,
    title: "Privacy Policy",
    description: "How we handle your data",
    path: "/privacy",
    iconColor: "text-green-500",
    iconBg: "bg-green-100",
  },
  {
    icon: FileText,
    title: "Cookie Policy",
    description: "Our use of cookies",
    path: "/privacy#cookies",
    iconColor: "text-amber-500",
    iconBg: "bg-amber-100",
  },
  {
    icon: Scale,
    title: "Refund Policy",
    description: "Cancellation and refunds",
    path: "/terms#refunds",
    iconColor: "text-purple-500",
    iconBg: "bg-purple-100",
  },
];

const Legal = () => {
  return (
    <MobileAppLayout>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background border-b safe-area-pt">
          <div className="px-4 py-3 flex items-center gap-3">
            <BackButton fallbackPath="/profile" />
            <div className="flex-1">
              <h1 className="font-bold text-lg">Legal</h1>
              <p className="text-xs text-muted-foreground">Terms, policies, and agreements</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="px-4 py-6 space-y-4">
          {legalItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={item.path}>
                  <Card className="p-4 rounded-2xl border-0 shadow-md hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl ${item.iconBg} flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${item.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-5 rounded-2xl border-0 shadow-md bg-muted/50">
              <p className="text-sm text-muted-foreground text-center">
                By using our services, you agree to our Terms of Service and Privacy Policy. 
                For any questions, please contact our support team.
              </p>
            </Card>
          </motion.div>
        </main>
      </div>
    </MobileAppLayout>
  );
};

export default Legal;
