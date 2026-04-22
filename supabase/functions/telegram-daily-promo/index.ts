import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";
const APP_URL = "https://fulticket.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendTelegramPhoto(chatId: number, caption: string, photoUrl: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
  const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY")!;
  const headers = {
    "Authorization": `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": TELEGRAM_API_KEY,
    "Content-Type": "application/json",
  };

  const res = await fetch(`${GATEWAY_URL}/sendPhoto`, {
    method: "POST",
    headers,
    body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption: caption.slice(0, 1024), parse_mode: "HTML" }),
  });
  if (!res.ok) console.error(`sendPhoto failed for ${chatId}:`, await res.text());
  return res;
}

async function sendTelegramVideo(chatId: number, caption: string, videoUrl: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
  const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY")!;
  const headers = {
    "Authorization": `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": TELEGRAM_API_KEY,
    "Content-Type": "application/json",
  };

  const res = await fetch(`${GATEWAY_URL}/sendVideo`, {
    method: "POST",
    headers,
    body: JSON.stringify({ chat_id: chatId, video: videoUrl, caption: caption.slice(0, 1024), parse_mode: "HTML" }),
  });
  if (!res.ok) console.error(`sendVideo failed for ${chatId}:`, await res.text());
  return res;
}

async function sendTelegramMessage(chatId: number, text: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
  const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY")!;
  const res = await fetch(`${GATEWAY_URL}/sendMessage`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TELEGRAM_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
  if (!res.ok) console.error(`sendMessage failed for ${chatId}:`, await res.text());
  return res;
}

// ─── Rich media promo content pools ───

const MORNING_CONSUMER_PROMOS = [
  {
    title: "🌅 Rise & Ride!",
    body: "Start your day with a smooth ride. Book your morning commute in seconds — drivers are already online near you!",
    cta: `${APP_URL}/rides`,
    image_url: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80",
  },
  {
    title: "⚡ Flash Deal: Bus Tickets",
    body: "Grab today's discounted bus tickets before they sell out! Routes across Zimbabwe at unbeatable prices.",
    cta: `${APP_URL}/explore`,
    image_url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80",
  },
  {
    title: "🎫 Don't Miss This Weekend!",
    body: "Top events happening near you this weekend. Secure your spot now — early bird prices won't last!",
    cta: `${APP_URL}/events`,
    image_url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
  },
  {
    title: "💰 Wallet Bonus Alert",
    body: "Top up your wallet today and unlock exclusive cashback on your next booking. Your savings, your way!",
    cta: `${APP_URL}/pay`,
    image_url: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80",
  },
  {
    title: "🏨 Staycation Vibes",
    body: "Treat yourself to a midweek getaway! Premium stays at pocket-friendly prices. You deserve it.",
    cta: `${APP_URL}/stays`,
    image_url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
  },
  {
    title: "🎁 Refer & Earn $5",
    body: "Share fulticket with friends and earn $5 wallet credit for every signup! The more you share, the more you save.",
    cta: `${APP_URL}/profile`,
    image_url: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80",
  },
  {
    title: "🚐 Airport Transfers Made Easy",
    body: "Skip the hassle. Book reliable airport transfers with professional drivers. Arrive stress-free!",
    cta: `${APP_URL}/transfers`,
    image_url: "https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=800&q=80",
  },
  {
    title: "🎵 Live Music This Week",
    body: "Discover the hottest concerts and live performances near you. Get your tickets before they're gone!",
    cta: `${APP_URL}/events`,
    image_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
  },
  {
    title: "🚗 Need a Car? Rent One Today",
    body: "Self-drive or chauffeur-driven vehicles available now. Book by the hour, day, or week.",
    cta: `${APP_URL}/car-rentals`,
    image_url: "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80",
  },
  {
    title: "💼 Workspace Deals",
    body: "Productive co-working spaces with WiFi, coffee & focus. Book your desk today from just $5!",
    cta: `${APP_URL}/workspaces`,
    image_url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
  },
];

const EVENING_CONSUMER_PROMOS = [
  {
    title: "🌙 Night Out? We've Got You!",
    body: "Planning a night out? Book a safe ride home in advance. Your driver will be waiting — no surge, no stress.",
    cta: `${APP_URL}/rides`,
    image_url: "https://images.unsplash.com/photo-1519181245277-cffeb31da2e3?w=800&q=80",
  },
  {
    title: "⚡ ZESA Running Low?",
    body: "Don't sit in the dark! Buy ZESA tokens instantly right here on Telegram. Just type:\n/bills zesa [meter] [amount]",
    cta: "",
    image_url: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80",
  },
  {
    title: "🎶 Weekend Events Loading...",
    body: "Music, food, culture — the best events are just a tap away. Book now, thank us later!",
    cta: `${APP_URL}/events`,
    image_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
  },
  {
    title: "🚀 Did You Know? Pay Bills on Telegram!",
    body: "Buy ZESA tokens, send money, check your wallet — all without leaving Telegram! Try /bills or /wallet now.",
    cta: "",
    image_url: "https://images.unsplash.com/photo-1611746872915-64382b5c76da?w=800&q=80",
  },
  {
    title: "🏡 Book a Workspace Tomorrow",
    body: "WiFi, coffee, and focus — all sorted. Browse premium workspaces and book your spot now!",
    cta: `${APP_URL}/workspaces`,
    image_url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80",
  },
  {
    title: "💸 Send Money Instantly",
    body: "Transfer funds to any fulticket account in seconds. Just type:\n/send [account] [amount]",
    cta: "",
    image_url: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80",
  },
  {
    title: "🌟 Rate Your Last Trip",
    body: "Your feedback helps us improve! Rate your recent booking and earn loyalty points.",
    cta: `${APP_URL}/orders`,
    image_url: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&q=80",
  },
  {
    title: "✈️ Planning a Trip?",
    body: "Search flights, buses, and transfers to your destination. Compare prices and book the best deal!",
    cta: `${APP_URL}/explore`,
    image_url: "https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=800&q=80",
  },
  {
    title: "🎊 New on fulticket: Experiences",
    body: "Discover unique local experiences — tours, tastings, adventures. Make memories that last!",
    cta: `${APP_URL}/experiences`,
    image_url: "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80",
  },
  {
    title: "🏆 Loyalty Rewards",
    body: "You've been active! Check your loyalty points and redeem rewards on your next booking.",
    cta: `${APP_URL}/profile`,
    image_url: "https://images.unsplash.com/photo-1553729459-afe8f2e2ed65?w=800&q=80",
  },
];

const MERCHANT_PROMOS = [
  {
    title: "📊 Boost Your Bookings by 3x",
    body: "Merchants with complete profiles, photos, and descriptions get 3x more bookings. Update yours today!",
    cta: `${APP_URL}/merchant`,
    image_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
  },
  {
    title: "💰 Revenue Tip: Enable Instant Booking",
    body: "Capture impulse buyers by enabling instant booking. Speed wins in the travel game!",
    cta: `${APP_URL}/merchant`,
    image_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
  },
  {
    title: "📢 Promote Your Services",
    body: "Run targeted ads to reach more customers. Start with as little as $5/day. Check your merchant dashboard!",
    cta: `${APP_URL}/merchant`,
    image_url: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=800&q=80",
  },
  {
    title: "🏆 How Do You Rank?",
    body: "Check how you rank against other merchants in your category. Insights that drive growth await you!",
    cta: `${APP_URL}/merchant`,
    image_url: "https://images.unsplash.com/photo-1551135049-8a33b5883817?w=800&q=80",
  },
  {
    title: "📸 Photo Tip: First Impressions Matter",
    body: "Listings with professional photos get 5x more clicks. Upload high-quality images today!",
    cta: `${APP_URL}/merchant`,
    image_url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
  },
  {
    title: "💡 New Feature: Booking Links",
    body: "Create shareable booking links and send them directly to clients. One click = instant booking!",
    cta: `${APP_URL}/merchant`,
    image_url: "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800&q=80",
  },
];

const AGENT_PROMOS = [
  {
    title: "📈 Commission Update",
    body: "Check your latest earnings and commission breakdown. Your hard work pays off!\nType /earnings to see more.",
    cta: "",
    image_url: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80",
  },
  {
    title: "💼 Float Balance Reminder",
    body: "Keep your float topped up for seamless bill payments. Low balance?\nType /float to check.",
    cta: "",
    image_url: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80",
  },
  {
    title: "🆕 New Routes Available",
    body: "Fresh routes and services have been added. Expand your offerings and earn more commissions!",
    cta: `${APP_URL}/merchant/agent/dashboard`,
    image_url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
  },
  {
    title: "🎯 Top Agent This Week",
    body: "Are you the top-earning agent? Check the leaderboard and see how you compare!",
    cta: `${APP_URL}/merchant/agent/dashboard`,
    image_url: "https://images.unsplash.com/photo-1553729459-afe8f2e2ed65?w=800&q=80",
  },
];

const DRIVER_PROMOS = [
  {
    title: "🚗 Peak Hours Ahead!",
    body: "High demand expected this evening. Go online early to maximize your earnings!\nType /online to start.",
    cta: "",
    image_url: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80",
  },
  {
    title: "⭐ Rating Matters",
    body: "Drivers with 4.5+ ratings get priority ride requests. Keep up the great work and watch your earnings grow!",
    cta: "",
    image_url: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=800&q=80",
  },
  {
    title: "💰 Earnings Milestone",
    body: "You're crushing it! Check your total earnings and trip stats.\nType /earnings to see your progress.",
    cta: "",
    image_url: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80",
  },
  {
    title: "🛡️ Safety First",
    body: "Reminder: Always verify the pickup PIN before starting a ride. Your safety and your passenger's safety come first.",
    cta: "",
    image_url: "https://images.unsplash.com/photo-1590650153855-d9e808231d41?w=800&q=80",
  },
  {
    title: "🌟 Weekly Bonus Alert",
    body: "Complete 20 rides this week and earn a $10 bonus! Check your progress in the app.",
    cta: `${APP_URL}/driver`,
    image_url: "https://images.unsplash.com/photo-1553729459-afe8f2e2ed65?w=800&q=80",
  },
];

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
    if (!TELEGRAM_API_KEY) throw new Error("TELEGRAM_API_KEY not configured");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const now = new Date();
    const hour = now.getUTCHours();

    // Randomized send decision — only send with 60% probability per invocation
    // This creates natural randomness when cron fires every 30 min during windows
    if (Math.random() > 0.6) {
      return new Response(JSON.stringify({ ok: true, sent: 0, reason: "random_skip" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isMorning = hour >= 4 && hour < 6;   // 6-8 AM CAT
    const isEvening = hour >= 15 && hour < 19;  // 5-9 PM CAT
    const slot = isMorning ? "morning" : isEvening ? "evening" : "skip";

    if (slot === "skip") {
      return new Response(JSON.stringify({ ok: true, sent: 0, reason: "outside_window" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);

    // Fetch all active telegram links
    const { data: links, error: linksErr } = await supabase
      .from("telegram_user_links")
      .select("telegram_chat_id, user_id, notification_preferences")
      .eq("status", "active");

    if (linksErr) throw linksErr;
    if (!links || links.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, reason: "no_active_links" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch active sponsored ads
    const todayStr = now.toISOString().slice(0, 10);
    const { data: sponsoredAds } = await supabase
      .from("sponsored_telegram_ads")
      .select("*")
      .eq("is_active", true)
      .gt("budget_remaining", 0)
      .lte("start_date", todayStr)
      .gte("end_date", todayStr);

    let totalSent = 0;
    let skipped = 0;

    for (const link of links) {
      try {
        // Check notification preferences
        const prefs = link.notification_preferences as any;
        if (prefs?.promotions === false) { skipped++; continue; }

        // Check if already sent today for this slot (max 1 per slot)
        const { data: existing } = await supabase
          .from("telegram_promo_log")
          .select("id")
          .eq("chat_id", link.telegram_chat_id)
          .eq("sent_date", todayStr)
          .eq("slot", slot)
          .single();

        if (existing) { skipped++; continue; }

        // Determine user role
        const { data: merchantProfile } = await supabase
          .from("merchant_profiles")
          .select("role")
          .eq("user_id", link.user_id)
          .single();

        const { data: driverProfile } = await supabase
          .from("drivers")
          .select("id")
          .eq("user_id", link.user_id)
          .single();

        let role = "consumer";
        if (driverProfile) role = "driver";
        else if (merchantProfile?.role === "travel_agent" || merchantProfile?.role === "booking_agent") role = "agent";
        else if (merchantProfile) role = "merchant";

        // 20% chance to show a sponsored ad (if available for this role)
        let promo: { title: string; body: string; cta: string; image_url?: string; video_url?: string } | null = null;
        let isSponsored = false;
        let sponsoredAdId: string | null = null;

        if (sponsoredAds && sponsoredAds.length > 0 && Math.random() < 0.2) {
          const roleAds = sponsoredAds.filter((ad: any) => ad.target_roles?.includes(role));
          if (roleAds.length > 0) {
            const ad = roleAds[Math.floor(Math.random() * roleAds.length)];
            promo = { title: ad.title, body: ad.body, cta: ad.cta_url || "", image_url: ad.image_url, video_url: ad.video_url };
            isSponsored = true;
            sponsoredAdId = ad.id;
          }
        }

        // Fall back to platform promos
        if (!promo) {
          // Use a combination of day + random offset for variety
          const rotationIndex = (dayOfYear + Math.floor(Math.random() * 3)) % 10;

          if (role === "merchant") {
            promo = MERCHANT_PROMOS[rotationIndex % MERCHANT_PROMOS.length];
          } else if (role === "agent") {
            promo = AGENT_PROMOS[rotationIndex % AGENT_PROMOS.length];
          } else if (role === "driver") {
            promo = DRIVER_PROMOS[rotationIndex % DRIVER_PROMOS.length];
          } else {
            const pool = slot === "evening" ? EVENING_CONSUMER_PROMOS : MORNING_CONSUMER_PROMOS;
            promo = pool[rotationIndex % pool.length];
          }
        }

        // Build caption
        let caption = `${promo.title}\n\n${promo.body}`;
        if (promo.cta) caption += `\n\n🔗 ${promo.cta}`;
        if (isSponsored) caption += `\n\n<i>Sponsored</i>`;
        caption += `\n\n<i>— fulticket · Your Super App</i>`;

        // Send with appropriate media type
        if (promo.video_url) {
          await sendTelegramVideo(link.telegram_chat_id, caption, promo.video_url);
        } else if (promo.image_url) {
          await sendTelegramPhoto(link.telegram_chat_id, caption, promo.image_url);
        } else {
          await sendTelegramMessage(link.telegram_chat_id, caption);
        }

        // Log the send
        await supabase.from("telegram_promo_log").insert({
          chat_id: link.telegram_chat_id,
          user_id: link.user_id,
          slot,
          sent_date: todayStr,
          promo_title: promo.title,
          role_targeted: role,
        });

        // Deduct sponsored ad budget
        if (isSponsored && sponsoredAdId) {
          await supabase.rpc("deduct_sponsored_ad_budget", { ad_id: sponsoredAdId });
        }

        totalSent++;

        // Rate limit: small delay between sends
        if (totalSent % 20 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (userErr) {
        console.error(`Error sending promo to ${link.telegram_chat_id}:`, userErr);
      }
    }

    return new Response(JSON.stringify({ ok: true, sent: totalSent, skipped, total: links.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Daily promo error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
