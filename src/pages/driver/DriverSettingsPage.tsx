import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Bell, Shield, Car, Moon, Sun, Globe,
  ChevronRight, HelpCircle, FileText, LogOut
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";

const DriverSettingsPage = () => {
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { 
    permission: pushPermission, 
    isSubscribed: pushSubscribed, 
    isLoading: pushLoading, 
    subscribe: pushSubscribe, 
    unsubscribe: pushUnsubscribe 
  } = usePushNotifications({
    onPermissionGranted: () => toast.success('Push notifications enabled!'),
    onPermissionDenied: () => toast.error('Notifications blocked. Enable in browser settings.')
  });

  const isDark = theme === 'dark';

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your preferences</p>
      </div>

      {/* Notifications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Push Notifications</Label>
              <p className="text-xs text-muted-foreground">
                {pushPermission === 'denied' 
                  ? 'Blocked — enable in browser settings' 
                  : pushSubscribed 
                    ? 'Receiving push alerts' 
                    : 'Get instant alerts on your device'}
              </p>
            </div>
            <Switch 
              checked={pushSubscribed}
              disabled={pushLoading || pushPermission === 'denied'}
              onCheckedChange={async (checked) => {
                if (checked) await pushSubscribe();
                else await pushUnsubscribe();
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* App Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <div>
                <Label>Dark Mode</Label>
                <p className="text-xs text-muted-foreground">
                  {isDark ? 'Dark theme active' : 'Light theme active'}
                </p>
              </div>
            </div>
            <Switch 
              checked={isDark}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Support Links */}
      <Card>
        <CardContent className="p-0">
          <button 
            className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors"
            onClick={() => navigate('/help')}
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">Help & Support</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <Separator />
          <button 
            className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors"
            onClick={() => navigate('/privacy')}
          >
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">Privacy & Security</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <Separator />
          <button className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">Terms & Policies</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Button 
        variant="destructive" 
        className="w-full rounded-xl h-12"
        onClick={handleSignOut}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );
};

export default DriverSettingsPage;
