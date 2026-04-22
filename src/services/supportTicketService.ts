import { supabase } from "@/integrations/supabase/client";

export interface SupportTicket {
  id: string;
  merchant_profile_id: string;
  ticket_number: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_merchant' | 'resolved' | 'closed';
  category: 'technical' | 'billing' | 'account' | 'feature_request' | 'other';
  assigned_to?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_admin_response: boolean;
  attachments?: any[];
  created_at: string;
}

export const createSupportTicket = async (data: {
  merchant_profile_id: string;
  subject: string;
  description: string;
  priority: string;
  category: string;
}) => {
  const { data: ticket, error } = await supabase
    .from('support_tickets')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return ticket;
};

export const getMerchantTickets = async (merchantProfileId: string) => {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('merchant_profile_id', merchantProfileId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as SupportTicket[];
};

export const getAllTickets = async (filters?: {
  status?: string;
  priority?: string;
  category?: string;
}) => {
  let query = supabase
    .from('support_tickets')
    .select(`
      *,
      merchant_profiles!inner(business_name, business_email)
    `)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.priority) {
    query = query.eq('priority', filters.priority);
  }
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const updateTicketStatus = async (ticketId: string, updates: {
  status?: string;
  assigned_to?: string;
  resolved_at?: string;
}) => {
  const { data, error } = await supabase
    .from('support_tickets')
    .update(updates)
    .eq('id', ticketId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getTicketMessages = async (ticketId: string) => {
  const { data, error } = await supabase
    .from('ticket_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as TicketMessage[];
};

export const addTicketMessage = async (data: {
  ticket_id: string;
  user_id: string;
  message: string;
  is_admin_response: boolean;
}) => {
  const { data: message, error } = await supabase
    .from('ticket_messages')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return message;
};
