import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Experience, ExperienceSchedule, DifficultyLevel, ExperienceType } from "@/types/experience";

// Transform database row to Experience type
const transformExperience = (row: any): Experience => ({
  id: row.id,
  merchant_profile_id: row.merchant_profile_id,
  name: row.name,
  description: row.description,
  experience_type: row.experience_type as ExperienceType,
  duration_hours: Number(row.duration_hours),
  location: row.location,
  meeting_point: row.meeting_point,
  city: row.city,
  country: row.country,
  latitude: row.latitude ? Number(row.latitude) : undefined,
  longitude: row.longitude ? Number(row.longitude) : undefined,
  max_participants: row.max_participants,
  min_participants: row.min_participants || 1,
  difficulty_level: row.difficulty_level as DifficultyLevel,
  age_restriction: row.age_restriction,
  what_included: row.what_included || [],
  what_to_bring: row.what_to_bring || [],
  languages: row.languages || ["English"],
  images: Array.isArray(row.images) ? row.images : (row.images ? [row.images] : []),
  price_per_person: Number(row.price_per_person),
  private_group_price: row.private_group_price ? Number(row.private_group_price) : undefined,
  cancellation_policy: row.cancellation_policy,
  status: row.status,
  created_at: row.created_at,
  updated_at: row.updated_at,
  // Computed fields - will be populated separately if needed
  review_score: row.review_score || 4.5 + Math.random() * 0.5, // Placeholder until reviews implemented
  review_count: row.review_count || Math.floor(Math.random() * 200) + 10,
});

// Mock experiences for demo when database is empty
const DEMO_EXPERIENCES: Experience[] = [
  {
    id: "demo-1",
    merchant_profile_id: "demo",
    name: "Victoria Falls Sunset Cruise",
    description: "Experience the magic of Victoria Falls from the water as the sun sets over the mighty Zambezi River.",
    experience_type: "nature",
    duration_hours: 3,
    location: "Zambezi River",
    meeting_point: "Victoria Falls Waterfront",
    city: "Victoria Falls",
    country: "Zimbabwe",
    max_participants: 20,
    min_participants: 2,
    difficulty_level: "easy",
    age_restriction: "All ages",
    what_included: ["Sunset cruise", "Drinks", "Snacks", "Guide", "Wildlife viewing"],
    what_to_bring: ["Camera", "Sunscreen", "Light jacket"],
    languages: ["English"],
    images: ["https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800"],
    price_per_person: 85,
    private_group_price: 600,
    cancellation_policy: "Free cancellation up to 24 hours before",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    review_score: 4.9,
    review_count: 234,
  },
  {
    id: "demo-2",
    merchant_profile_id: "demo",
    name: "Hwange National Park Safari",
    description: "Full-day safari through Zimbabwe's premier wildlife reserve, home to the Big Five.",
    experience_type: "nature",
    duration_hours: 8,
    location: "Hwange National Park",
    meeting_point: "Park Main Gate",
    city: "Hwange",
    country: "Zimbabwe",
    max_participants: 8,
    min_participants: 2,
    difficulty_level: "easy",
    what_included: ["4x4 Safari vehicle", "Expert guide", "Park fees", "Lunch", "Water"],
    what_to_bring: ["Binoculars", "Camera", "Hat", "Sunscreen"],
    languages: ["English"],
    images: ["https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800"],
    price_per_person: 180,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    review_score: 5.0,
    review_count: 445,
  },
  {
    id: "demo-3",
    merchant_profile_id: "demo",
    name: "Great Zimbabwe Ruins Tour",
    description: "Explore the ancient stone ruins of Great Zimbabwe, a UNESCO World Heritage Site.",
    experience_type: "cultural",
    duration_hours: 4,
    location: "Great Zimbabwe",
    meeting_point: "Visitor Center",
    city: "Masvingo",
    country: "Zimbabwe",
    max_participants: 15,
    min_participants: 2,
    difficulty_level: "easy",
    what_included: ["Guided tour", "Entry fees", "Water"],
    what_to_bring: ["Comfortable shoes", "Camera", "Hat"],
    languages: ["English", "Shona"],
    images: ["https://images.unsplash.com/photo-1569091791842-7cfb64e04797?w=800"],
    price_per_person: 45,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    review_score: 4.8,
    review_count: 189,
  },
  {
    id: "demo-4",
    merchant_profile_id: "demo",
    name: "Eastern Highlands Hiking",
    description: "Trek through the stunning Nyanga Mountains with breathtaking views.",
    experience_type: "adventure",
    duration_hours: 6,
    location: "Nyanga Mountains",
    meeting_point: "Nyanga Village",
    city: "Mutare",
    country: "Zimbabwe",
    max_participants: 10,
    min_participants: 2,
    difficulty_level: "challenging",
    what_included: ["Expert guide", "Lunch", "Water", "First aid"],
    what_to_bring: ["Hiking boots", "Rain jacket", "Snacks", "Water bottle"],
    languages: ["English"],
    images: ["https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800"],
    price_per_person: 55,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    review_score: 4.9,
    review_count: 156,
  },
  {
    id: "demo-5",
    merchant_profile_id: "demo",
    name: "Harare Street Food & Culture Walk",
    description: "Discover the vibrant food scene and cultural landmarks of Zimbabwe's capital.",
    experience_type: "food_drink",
    duration_hours: 3,
    location: "Harare CBD",
    meeting_point: "Africa Unity Square",
    city: "Harare",
    country: "Zimbabwe",
    max_participants: 12,
    min_participants: 2,
    difficulty_level: "easy",
    what_included: ["5 food tastings", "Drinks", "Local guide", "Market visit"],
    what_to_bring: ["Comfortable shoes", "Camera", "Appetite"],
    languages: ["English", "Shona"],
    images: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800"],
    price_per_person: 25,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    review_score: 4.7,
    review_count: 89,
  },
  {
    id: "demo-6",
    merchant_profile_id: "demo",
    name: "Mana Pools Canoe Safari",
    description: "Paddle through World Heritage waters alongside hippos and elephants.",
    experience_type: "water_sports",
    duration_hours: 5,
    location: "Mana Pools",
    meeting_point: "Chirundu Border Post",
    city: "Kariba",
    country: "Zimbabwe",
    max_participants: 8,
    min_participants: 2,
    difficulty_level: "moderate",
    what_included: ["Canoes", "Expert guide", "Lunch", "Park fees"],
    what_to_bring: ["Swimwear", "Sunscreen", "Camera in waterproof bag"],
    languages: ["English"],
    images: ["https://images.unsplash.com/photo-1560275619-4662e36fa65c?w=800"],
    price_per_person: 150,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    review_score: 4.9,
    review_count: 203,
  },
  {
    id: "demo-7",
    merchant_profile_id: "demo",
    name: "Matobo Hills Rock Art Tour",
    description: "Discover ancient San rock paintings in the mystical Matobo Hills.",
    experience_type: "cultural",
    duration_hours: 5,
    location: "Matobo National Park",
    meeting_point: "Park Gate",
    city: "Bulawayo",
    country: "Zimbabwe",
    max_participants: 12,
    min_participants: 2,
    difficulty_level: "moderate",
    what_included: ["Guided tour", "Park fees", "Rhino tracking opportunity"],
    what_to_bring: ["Comfortable shoes", "Binoculars", "Camera"],
    languages: ["English", "Ndebele"],
    images: ["https://images.unsplash.com/photo-1569091791842-7cfb64e04797?w=800"],
    price_per_person: 65,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    review_score: 4.8,
    review_count: 167,
  },
  {
    id: "demo-8",
    merchant_profile_id: "demo",
    name: "Bungee Jumping at Victoria Falls Bridge",
    description: "Take the ultimate leap from the iconic Victoria Falls Bridge - 111 meters of pure adrenaline!",
    experience_type: "adventure",
    duration_hours: 2,
    location: "Victoria Falls Bridge",
    meeting_point: "Bridge Activities Center",
    city: "Victoria Falls",
    country: "Zimbabwe",
    max_participants: 4,
    min_participants: 1,
    difficulty_level: "extreme",
    age_restriction: "18+ only",
    what_included: ["Jump", "Certificate", "Video recording", "Safety briefing"],
    what_to_bring: ["Closed shoes", "ID/Passport", "Courage"],
    languages: ["English"],
    images: ["https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800"],
    price_per_person: 160,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    review_score: 4.9,
    review_count: 312,
  },
];

// Generate demo schedules for the next 7 days
const generateDemoSchedules = (experienceId: string): ExperienceSchedule[] => {
  const schedules: ExperienceSchedule[] = [];
  const today = new Date();
  
  for (let i = 1; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    schedules.push({
      id: `schedule-${experienceId}-${i}`,
      experience_id: experienceId,
      date: date.toISOString().split('T')[0],
      start_time: "09:00",
      available_spots: Math.floor(Math.random() * 10) + 5,
      created_at: new Date().toISOString(),
    });
    
    // Add afternoon slot for some experiences
    if (Math.random() > 0.5) {
      schedules.push({
        id: `schedule-${experienceId}-${i}-pm`,
        experience_id: experienceId,
        date: date.toISOString().split('T')[0],
        start_time: "14:00",
        available_spots: Math.floor(Math.random() * 8) + 3,
        created_at: new Date().toISOString(),
      });
    }
  }
  
  return schedules;
};

interface UseExperiencesOptions {
  city?: string;
  experienceType?: ExperienceType[];
  difficulty?: DifficultyLevel[];
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export const useExperiences = (options: UseExperiencesOptions = {}) => {
  return useQuery({
    queryKey: ['experiences', options],
    queryFn: async () => {
      let query = supabase
        .from('experiences')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (options.city) {
        query = query.ilike('city', `%${options.city}%`);
      }
      
      if (options.experienceType && options.experienceType.length > 0) {
        query = query.in('experience_type', options.experienceType);
      }
      
      if (options.difficulty && options.difficulty.length > 0) {
        query = query.in('difficulty_level', options.difficulty);
      }
      
      if (options.minPrice !== undefined) {
        query = query.gte('price_per_person', options.minPrice);
      }
      
      if (options.maxPrice !== undefined) {
        query = query.lte('price_per_person', options.maxPrice);
      }
      
      if (options.search) {
        query = query.or(`name.ilike.%${options.search}%,city.ilike.%${options.search}%,description.ilike.%${options.search}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // If no real data, return demo experiences
      if (!data || data.length === 0) {
        let filtered = [...DEMO_EXPERIENCES];
        
        if (options.search) {
          const searchLower = options.search.toLowerCase();
          filtered = filtered.filter(e => 
            e.name.toLowerCase().includes(searchLower) ||
            e.city.toLowerCase().includes(searchLower) ||
            e.description?.toLowerCase().includes(searchLower)
          );
        }
        
        if (options.experienceType && options.experienceType.length > 0) {
          filtered = filtered.filter(e => options.experienceType!.includes(e.experience_type));
        }
        
        if (options.difficulty && options.difficulty.length > 0) {
          filtered = filtered.filter(e => e.difficulty_level && options.difficulty!.includes(e.difficulty_level));
        }
        
        if (options.minPrice !== undefined) {
          filtered = filtered.filter(e => e.price_per_person >= options.minPrice!);
        }
        
        if (options.maxPrice !== undefined) {
          filtered = filtered.filter(e => e.price_per_person <= options.maxPrice!);
        }
        
        return filtered;
      }
      
      return data.map(transformExperience);
    },
  });
};

export const useExperience = (id: string) => {
  return useQuery({
    queryKey: ['experience', id],
    queryFn: async () => {
      // Check if it's a demo ID
      if (id.startsWith('demo-')) {
        const demoExp = DEMO_EXPERIENCES.find(e => e.id === id);
        if (demoExp) {
          return {
            ...demoExp,
            schedules: generateDemoSchedules(id),
          };
        }
      }
      
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        // Fallback to demo experience
        const demoExp = DEMO_EXPERIENCES[0];
        return {
          ...demoExp,
          id,
          schedules: generateDemoSchedules(id),
        };
      }
      
      const experience = transformExperience(data);
      
      // Fetch schedules
      const { data: schedulesData } = await supabase
        .from('experience_schedules')
        .select('*')
        .eq('experience_id', id)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });
      
      const schedules: ExperienceSchedule[] = schedulesData?.map(s => ({
        id: s.id,
        experience_id: s.experience_id,
        date: s.date,
        start_time: s.start_time,
        available_spots: s.available_spots,
        price_override: s.price_override ? Number(s.price_override) : undefined,
        guide_assigned: s.guide_assigned,
        created_at: s.created_at,
      })) || generateDemoSchedules(id);
      
      return {
        ...experience,
        schedules,
      };
    },
    enabled: !!id,
  });
};

export { DEMO_EXPERIENCES };
