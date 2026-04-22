import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Clock, Search, Megaphone } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const quickReplies = [
  { label: "Directions", text: "Thanks for reaching out! You can find directions to the venue on our event page under the 'Venue' tab. Let us know if you need anything else!" },
  { label: "Parking", text: "Parking is available at the venue. We recommend arriving 30 minutes early to secure a spot. Street parking is also available nearby." },
  { label: "Dress Code", text: "There's no strict dress code, but we recommend smart casual attire. Comfortable shoes are a must!" },
  { label: "Refund Policy", text: "Refund requests can be submitted up to 48 hours before the event. Please contact us with your booking reference for assistance." },
];

const EventMessagesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReply, setSelectedReply] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground">Communicate with your attendees</p>
      </div>

      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox" className="gap-1.5">
            <MessageSquare className="h-4 w-4" />
            Inbox
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="gap-1.5">
            <Megaphone className="h-4 w-4" />
            Broadcast
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5">
            <Clock className="h-4 w-4" />
            Quick Replies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No messages yet</h3>
              <p className="text-sm text-muted-foreground">
                When attendees reach out, their messages will appear here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="broadcast" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Event Update</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Send a message to all attendees of a specific event. Use this for schedule changes, weather advisories, or important announcements.
              </p>
              <Textarea
                placeholder="Type your broadcast message..."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                rows={4}
              />
              <Button disabled={!broadcastMessage.trim()}>
                <Send className="w-4 h-4 mr-2" />
                Send Broadcast
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Reply Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Pre-saved responses for common attendee questions. Click to copy.
              </p>
              <div className="space-y-3">
                {quickReplies.map((reply, i) => (
                  <Card
                    key={i}
                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(reply.text);
                      setSelectedReply(reply.label);
                      setTimeout(() => setSelectedReply(""), 2000);
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{reply.label}</Badge>
                      {selectedReply === reply.label && (
                        <Badge className="bg-green-500 text-white">Copied!</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{reply.text}</p>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventMessagesPage;
