import { supabase } from "@/integrations/supabase/client";
import { WorkspaceType, WorkspaceBookingType } from "@/types/workspace";

export interface WorkspaceSearchParams {
  city?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  workspaceType?: WorkspaceType[];
  capacity?: number;
  amenities?: string[];
  bookingType?: WorkspaceBookingType;
}

export interface WorkspaceData {
  id: string;
  merchant_profile_id: string;
  name: string;
  description: string | null;
  workspace_type: WorkspaceType;
  address: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  capacity: number;
  amenities: string[];
  images: string[];
  hourly_rate: number | null;
  daily_rate: number | null;
  weekly_rate: number | null;
  monthly_rate: number | null;
  operating_hours: Record<string, { open: string; close: string }>;
  status: string;
  created_at: string;
  updated_at: string;
}

const mapWorkspaceData = (w: any): WorkspaceData => ({
  ...w,
  workspace_type: w.workspace_type as WorkspaceType,
  images: Array.isArray(w.images) ? w.images as string[] : [],
  amenities: Array.isArray(w.amenities) ? w.amenities as string[] : [],
  operating_hours: w.operating_hours as Record<string, { open: string; close: string }> || {},
});

export const getWorkspaces = async (params: WorkspaceSearchParams): Promise<WorkspaceData[]> => {
  let query = supabase
    .from("workspaces")
    .select("*")
    .eq("status", "active");

  if (params.city) {
    query = query.ilike("city", `%${params.city}%`);
  }

  if (params.workspaceType && params.workspaceType.length > 0) {
    query = query.in("workspace_type", params.workspaceType);
  }

  if (params.capacity) {
    query = query.gte("capacity", params.capacity);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching workspaces:", error);
    throw error;
  }

  return (data || []).map(mapWorkspaceData);
};

export const getWorkspaceById = async (id: string): Promise<WorkspaceData | null> => {
  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching workspace:", error);
    return null;
  }

  return mapWorkspaceData(data);
};

export const getFeaturedWorkspaces = async (limit = 6): Promise<WorkspaceData[]> => {
  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("status", "active")
    .limit(limit);

  if (error) {
    console.error("Error fetching featured workspaces:", error);
    return [];
  }

  return (data || []).map(mapWorkspaceData);
};

export const getWorkspaceAvailability = async (workspaceId: string, date: string) => {
  const { data, error } = await supabase
    .from("workspace_availability")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("date", date);

  if (error) {
    console.error("Error fetching availability:", error);
    return [];
  }

  return data || [];
};

export const createWorkspaceBooking = async (bookingData: {
  userId: string | null;
  workspaceId: string;
  workspaceName: string;
  startDatetime: string;
  endDatetime: string;
  bookingType: WorkspaceBookingType;
  numAttendees: number;
  equipment: Array<{ id: string; name: string; quantity: number; price: number }>;
  catering: Array<{ id: string; name: string; quantity: number; price: number }>;
  totalPrice: number;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
}) => {
  // Create main booking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      user_id: bookingData.userId,
      booking_type: "workspace",
      item_id: bookingData.workspaceId,
      item_name: bookingData.workspaceName,
      passenger_name: bookingData.passengerName,
      passenger_email: bookingData.passengerEmail,
      passenger_phone: bookingData.passengerPhone,
      guest_email: bookingData.passengerEmail,
      base_price: bookingData.totalPrice,
      total_price: bookingData.totalPrice,
      ticket_number: `WS-${Date.now()}`,
      status: "confirmed",
      payment_status: "pending",
      vertical: "workspace",
    })
    .select()
    .single();

  if (bookingError) {
    console.error("Error creating booking:", bookingError);
    throw bookingError;
  }

  // Create workspace booking details
  const { error: wsBookingError } = await supabase
    .from("workspace_bookings")
    .insert({
      booking_id: booking.id,
      workspace_id: bookingData.workspaceId,
      start_datetime: bookingData.startDatetime,
      end_datetime: bookingData.endDatetime,
      booking_type: bookingData.bookingType,
      num_attendees: bookingData.numAttendees,
      equipment_requested: bookingData.equipment,
      catering_requested: bookingData.catering,
    });

  if (wsBookingError) {
    console.error("Error creating workspace booking:", wsBookingError);
    throw wsBookingError;
  }

  return booking;
};

// Merchant functions
export const getMerchantWorkspaces = async (merchantProfileId: string): Promise<WorkspaceData[]> => {
  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("merchant_profile_id", merchantProfileId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching merchant workspaces:", error);
    throw error;
  }

  return (data || []).map(mapWorkspaceData);
};

export const createWorkspace = async (workspace: Omit<WorkspaceData, "id" | "created_at" | "updated_at">) => {
  const { data, error } = await supabase
    .from("workspaces")
    .insert(workspace)
    .select()
    .single();

  if (error) {
    console.error("Error creating workspace:", error);
    throw error;
  }

  return data;
};

export const updateWorkspace = async (id: string, workspace: Partial<WorkspaceData>) => {
  const { data, error } = await supabase
    .from("workspaces")
    .update(workspace)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating workspace:", error);
    throw error;
  }

  return data;
};

export const deleteWorkspace = async (id: string) => {
  const { error } = await supabase
    .from("workspaces")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting workspace:", error);
    throw error;
  }
};

export const getWorkspaceBookings = async (merchantProfileId: string) => {
  const { data, error } = await supabase
    .from("workspace_bookings")
    .select(`
      *,
      workspace:workspaces!workspace_id(*),
      booking:bookings!booking_id(*)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching workspace bookings:", error);
    throw error;
  }

  // Filter by merchant
  return (data || []).filter((b: any) => b.workspace?.merchant_profile_id === merchantProfileId);
};

export const getWorkspaceStats = async (merchantProfileId: string) => {
  const workspaces = await getMerchantWorkspaces(merchantProfileId);
  const bookings = await getWorkspaceBookings(merchantProfileId);

  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const activeBookings = bookings.filter((b: any) => 
    new Date(b.start_datetime) <= now && new Date(b.end_datetime) >= now
  );

  const monthlyBookings = bookings.filter((b: any) => 
    new Date(b.created_at) >= thisMonth
  );

  const monthlyRevenue = monthlyBookings.reduce((sum: number, b: any) => 
    sum + (b.booking?.total_price || 0), 0
  );

  return {
    totalWorkspaces: workspaces.length,
    activeBookings: activeBookings.length,
    monthlyRevenue,
    totalBookings: bookings.length,
  };
};

// Favorites
export const getFavoriteWorkspaces = async (userId: string) => {
  const { data, error } = await supabase
    .from("favorite_workspaces")
    .select(`
      *,
      workspace:workspaces(*)
    `)
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching favorites:", error);
    return [];
  }

  return data || [];
};

export const addFavoriteWorkspace = async (userId: string, workspaceId: string) => {
  const { error } = await supabase
    .from("favorite_workspaces")
    .insert({ user_id: userId, workspace_id: workspaceId });

  if (error) {
    console.error("Error adding favorite:", error);
    throw error;
  }
};

export const removeFavoriteWorkspace = async (userId: string, workspaceId: string) => {
  const { error } = await supabase
    .from("favorite_workspaces")
    .delete()
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId);

  if (error) {
    console.error("Error removing favorite:", error);
    throw error;
  }
};

export const isFavoriteWorkspace = async (userId: string, workspaceId: string) => {
  const { data, error } = await supabase
    .from("favorite_workspaces")
    .select("id")
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) {
    console.error("Error checking favorite:", error);
    return false;
  }

  return !!data;
};

// Reviews
export const getWorkspaceReviews = async (workspaceId: string) => {
  const { data, error } = await supabase
    .from("workspace_reviews")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }

  return data || [];
};

export const createWorkspaceReview = async (review: {
  workspace_id: string;
  user_id: string;
  booking_id?: string;
  rating: number;
  title: string;
  comment: string;
}) => {
  const { data, error } = await supabase
    .from("workspace_reviews")
    .insert(review)
    .select()
    .single();

  if (error) {
    console.error("Error creating review:", error);
    throw error;
  }

  return data;
};
