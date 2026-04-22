import { supabase } from "@/integrations/supabase/client";
import { MerchantProfile } from "@/types/merchant";
import { ServiceType, AdminServiceAction } from "@/types/fundCollection";

/**
 * Admin Service Management
 * Allows super admins to create and manage services on behalf of merchants
 */

// Get all verified merchants for selection
export const getVerifiedMerchants = async () => {
  const { data, error } = await supabase
    .from('merchant_profiles')
    .select('id, business_name, business_email, role, verification_status')
    .eq('verification_status', 'verified')
    .order('business_name');

  if (error) throw error;
  return data as Pick<MerchantProfile, 'id' | 'business_name' | 'business_email' | 'role' | 'verification_status'>[];
};

// Log admin service action
export const logAdminServiceAction = async (
  adminId: string,
  merchantProfileId: string,
  serviceType: ServiceType,
  serviceId: string,
  actionType: 'create' | 'update' | 'delete',
  actionReason?: string,
  previousData?: Record<string, any>,
  newData?: Record<string, any>
) => {
  const { data, error } = await supabase
    .rpc('log_admin_service_action', {
      p_admin_id: adminId,
      p_merchant_profile_id: merchantProfileId,
      p_service_type: serviceType,
      p_service_id: serviceId,
      p_action_type: actionType,
      p_action_reason: actionReason || null,
      p_previous_data: previousData || null,
      p_new_data: newData || null
    });

  if (error) throw error;
  return data as string;
};

// Get admin service action logs
export const getAdminServiceActions = async (filters?: {
  merchantProfileId?: string;
  serviceType?: ServiceType;
  adminId?: string;
  limit?: number;
}) => {
  let query = supabase
    .from('admin_service_actions')
    .select(`
      *,
      merchant_profile:merchant_profiles(business_name)
    `)
    .order('created_at', { ascending: false });

  if (filters?.merchantProfileId) {
    query = query.eq('merchant_profile_id', filters.merchantProfileId);
  }
  if (filters?.serviceType) {
    query = query.eq('service_type', filters.serviceType);
  }
  if (filters?.adminId) {
    query = query.eq('admin_id', filters.adminId);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as AdminServiceAction[];
};

// === BUS SCHEDULE MANAGEMENT ===
// Note: bus_schedules links to buses table, which links to operator_associations for merchant

export const createBusScheduleForMerchant = async (
  adminId: string,
  merchantProfileId: string,
  busId: string,
  scheduleData: {
    from_location: string;
    to_location: string;
    departure_time: string;
    arrival_time: string;
    available_date: string;
    base_price: number;
    duration: string;
    stops?: string[];
    pickup_address?: string;
    dropoff_address?: string;
  },
  actionReason?: string
) => {
  const { data: schedule, error } = await supabase
    .from('bus_schedules')
    .insert({
      bus_id: busId,
      ...scheduleData,
      created_by_admin_id: adminId,
    })
    .select()
    .single();

  if (error) throw error;

  // Log the action
  await logAdminServiceAction(
    adminId,
    merchantProfileId,
    'bus_schedule',
    schedule.id,
    'create',
    actionReason,
    undefined,
    scheduleData
  );

  return schedule;
};

// === EVENT MANAGEMENT ===
// Note: events table uses organizer and organizer_code, not merchant_profile_id

export const createEventForMerchant = async (
  adminId: string,
  merchantProfileId: string,
  merchantData: { business_name: string; },
  eventData: {
    name: string;
    description: string;
    type: string;
    event_date: string;
    event_time: string;
    venue: string;
    location: string;
    image?: string;
  },
  actionReason?: string
) => {
  const { data: event, error } = await supabase
    .from('events')
    .insert({
      ...eventData,
      organizer: merchantData.business_name,
      created_by_admin_id: adminId,
    })
    .select()
    .single();

  if (error) throw error;

  await logAdminServiceAction(
    adminId,
    merchantProfileId,
    'event',
    event.id,
    'create',
    actionReason,
    undefined,
    eventData
  );

  return event;
};

// === VENUE MANAGEMENT ===

export const createVenueForMerchant = async (
  adminId: string,
  merchantProfileId: string,
  venueData: {
    name: string;
    description?: string;
    venue_type: string;
    address: string;
    city: string;
    country: string;
    capacity_standing?: number;
    hourly_rate?: number;
    full_day_rate?: number;
    amenities?: string[];
  },
  actionReason?: string
) => {
  const { data: venue, error } = await supabase
    .from('venues')
    .insert({
      merchant_profile_id: merchantProfileId,
      ...venueData,
      created_by_admin_id: adminId,
    })
    .select()
    .single();

  if (error) throw error;

  await logAdminServiceAction(
    adminId,
    merchantProfileId,
    'venue',
    venue.id,
    'create',
    actionReason,
    undefined,
    venueData
  );

  return venue;
};

// === PROPERTY MANAGEMENT ===

export const createPropertyForMerchant = async (
  adminId: string,
  merchantProfileId: string,
  propertyData: {
    name: string;
    description?: string;
    property_type: string;
    address: string;
    city: string;
    country: string;
    star_rating?: number;
    amenities?: string[];
    check_in_time?: string;
    check_out_time?: string;
  },
  actionReason?: string
) => {
  const { data: property, error } = await supabase
    .from('properties')
    .insert({
      merchant_profile_id: merchantProfileId,
      ...propertyData,
      created_by_admin_id: adminId,
    })
    .select()
    .single();

  if (error) throw error;

  await logAdminServiceAction(
    adminId,
    merchantProfileId,
    'property',
    property.id,
    'create',
    actionReason,
    undefined,
    propertyData
  );

  return property;
};

// === WORKSPACE MANAGEMENT ===

export const createWorkspaceForMerchant = async (
  adminId: string,
  merchantProfileId: string,
  workspaceData: {
    name: string;
    description?: string;
    workspace_type: string;
    address: string;
    city: string;
    country: string;
    capacity: number;
    hourly_rate?: number;
    daily_rate?: number;
    amenities?: string[];
  },
  actionReason?: string
) => {
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .insert({
      merchant_profile_id: merchantProfileId,
      ...workspaceData,
      created_by_admin_id: adminId,
    })
    .select()
    .single();

  if (error) throw error;

  await logAdminServiceAction(
    adminId,
    merchantProfileId,
    'workspace',
    workspace.id,
    'create',
    actionReason,
    undefined,
    workspaceData
  );

  return workspace;
};

// === EXPERIENCE MANAGEMENT ===

export const createExperienceForMerchant = async (
  adminId: string,
  merchantProfileId: string,
  experienceData: {
    name: string;
    description?: string;
    experience_type: string;
    duration_hours: number;
    price_per_person: number;
    max_participants: number;
    location: string;
    city: string;
    country: string;
    what_included?: string[];
  },
  actionReason?: string
) => {
  const { data: experience, error } = await supabase
    .from('experiences')
    .insert({
      merchant_profile_id: merchantProfileId,
      ...experienceData,
      created_by_admin_id: adminId,
    })
    .select()
    .single();

  if (error) throw error;

  await logAdminServiceAction(
    adminId,
    merchantProfileId,
    'experience',
    experience.id,
    'create',
    actionReason,
    undefined,
    experienceData
  );

  return experience;
};

// === VEHICLE MANAGEMENT ===

export const createVehicleForMerchant = async (
  adminId: string,
  merchantProfileId: string,
  vehicleData: {
    name: string;
    make: string;
    model: string;
    year?: number;
    vehicle_type: string;
    seats: number;
    doors: number;
    transmission: string;
    fuel_type: string;
    daily_rate: number;
    features?: string[];
  },
  actionReason?: string
) => {
  const { data: vehicle, error } = await supabase
    .from('vehicles')
    .insert({
      merchant_profile_id: merchantProfileId,
      ...vehicleData,
      created_by_admin_id: adminId,
    })
    .select()
    .single();

  if (error) throw error;

  await logAdminServiceAction(
    adminId,
    merchantProfileId,
    'vehicle',
    vehicle.id,
    'create',
    actionReason,
    undefined,
    vehicleData
  );

  return vehicle;
};

// Get services created by admin for a merchant
export const getAdminCreatedServices = async (
  merchantProfileId: string,
  serviceType?: ServiceType
) => {
  const actions = await getAdminServiceActions({
    merchantProfileId,
    serviceType,
    limit: 100,
  });

  return actions.filter(a => a.action_type === 'create');
};

// Get merchant by ID with fund collection settings
export const getMerchantWithFundSettings = async (merchantId: string) => {
  const { data, error } = await supabase
    .from('merchant_profiles')
    .select('*')
    .eq('id', merchantId)
    .single();

  if (error) throw error;
  return data;
};

// Update merchant fund collection settings
export const updateMerchantFundSettings = async (
  merchantId: string,
  settings: {
    fund_collection_model?: 'platform_first' | 'merchant_collects' | 'escrow';
    escrow_release_days?: number;
    auto_payout_enabled?: boolean;
    payout_frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    payout_method?: string;
    payout_details?: Record<string, any>;
  }
) => {
  const { data, error } = await supabase
    .from('merchant_profiles')
    .update(settings)
    .eq('id', merchantId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
