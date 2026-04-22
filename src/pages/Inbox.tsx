import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { 
  Bell, MessageSquare, Tag, Info, ChevronRight,
  CheckCheck, Trash2, Settings, Gift, Car, Bus, Calendar, Loader2,
  Sparkles, Send, Bot, User as UserIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import MobileAppLayout from "@/components/MobileAppLayout";
import BackButton from "@/components/BackButton";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Notification {
  id: string;
  type: "booking" | "promo" | "update" | "message" | "ride";
  title: string;
  body: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Strip markdown asterisks from text
const stripAsterisks = (text: string): string => {
  return text
    .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1');
};

const Inbox = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("ai");
  const queryClient = useQueryClient();
  const initialQuerySent = useRef(false);

  // AI Chat state
  const [aiMessages, setAiMessages] = useState<AIChatMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const aiScrollRef = useRef<HTMLDivElement>(null);
  const { toast: toastHook } = useToast();

  useEffect(() => {
    if (aiScrollRef.current) {
      aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight;
    }
  }, [aiMessages]);

  // Auto-send query from search bar
  useEffect(() => {
    const q = searchParams.get("q");
    if (q && !initialQuerySent.current) {
      initialQuerySent.current = true;
      setActiveTab("ai");
      setSearchParams({}, { replace: true });
      // Small delay to ensure component is mounted
      setTimeout(() => {
        setAiInput(q);
        // Trigger send programmatically
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
        sendAiMessage(q);
      }, 100);
    }
  }, [searchParams]);

  // Fetch notifications from database
  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ['user-notifications', user?.id],
    queryFn: async (): Promise<Notification[]> => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data || []).map((n) => ({
        id: n.id,
        type: mapNotificationType(n.type || 'update'),
        title: n.title || 'Notification',
        body: n.message || '',
        timestamp: new Date(n.created_at || new Date()),
        read: n.read || false,
        actionUrl: getActionUrl(n.type),
      }));
    },
    enabled: !!user,
    staleTime: 1000 * 60,
  });

  const getActionUrl = (type: string | null): string | undefined => {
    switch (type) {
      case 'booking':
      case 'booking_confirmation':
      case 'booking_reminder':
        return '/orders';
      case 'ride':
      case 'ride_update':
        return '/rides';
      default:
        return undefined;
    }
  };

  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('user_notifications')
        .update({ read: true })
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from('user_notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
      toast.success("All notifications marked as read");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
      toast.success("Notification deleted");
    },
  });

  const mapNotificationType = (type: string): Notification['type'] => {
    switch (type) {
      case 'booking_confirmation':
      case 'booking_reminder':
      case 'booking':
        return 'booking';
      case 'promo':
      case 'promotion':
        return 'promo';
      case 'ride':
      case 'ride_update':
        return 'ride';
      case 'message':
        return 'message';
      default:
        return 'update';
    }
  };

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Core AI send logic
  const sendAiMessage = useCallback(async (text: string) => {
    if (!text.trim() || aiLoading) return;

    const userMessage: AIChatMessage = { role: 'user', content: text.trim() };
    setAiMessages(prev => [...prev, userMessage]);
    setAiInput('');
    setAiLoading(true);

    let assistantContent = '';

    try {
      const allMessages = [...aiMessages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-support-bot`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: allMessages,
            userId: user?.id || null,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Search failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              const cleaned = stripAsterisks(assistantContent);
              setAiMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: cleaned } : m
                  );
                }
                return [...prev, { role: 'assistant', content: cleaned }];
              });
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('AI search error:', error);
      toastHook({
        title: 'Search Error',
        description: error instanceof Error ? error.message : 'Failed to search',
        variant: 'destructive',
      });
    } finally {
      setAiLoading(false);
    }
  }, [aiMessages, aiLoading, user?.id, toastHook]);

  // AI Chat form handler
  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sendAiMessage(aiInput);
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case "booking": 
        return { icon: Bus, color: "text-primary", bg: "bg-primary/10" };
      case "promo": 
        return { icon: Gift, color: "text-amber-500", bg: "bg-amber-500/10" };
      case "message": 
        return { icon: MessageSquare, color: "text-emerald-500", bg: "bg-emerald-500/10" };
      case "ride":
        return { icon: Car, color: "text-service-rides", bg: "bg-service-rides/10" };
      default: 
        return { icon: Bell, color: "text-blue-500", bg: "bg-blue-500/10" };
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !n.read;
    return n.type === activeTab;
  });

  const NotificationCard = ({ notification }: { notification: Notification }) => {
    const config = getTypeConfig(notification.type);
    const Icon = config.icon;
    const [dragX, setDragX] = useState(0);

    const handleClick = () => {
      if (!notification.read) {
        markReadMutation.mutate(notification.id);
      }
    };

    const handleDragEnd = (_: any, info: { offset: { x: number } }) => {
      if (info.offset.x < -120) {
        if ('vibrate' in navigator) navigator.vibrate(25);
        deleteMutation.mutate(notification.id);
      } else if (info.offset.x > 120 && !notification.read) {
        if ('vibrate' in navigator) navigator.vibrate(10);
        markReadMutation.mutate(notification.id);
      }
      setDragX(0);
    };

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: dragX < -80 ? -300 : dragX > 80 ? 300 : 20, height: 0, marginBottom: 0 }}
        layout
        className="relative overflow-hidden rounded-2xl"
      >
        {/* Underlay indicators */}
        <div className="absolute inset-0 flex items-center justify-between px-6">
          <div className={`flex items-center gap-2 text-primary transition-opacity ${dragX > 40 ? 'opacity-100' : 'opacity-0'}`}>
            <CheckCheck className="h-5 w-5" />
            <span className="text-sm font-medium">Read</span>
          </div>
          <div className={`flex items-center gap-2 text-destructive transition-opacity ${dragX < -40 ? 'opacity-100' : 'opacity-0'}`}>
            <span className="text-sm font-medium">Delete</span>
            <Trash2 className="h-5 w-5" />
          </div>
        </div>

        <motion.div
          drag="x"
          dragConstraints={{ left: -150, right: 150 }}
          dragElastic={0.1}
          onDrag={(_, info) => setDragX(info.offset.x)}
          onDragEnd={handleDragEnd}
          onClick={handleClick}
          className={`relative z-10 p-4 rounded-2xl transition-colors active:scale-[0.98] touch-manipulation ${
            notification.read 
              ? "bg-card border border-border/50" 
              : "bg-primary/5 border border-primary/20"
          }`}
          style={{ 
            backgroundColor: dragX < -40 ? 'hsl(var(--destructive) / 0.08)' : dragX > 40 ? 'hsl(var(--primary) / 0.08)' : undefined 
          }}
        >
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${config.bg}`}>
              <Icon className={`h-6 w-6 ${config.color}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className={`font-semibold text-sm ${!notification.read && "text-foreground"}`}>
                  {notification.title}
                </h3>
                <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">
                  {formatTime(notification.timestamp)}
                </span>
              </div>
              
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {notification.body}
              </p>

              <div className="flex items-center gap-2 mt-3">
                {notification.actionUrl && (
                  <Button asChild size="sm" className="h-8 px-4 text-xs rounded-full">
                    <Link to={notification.actionUrl}>
                      View Details
                    </Link>
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMutation.mutate(notification.id);
                  }}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  if (!user) {
    return (
      <MobileAppLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Bell className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Stay Updated</h2>
          <p className="text-muted-foreground mb-8 max-w-[280px]">
            Sign in to receive booking updates and exclusive offers
          </p>
          <Button asChild size="lg" className="rounded-full px-8">
            <Link to="/auth" state={{ returnTo: "/inbox" }}>Sign In</Link>
          </Button>
        </div>
      </MobileAppLayout>
    );
  }

  return (
    <MobileAppLayout onRefresh={handleRefresh}>
      <div className="min-h-screen bg-background flex flex-col pb-24">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background border-b border-border/50 px-4 py-4 safe-area-pt">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BackButton fallbackPath="/" />
              <div>
                <h1 className="text-2xl font-bold">Inbox</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
                </p>
              )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && activeTab !== 'ai' && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-9 text-xs font-medium"
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending}
                >
                  {markAllReadMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <CheckCheck className="h-4 w-4 mr-1" />
                  )}
                  Read all
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
                <Link to="/notifications">
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {/* Filter Pills with AI tab pinned first */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3">
            <button
              onClick={() => setActiveTab("ai")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === "ai"
                  ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI Assistant
            </button>
            {[
              { value: "all", label: "All", count: notifications.length },
              { value: "unread", label: "Unread", count: unreadCount },
              { value: "booking", label: "Bookings" },
              { value: "promo", label: "Promos" },
              { value: "message", label: "Messages" },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveTab(filter.value)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === filter.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                {filter.label}
                {filter.count !== undefined && filter.count > 0 && (
                  <span className={`text-xs ${
                    activeTab === filter.value ? "opacity-80" : "text-muted-foreground"
                  }`}>
                    ({filter.count})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* AI Assistant Tab */}
          {activeTab === "ai" && (
            <div className="flex-1 flex flex-col px-4 pb-4">
              <ScrollArea className="flex-1 max-h-[calc(100vh-280px)]" ref={aiScrollRef}>
                <div className="py-4 space-y-4">
                  {aiMessages.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <Bot className="h-8 w-8 text-primary" />
                      </div>
                      <p className="text-lg font-semibold text-foreground">Hi, how can I help?</p>
                      <p className="text-sm mt-2 max-w-[280px] mx-auto">
                        Ask me about buses, events, venues, transfers, or travel tips
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center mt-5">
                        {[
                          'Buses to Bulawayo',
                          'Events this weekend',
                          'Book a transfer',
                          'Victoria Falls tours',
                        ].map(suggestion => (
                          <Button
                            key={suggestion}
                            variant="outline"
                            size="sm"
                            onClick={() => setAiInput(suggestion)}
                            className="text-xs rounded-full h-8"
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {aiMessages.map((message, i) => (
                    <div
                      key={i}
                      className={`flex gap-2.5 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      </div>
                      {message.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                          <UserIcon className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}

                  {aiLoading && aiMessages[aiMessages.length - 1]?.role !== 'assistant' && (
                    <div className="flex gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Loader2 className="h-4 w-4 text-primary animate-spin" />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5">
                        <p className="text-sm text-muted-foreground">Thinking...</p>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <form onSubmit={handleAiSubmit} className="flex gap-2 pt-3 border-t border-border/50">
                <Input
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  placeholder="Ask anything..."
                  disabled={aiLoading}
                  className="flex-1 h-12 rounded-2xl bg-muted/50"
                />
                <Button 
                  type="submit" 
                  disabled={aiLoading || !aiInput.trim()} 
                  size="icon" 
                  className="h-12 w-12 rounded-2xl shrink-0"
                >
                  {aiLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* Notifications Tabs */}
          {activeTab !== "ai" && (
            <div className="px-4 pb-4">
              <div className="space-y-3">
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-28 rounded-2xl" />
                  ))
                ) : (
                  <AnimatePresence mode="popLayout">
                    {filteredNotifications.length > 0 ? (
                      filteredNotifications.map(notification => (
                        <NotificationCard key={notification.id} notification={notification} />
                      ))
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-16 text-center"
                      >
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                          <Bell className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">All caught up!</h3>
                        <p className="text-sm text-muted-foreground">
                          No notifications to show
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </MobileAppLayout>
  );
};

export default Inbox;
