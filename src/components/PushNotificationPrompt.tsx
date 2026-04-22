import { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PushNotificationPromptProps {
  variant?: 'card' | 'banner' | 'inline';
  onDismiss?: () => void;
}

export const PushNotificationPrompt = ({ 
  variant = 'card',
  onDismiss 
}: PushNotificationPromptProps) => {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const { 
    isSupported, 
    permission, 
    isSubscribed, 
    isLoading, 
    subscribe 
  } = usePushNotifications({
    onPermissionGranted: () => {
      toast.success('Push notifications enabled!', {
        description: "You'll receive updates about your bookings"
      });
    },
    onPermissionDenied: () => {
      toast.error('Notifications blocked', {
        description: 'You can enable them in your browser settings'
      });
    }
  });

  useEffect(() => {
    const dismissedKey = 'push_prompt_dismissed';
    setDismissed(localStorage.getItem(dismissedKey) === 'true');
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('push_prompt_dismissed', 'true');
    setDismissed(true);
    onDismiss?.();
  };

  const handleSubscribe = async () => {
    const success = await subscribe();
    if (success) {
      handleDismiss();
    }
  };

  // Don't show if not supported, already subscribed, permission denied, dismissed, or not logged in
  if (!isSupported || isSubscribed || permission === 'denied' || dismissed || !user) {
    return null;
  }

  if (variant === 'banner') {
    return (
      <div className="bg-primary/10 border-b border-primary/20 px-4 py-3">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-primary" />
            <span className="text-sm">
              Enable notifications for booking updates and travel reminders
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              onClick={handleSubscribe}
              disabled={isLoading}
            >
              {isLoading ? 'Enabling...' : 'Enable'}
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <Bell className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Stay updated</p>
            <p className="text-xs text-muted-foreground">
              Get notified about your bookings
            </p>
          </div>
        </div>
        <Button 
          size="sm" 
          onClick={handleSubscribe}
          disabled={isLoading}
        >
          {isLoading ? 'Enabling...' : 'Enable'}
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-full shrink-0">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold mb-1">Never miss an update</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Get instant notifications for booking confirmations, price alerts, 
              and travel reminders.
            </p>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                onClick={handleSubscribe}
                disabled={isLoading}
              >
                {isLoading ? 'Enabling...' : 'Enable Notifications'}
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleDismiss}
              >
                Not now
              </Button>
            </div>
          </div>
          <Button 
            size="icon" 
            variant="ghost" 
            className="shrink-0 h-8 w-8"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
