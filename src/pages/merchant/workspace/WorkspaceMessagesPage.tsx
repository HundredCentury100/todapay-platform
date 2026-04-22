import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MessageSquare, Send, Plus, User, Settings2 } from "lucide-react";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Message {
  id: string;
  booking_id: string;
  workspace_id: string;
  sender_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  bookingId: string;
  guestName: string;
  workspaceName: string;
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

const WorkspaceMessagesPage = () => {
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
    
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id, name')
      .eq('merchant_profile_id', merchantProfile.id);

    if (!workspaces || workspaces.length === 0) { setLoading(false); return; }

    const wsIds = workspaces.map(w => w.id);
    const wsMap = new Map(workspaces.map(w => [w.id, w.name]));

    // Get workspace bookings
    const { data: wsBookings } = await supabase
      .from('workspace_bookings')
      .select('booking_id, workspace_id, booking:bookings(id, passenger_name)')
      .in('workspace_id', wsIds);

    if (!wsBookings || wsBookings.length === 0) { setLoading(false); return; }

    const bookingMap = new Map<string, { guestName: string; workspaceName: string }>();
    wsBookings.forEach(wb => {
      bookingMap.set(wb.booking_id, {
        guestName: (wb.booking as any)?.passenger_name || 'Guest',
        workspaceName: wsMap.get(wb.workspace_id) || 'Workspace',
      });
    });

    // For now, show empty conversations since workspace messages table doesn't exist yet
    // This is a placeholder that will show "No messages yet"
    setConversations([]);
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
    if (!replyText.trim() || !selectedConversation) return;
    toast.info("Messaging coming soon");
    setReplyText("");
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
          <p className="text-muted-foreground">Communicate with workspace guests</p>
        </div>
        <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
          <Settings2 className="h-4 w-4 mr-2" />
          Templates
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 min-h-[500px]">
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
                  <p className="text-xs text-muted-foreground mt-1">Guest messages will appear here</p>
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
                    <p className="text-xs text-muted-foreground truncate">{conv.workspaceName}</p>
                    <p className="text-xs text-muted-foreground truncate mt-1">{conv.lastMessage}</p>
                  </button>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

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
                    <p className="text-xs text-muted-foreground">{selectedConversation.workspaceName}</p>
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
                  {templates.length > 0 && (
                    <div className="flex gap-2 mb-3 overflow-x-auto">
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
                placeholder="Template name (e.g., Wi-Fi Password)"
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

export default WorkspaceMessagesPage;
