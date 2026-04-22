import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { 
  getRideMessages, 
  sendRideMessage, 
  markMessagesAsRead,
  QUICK_REPLIES,
  type RideMessage 
} from "@/services/rideChatService";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface RideChatProps {
  rideId: string;
  driverName?: string;
  driverPhoto?: string;
  senderType: 'passenger' | 'driver';
  isOpen: boolean;
  onClose: () => void;
}

export const RideChat = ({
  rideId,
  driverName,
  driverPhoto,
  senderType,
  isOpen,
  onClose,
}: RideChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<RideMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && rideId) {
      loadMessages();
      setupRealtime();
    }
  }, [isOpen, rideId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    const data = await getRideMessages(rideId);
    setMessages(data);
    
    if (user?.id) {
      await markMessagesAsRead(rideId, user.id);
    }
  };

  const setupRealtime = () => {
    const channel = supabase
      .channel(`ride-chat-${rideId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ride_messages',
          filter: `ride_id=eq.${rideId}`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as RideMessage]);
          if (user?.id) {
            markMessagesAsRead(rideId, user.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendRideMessage(rideId, newMessage.trim(), senderType);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickReply = async (reply: string) => {
    if (isSending) return;
    setIsSending(true);
    try {
      await sendRideMessage(rideId, reply, senderType, 'quick_reply');
    } catch (error) {
      console.error("Error sending quick reply:", error);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Card className="fixed inset-x-4 bottom-4 top-20 z-50 flex flex-col shadow-2xl md:inset-auto md:right-4 md:bottom-4 md:w-96 md:h-[500px]">
      <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between pb-3 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={driverPhoto} />
            <AvatarFallback>
              {driverName?.charAt(0) || 'D'}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-base">{driverName || 'Driver'}</CardTitle>
            <p className="text-xs text-muted-foreground">In-ride chat</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages */}
        <ScrollArea ref={scrollRef} className="flex-1 p-4">
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs">Send a message to your {senderType === 'passenger' ? 'driver' : 'passenger'}</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.sender_type === senderType;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                        isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {format(new Date(msg.created_at), 'p')}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Quick Replies */}
        <div className="px-4 py-2 border-t bg-muted/30">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {QUICK_REPLIES.map((reply) => (
              <Button
                key={reply}
                variant="outline"
                size="sm"
                className="flex-shrink-0 text-xs"
                onClick={() => handleQuickReply(reply)}
                disabled={isSending}
              >
                {reply}
              </Button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isSending}
            />
            <Button 
              size="icon" 
              onClick={handleSend}
              disabled={!newMessage.trim() || isSending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RideChat;
