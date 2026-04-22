import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send, Search, Clock, Megaphone } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const QUICK_REPLIES = [
  "Thank you for choosing our venue! We'll confirm your booking shortly.",
  "Our venue includes complimentary WiFi, parking, and A/V equipment.",
  "Setup begins 2 hours before your event. Our team will be there to assist.",
  "Catering packages are available — we'll send you our menu options.",
];

const MOCK_MESSAGES = [
  { id: "1", guestName: "Corporate Events Co.", venue: "Grand Ballroom", message: "Can we extend the booking by 2 hours?", time: "1 hour ago", unread: true },
  { id: "2", guestName: "Sarah W.", venue: "Rooftop Terrace", message: "Is there covered seating available?", time: "3 hours ago", unread: true },
  { id: "3", guestName: "Wedding Planner", venue: "Garden Pavilion", message: "Thanks for the floor plan!", time: "1 day ago", unread: false },
];

const VenueMessagesPage = () => {
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Client Messages</h1>
        <p className="text-muted-foreground">Communicate with event organizers and clients</p>
      </div>

      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox" className="gap-2"><MessageSquare className="h-4 w-4" /> Inbox</TabsTrigger>
          <TabsTrigger value="templates" className="gap-2"><Clock className="h-4 w-4" /> Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="mt-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="md:col-span-1">
              <CardHeader className="pb-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search messages..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
              </CardHeader>
              <CardContent className="p-2 space-y-1">
                {MOCK_MESSAGES.map(msg => (
                  <button key={msg.id} onClick={() => setSelectedMessage(msg.id)} className={`w-full text-left p-3 rounded-lg transition-colors ${selectedMessage === msg.id ? "bg-primary/10" : "hover:bg-muted/50"}`}>
                    <div className="flex items-start gap-3">
                      <Avatar className="h-9 w-9"><AvatarFallback className="text-xs bg-primary/10 text-primary">{msg.guestName.charAt(0)}</AvatarFallback></Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{msg.guestName}</span>
                          {msg.unread && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{msg.venue}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{msg.message}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 text-right">{msg.time}</p>
                  </button>
                ))}
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardContent className="p-4 h-[500px] flex flex-col">
                {selectedMessage ? (
                  <>
                    <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                      <div className="flex justify-start">
                        <div className="bg-muted/50 rounded-xl rounded-tl-none px-4 py-2 max-w-[80%]">
                          <p className="text-sm">{MOCK_MESSAGES.find(m => m.id === selectedMessage)?.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{MOCK_MESSAGES.find(m => m.id === selectedMessage)?.time}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-1.5 flex-wrap">
                        {QUICK_REPLIES.slice(0, 3).map((r, i) => (
                          <Button key={i} variant="outline" size="sm" className="text-xs h-7" onClick={() => setReplyText(r)}>{r.slice(0, 30)}...</Button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input placeholder="Type a message..." value={replyText} onChange={(e) => setReplyText(e.target.value)} className="flex-1" />
                        <Button size="icon"><Send className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center"><MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>Select a conversation</p></div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Quick Reply Templates</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {QUICK_REPLIES.map((reply, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">{reply}</p>
                  <Button variant="ghost" size="sm">Edit</Button>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-2">+ Add Template</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VenueMessagesPage;
