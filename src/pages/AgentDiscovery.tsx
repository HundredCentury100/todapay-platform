import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, Star, Award, MapPin } from "lucide-react";
import { useState } from "react";
import BackButton from "@/components/BackButton";

export default function AgentDiscovery() {
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['public-agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('merchant_profiles')
        .select('*')
        .in('role', ['travel_agent', 'booking_agent'])
        .eq('verification_status', 'verified')
        .order('agent_tier', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.business_email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = tierFilter === 'all' || agent.agent_tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'bg-purple-500';
      case 'gold': return 'bg-yellow-500';
      case 'silver': return 'bg-gray-400';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <BackButton fallbackPath="/" className="mb-3" />
          <h1 className="text-4xl font-bold mb-2">Find a Travel Agent</h1>
          <p className="text-muted-foreground text-lg">
            Connect with verified travel agents to help plan your journey
          </p>
        </div>

        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Search agents by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="platinum">Platinum</SelectItem>
              <SelectItem value="gold">Gold</SelectItem>
              <SelectItem value="silver">Silver</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAgents.map((agent) => (
              <Card key={agent.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{agent.business_name}</CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-2">
                        <Badge variant="outline" className={agent.role === 'travel_agent' ? 'border-primary text-primary' : 'border-orange-500 text-orange-600'}>
                          {agent.role === 'travel_agent' ? 'Internal' : 'External'}
                        </Badge>
                        {agent.agent_code && (
                          <span className="font-mono text-xs">{agent.agent_code}</span>
                        )}
                      </CardDescription>
                    </div>
                    <Badge className={`${getTierColor(agent.agent_tier || 'standard')} capitalize`}>
                      <Award className="w-3 h-3 mr-1" />
                      {agent.agent_tier || 'standard'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium">
                      {agent.commission_rate}% Commission Rate
                    </span>
                  </div>

                  {agent.business_address && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{agent.business_address}</span>
                    </div>
                  )}

                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <a 
                        href={`mailto:${agent.business_email}`}
                        className="text-sm hover:underline"
                      >
                        {agent.business_email}
                      </a>
                    </div>
                    {agent.business_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <a 
                          href={`tel:${agent.business_phone}`}
                          className="text-sm hover:underline"
                        >
                          {agent.business_phone}
                        </a>
                      </div>
                    )}
                  </div>

                  <Button className="w-full mt-4" asChild>
                    <a href={`mailto:${agent.business_email}?subject=Booking Inquiry`}>
                      Contact Agent
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && filteredAgents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No agents found matching your criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
