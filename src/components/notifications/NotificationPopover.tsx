import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck, Trash2, Settings, Bus, Gift, Car, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/contexts/NotificationContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function NotificationPopover() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotifications();

  const getTypeConfig = (type: string, category?: string) => {
    if (category === "booking") {
      return { icon: Bus, color: "text-primary", bg: "bg-primary/10" };
    }
    if (category === "promotion") {
      return { icon: Gift, color: "text-amber-500", bg: "bg-amber-500/10" };
    }
    if (category === "payment") {
      return { icon: Car, color: "text-emerald-500", bg: "bg-emerald-500/10" };
    }
    return { icon: Bell, color: "text-blue-500", bg: "bg-blue-500/10" };
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const recentNotifications = notifications.slice(0, 5);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-11 w-11 rounded-full bg-secondary/50 relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-destructive rounded-full border-2 border-background animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[360px] p-0 rounded-2xl shadow-xl border-border/50" 
        align="end" 
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div>
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-xs"
                onClick={() => markAllAsRead()}
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                Read all
              </Button>
            )}
          </div>
        </div>

        {/* Notification List */}
        <ScrollArea className="max-h-[320px]">
          <AnimatePresence mode="popLayout">
            {recentNotifications.length > 0 ? (
              <div className="divide-y divide-border/50">
                {recentNotifications.map((notification, index) => {
                  const config = getTypeConfig(notification.type, notification.category);
                  const Icon = config.icon;

                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "group p-3 hover:bg-muted/50 transition-colors cursor-pointer",
                        !notification.read && "bg-primary/5"
                      )}
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead(notification.id);
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                          config.bg
                        )}>
                          <Icon className={cn("h-4 w-4", config.color)} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={cn(
                              "font-medium text-sm line-clamp-1",
                              !notification.read && "text-foreground"
                            )}>
                              {notification.title}
                            </h4>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {formatTime(notification.timestamp)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {notification.message}
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mb-3">
                  <Bell className="h-7 w-7 text-muted-foreground" />
                </div>
                <h4 className="font-medium text-sm">All caught up!</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  No notifications yet
                </p>
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs h-8" 
            asChild
            onClick={() => setOpen(false)}
          >
            <Link to="/inbox">
              View all notifications
            </Link>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs h-8 gap-1"
            asChild
            onClick={() => setOpen(false)}
          >
            <Link to="/settings/notifications">
              <Settings className="h-3.5 w-3.5" />
              Settings
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
