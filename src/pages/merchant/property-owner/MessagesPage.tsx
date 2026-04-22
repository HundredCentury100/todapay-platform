import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MessageSquare, Send, Plus, Clock, User, Settings2 } from "lucide-react";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Message {
  id: string;
  booking_id: string;
  property_id: string;
  sender_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  bookingId: string;
  guestName: string;
  propertyName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  messages: Message[];
}

interface Template {
  id: string;
  name: string;
  message: string;
  template_type: string;
  is_active: boolean;
}

const MessagesPage = () => {
  const { merchantProfile } = useMerchantAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [replyText, setReplyText] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateMessage, setNewTemplateMessage] = useState("");

  useEffect(() => {
    if (merchantProfile?.id) {
      fetchConversations();
      fetchTemplates();
    }
  }, [merchantProfile?.id]);

  const fetchConversations = async () => {
    if (!merchantProfile?.id) return;
    
    // Get properties for this merchant
    const { data: props } = await supabase
      .from('properties')
      .select('id, name')
      .eq('merchant_profile_id', merchantProfile.id);

    if (!props || props.length === 0) { setLoading(false); return; }

    const propIds = props.map(p => p.id);
    const propMap = new Map(props.map(p => [p.id, p.name]));

    // Get messages
    const { data: messages } = await supabase
      .from('host_messages')
      .select('*')
      .in('property_id', propIds)
      .order('created_at', { ascending: false });

    if (!messages) { setLoading(false); return; }

    // Get booking info
    const bookingIds = [...new Set(messages.map(m => m.booking_id))];
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, passenger_name')
      .in('id', bookingIds.length > 0 ? bookingIds : ['']);

    const bookingMap = new Map(bookings?.map(b => [b.id, b.passenger_name]) || []);

    // Group by booking
    const grouped = new Map<string, Message[]>();
    messages.forEach(m => {
      if (!grouped.has(m.booking_id)) grouped.set(m.booking_id, []);
      grouped.get(m.booking_id)!.push(m as Message);
    });

    const convs: Conversation[] = Array.from(grouped.entries()).map(([bookingId, msgs]) => {
      const sorted = msgs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return {
        bookingId,
        guestName: bookingMap.get(bookingId) || 'Guest',
        propertyName: propMap.get(sorted[0]?.property_id as any) || 'Property',
        lastMessage: sorted[0]?.message || '',
        lastMessageAt: sorted[0]?.created_at || '',
        unreadCount: sorted.filter(m => !m.is_read && m.sender_type === 'guest').length,
        messages: msgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
      };
    });

    setConversations(convs);
    setLoading(false);
  };

  const fetchTemplates = async () => {
    if (!merchantProfile?.id) return;
    const { data } = await supabase
      .from('host_message_templates')
      .select('*')
      .eq('merchant_profile_id', merchantProfile.id);
    if (data) setTemplates(data as Template[]);
  };

  const handleSendMessage = async () => {
    if (!replyText.trim() || !selectedConversation || !merchantProfile?.id) return;

    const firstMsg = selectedConversation.messages[0];
    const { error } = await supabase.from('host_messages').insert({
      booking_id: selectedConversation.bookingId,
      property_id: (firstMsg as any).property_id,
      sender_type: 'host',
      sender_id: merchantProfile.id,
      message: replyText,
    } as any);

    if (error) {
      toast.error("Failed to send message");
    } else {
      toast.success("Message sent");
      setReplyText("");
      fetchConversations();
    }
  };

  const handleAddTemplate = async () => {
    if (!newTemplateName || !newTemplateMessage || !merchantProfile?.id) return;
    const { error } = await supabase.from('host_message_templates').insert({
      merchant_profile_id: merchantProfile.id,
      name: newTemplateName,
      message: newTemplateMessage,
      template_type: 'manual',
    } as any);

    if (error) {
      toast.error("Failed to save template");
    } else {
      toast.success("Template saved");
      setNewTemplateName("");
      setNewTemplateMessage("");
      fetchTemplates();
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">Communicate with your guests</p>
        </div>
        <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
          <Settings2 className="h-4 w-4 mr-2" />
          Templates
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 min-h-[500px]">
        {/* Conversation List */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Conversations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {conversations.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No messages yet</p>
                </div>
              ) : (
                conversations.map(conv => (
                  <button
                    key={conv.bookingId}
                    className={`w-full text-left p-4 border-b hover:bg-muted/50 transition-colors ${
                      selectedConversation?.bookingId === conv.bookingId ? 'bg-muted/50' : ''
                    }`}
                    onClick={() => setSelectedConversation(conv)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{conv.guestName}</span>
                      {conv.unreadCount > 0 && (
                        <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{conv.propertyName}</p>
                    <p className="text-xs text-muted-foreground truncate mt-1">{conv.lastMessage}</p>
                  </button>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Message Thread */}
        <Card className="md:col-span-2">
          {selectedConversation ? (
            <>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{selectedConversation.guestName}</CardTitle>
                    <p className="text-xs text-muted-foreground">{selectedConversation.propertyName}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex flex-col h-[440px]">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {selectedConversation.messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_type === 'host' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                          msg.sender_type === 'host'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}>
                          <p className="text-sm">{msg.message}</p>
                          <p className={`text-xs mt-1 ${
                            msg.sender_type === 'host' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}>
                            {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t">
                  {/* Quick reply templates */}
                  {templates.length > 0 && (
                    <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
                      {templates.filter(t => t.is_active).map(t => (
                        <Button
                          key={t.id}
                          variant="outline"
                          size="sm"
                          className="text-xs whitespace-nowrap flex-shrink-0"
                          onClick={() => setReplyText(t.message)}
                        >
                          {t.name}
                        </Button>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage} disabled={!replyText.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-[500px]">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Select a conversation to view messages</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Templates Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Reply Templates</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {templates.map(t => (
              <div key={t.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{t.name}</span>
                  <Badge variant="outline" className="text-xs capitalize">{t.template_type}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{t.message}</p>
              </div>
            ))}
            <Separator />
            <div className="space-y-3">
              <Label className="text-sm font-medium">Add New Template</Label>
              <Input
                placeholder="Template name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
              />
              <Textarea
                placeholder="Template message"
                value={newTemplateMessage}
                onChange={(e) => setNewTemplateMessage(e.target.value)}
                rows={3}
              />
              <Button onClick={handleAddTemplate} className="w-full" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessagesPage;
