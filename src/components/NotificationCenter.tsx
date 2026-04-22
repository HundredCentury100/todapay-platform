import { Bell, X, CheckCircle2, AlertCircle, Info, Receipt, Calendar, Megaphone, Settings, Search, Trash2, CreditCard, Ticket, ExternalLink, Bus, Building2, Briefcase, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotifications, type NotificationType, type NotificationCategory } from "@/contexts/NotificationContext";
import { format } from "date-fns";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const NotificationCenter = () => {
  const { notifications, markAsRead, removeNotification, markAllAsRead, unreadCount, getByCategory } = useNotifications();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<NotificationCategory>("all");
  const navigate = useNavigate();

  const getIcon = (type: NotificationType, category: NotificationCategory) => {
    // Category-specific icons take priority
    switch (category) {
      case "booking":
        return <Ticket className="w-4 h-4 text-primary" />;
      case "payment":
        return <Wallet className="w-4 h-4 text-green-500" />;
      case "promotion":
        return <Megaphone className="w-4 h-4 text-purple-500" />;
    }
    
    // Fallback to type-based icons
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "info":
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getCategoryLabel = (category: NotificationCategory) => {
    switch (category) {
      case "booking": return "Booking";
      case "payment": return "Payment";
      case "promotion": return "Promo";
      case "system": return "System";
      default: return "";
    }
  };

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case "booking": return <Ticket className="h-3 w-3" />;
      case "payment": return <Wallet className="h-3 w-3" />;
      case "promotion": return <Megaphone className="h-3 w-3" />;
      default: return null;
    }
  };

  const filteredNotifications = getByCategory(activeTab).filter(notif => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      notif.title.toLowerCase().includes(query) ||
      notif.message.toLowerCase().includes(query) ||
      notif.metadata?.bookingRef?.toLowerCase().includes(query)
    );
  });

  const handleNotificationClick = (notif: typeof notifications[0]) => {
    if (!notif.read) markAsRead(notif.id);
    
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    } else {
      setExpandedId(expandedId === notif.id ? null : notif.id);
    }
  };

  const tabCounts = {
    all: notifications.length,
    booking: getByCategory("booking").length,
    payment: getByCategory("payment").length,
    promotion: getByCategory("promotion").length,
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-9 sm:w-9">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center p-0 text-[10px] sm:text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-1rem)] sm:w-[420px] p-0 mx-2 sm:mx-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Inbox</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-7 px-2"
            >
              Mark all read
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as NotificationCategory)} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-9 p-0">
            <TabsTrigger value="all" className="text-xs data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-9">
              All {tabCounts.all > 0 && `(${tabCounts.all})`}
            </TabsTrigger>
            <TabsTrigger value="booking" className="text-xs data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-9">
              {getCategoryIcon("booking")}
              <span className="ml-1">Trips</span>
            </TabsTrigger>
            <TabsTrigger value="payment" className="text-xs data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-9">
              {getCategoryIcon("payment")}
              <span className="ml-1">Payments</span>
            </TabsTrigger>
            <TabsTrigger value="promotion" className="text-xs data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-9">
              {getCategoryIcon("promotion")}
              <span className="ml-1">Offers</span>
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[50vh] sm:h-[380px]">
            <TabsContent value={activeTab} className="m-0">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground p-4">
                  <Bell className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm font-medium">No notifications</p>
                  <p className="text-xs text-muted-foreground">
                    {activeTab === "all" ? "You're all caught up!" : `No ${activeTab} notifications`}
                  </p>
                </div>
              ) : (
                <div>
                  {filteredNotifications.map((notif) => {
                    const isExpanded = expandedId === notif.id;
                    const isSponsored = notif.metadata?.isSponsored;
                    
                    return (
                      <div
                        key={notif.id}
                        className={`relative flex items-start gap-3 p-3 border-b hover:bg-accent/50 transition-colors cursor-pointer ${
                          !notif.read ? "bg-primary/5" : ""
                        } ${isExpanded ? "bg-accent/40" : ""} ${isSponsored ? "bg-gradient-to-r from-purple-500/5 to-transparent" : ""}`}
                        onClick={() => handleNotificationClick(notif)}
                      >
                        {/* Unread indicator */}
                        {!notif.read && (
                          <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                        
                        {/* Icon */}
                        <div className="mt-0.5 shrink-0 p-1.5 rounded-full bg-muted">
                          {getIcon(notif.type, notif.category)}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                {isSponsored && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-purple-300 text-purple-600">
                                    Sponsored
                                  </Badge>
                                )}
                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                                  {getCategoryLabel(notif.category)}
                                </Badge>
                              </div>
                              <p className="font-medium text-sm leading-tight">{notif.title}</p>
                            </div>
                          </div>
                          
                          <p className={`text-xs text-muted-foreground mt-1 whitespace-pre-wrap ${!isExpanded ? "line-clamp-2" : ""}`}>
                            {notif.message}
                          </p>
                          
                          {/* Metadata for bookings/payments */}
                          {isExpanded && notif.metadata && (
                            <div className="mt-2 p-2 rounded-md bg-muted/50 text-xs space-y-1">
                              {notif.metadata.bookingRef && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Reference:</span>
                                  <span className="font-mono font-medium">{notif.metadata.bookingRef}</span>
                                </div>
                              )}
                              {notif.metadata.amount && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Amount:</span>
                                  <span className="font-medium text-green-600">
                                    {notif.metadata.currency || '$'}{notif.metadata.amount.toFixed(2)}
                                  </span>
                                </div>
                              )}
                              {notif.metadata.eventName && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Event:</span>
                                  <span className="font-medium truncate ml-2">{notif.metadata.eventName}</span>
                                </div>
                              )}
                              {notif.metadata.routeFrom && notif.metadata.routeTo && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Route:</span>
                                  <span className="font-medium">{notif.metadata.routeFrom} → {notif.metadata.routeTo}</span>
                                </div>
                              )}
                              {notif.metadata.travelDate && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Date:</span>
                                  <span className="font-medium">{notif.metadata.travelDate}</span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Action buttons */}
                          {isExpanded && (
                            <div className="flex gap-2 mt-2">
                              {notif.actionUrl && (
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(notif.actionUrl!);
                                }}>
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  View Details
                                </Button>
                              )}
                              {notif.attachmentUrl && (
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(notif.attachmentUrl, '_blank');
                                }}>
                                  <Receipt className="h-3 w-3 mr-1" />
                                  Receipt
                                </Button>
                              )}
                            </div>
                          )}
                          
                          {/* Timestamp */}
                          <div className="flex items-center gap-2 mt-1.5">
                            <p className="text-[10px] text-muted-foreground">
                              {format(notif.timestamp, "MMM d, yyyy")}
                            </p>
                            <span className="text-muted-foreground/50">•</span>
                            <p className="text-[10px] text-muted-foreground">
                              {format(notif.timestamp, "h:mm a")}
                            </p>
                          </div>
                        </div>

                        {/* Delete button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 opacity-50 hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notif.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Footer */}
        <div className="p-2 border-t bg-muted/20 flex items-center justify-between">
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate('/notification-settings')}>
            <Settings className="h-3 w-3 mr-1" />
            Settings
          </Button>
          <p className="text-[10px] text-muted-foreground">
            Showing {filteredNotifications.length} notifications
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;