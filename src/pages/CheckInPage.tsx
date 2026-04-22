import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import MobileAppLayout from "@/components/MobileAppLayout";
import CheckInScanner from "@/components/CheckInScanner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QrCode, Ticket, CheckCircle2 } from "lucide-react";
import BackButton from "@/components/BackButton";

const CheckInPage = () => {
  const navigate = useNavigate();
  const [recentCheckIns, setRecentCheckIns] = useState<string[]>([]);

  return (
    <MobileAppLayout hideNav>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background border-b safe-area-pt">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <BackButton fallbackPath="/" />
            <div>
              <h1 className="text-lg font-semibold">Event Check-In</h1>
              <p className="text-xs text-muted-foreground">
                Scan QR codes to check in attendees
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Ticket className="h-5 w-5 text-primary" />
              </div>
              <p className="text-2xl font-bold">--</p>
              <p className="text-xs text-muted-foreground">Total Tickets</p>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold">{recentCheckIns.length}</p>
              <p className="text-xs text-muted-foreground">Checked In</p>
            </Card>
          </motion.div>
        </div>

        {/* Scanner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <QrCode className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">QR Scanner</h2>
            </div>
            <CheckInScanner />
          </Card>
        </motion.div>

        {/* Recent Check-ins */}
        {recentCheckIns.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Recent Check-ins</h3>
              <div className="space-y-2">
                {recentCheckIns.slice(0, 5).map((ref, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg text-sm"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="font-mono">{ref}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </MobileAppLayout>
  );
};

export default CheckInPage;
