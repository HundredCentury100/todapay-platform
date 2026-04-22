import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sendTelegram(chatId: number, text: string, replyMarkup?: any) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
  const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY")!;

  const body: any = { chat_id: chatId, text, parse_mode: "HTML" };
  if (replyMarkup) body.reply_markup = replyMarkup;

  const res = await fetch(`${GATEWAY_URL}/sendMessage`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TELEGRAM_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`sendMessage failed [${res.status}]:`, err);
  }
  return res;
}

async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
  const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY")!;

  await fetch(`${GATEWAY_URL}/answerCallbackQuery`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TELEGRAM_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text: text || "" }),
  });
}

async function sendTelegramPhoto(chatId: number, photoUrl: string, caption: string, replyMarkup?: any) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
  const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY")!;

  const body: any = { chat_id: chatId, photo: photoUrl, caption: caption.slice(0, 1024), parse_mode: "HTML" };
  if (replyMarkup) body.reply_markup = replyMarkup;

  const res = await fetch(`${GATEWAY_URL}/sendPhoto`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TELEGRAM_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) console.error(`sendPhoto failed [${res.status}]:`, await res.text());
  return res;
}

const APP_URL = "https://fulticket.com";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
    if (!TELEGRAM_API_KEY) throw new Error("TELEGRAM_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: messages, error: fetchErr } = await supabase
      .from("telegram_messages")
      .select("*")
      .eq("processed", false)
      .order("update_id", { ascending: true })
      .limit(50);

    if (fetchErr) throw fetchErr;
    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ ok: true, processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processedCount = 0;

    for (const msg of messages) {
      try {
        const chatId = msg.chat_id;
        const text = msg.text || "";
        const rawUpdate = msg.raw_update as any;
        const username = rawUpdate?.message?.from?.username || null;
        const firstName = rawUpdate?.message?.from?.first_name || "there";

        // Handle callback queries
        const callbackQuery = rawUpdate?.callback_query;
        if (callbackQuery) {
          const cbData = callbackQuery.data || "";
          const cbChatId = callbackQuery.message?.chat?.id;

          const { data: cbLink } = await supabase
            .from("telegram_user_links")
            .select("*")
            .eq("telegram_chat_id", cbChatId)
            .eq("status", "active")
            .single();

          if (cbLink) {
            if (cbData.startsWith("confirm_zesa:")) {
              // Format: confirm_zesa:sessionId
              const sessionId = cbData.split(":")[1];
              const { data: session } = await supabase
                .from("telegram_sessions")
                .select("*")
                .eq("id", sessionId)
                .eq("chat_id", cbChatId)
                .single();

              if (session) {
                const ctx = session.context as any;
                await answerCallbackQuery(callbackQuery.id, "Processing...");
                await sendTelegram(cbChatId, `⏳ Processing ZESA purchase for meter <code>${ctx.meter}</code>...`);

                try {
                  const billRes = await fetch(`${supabaseUrl}/functions/v1/esolutions-bill-pay`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${supabaseServiceKey}`,
                    },
                    body: JSON.stringify({
                      action: "purchase",
                      biller_type: "zesa",
                      meter_number: ctx.meter,
                      amount: ctx.amount,
                      currency: "USD",
                      user_id: cbLink.user_id,
                      payment_method: "wallet",
                    }),
                  });

                  const billResult = await billRes.json();

                  if (billResult.success) {
                    const tokens = billResult.tokens || [];
                    const tokenStr = tokens.length > 0
                      ? tokens.map((t: string) => `<code>${t}</code>`).join("\n")
                      : "Check your meter";

                    await sendTelegram(cbChatId,
                      `✅ <b>ZESA Purchase Successful!</b>\n\n` +
                      `⚡ Meter: <code>${ctx.meter}</code>\n` +
                      `💰 Amount: $${ctx.amount.toFixed(2)}\n` +
                      `${billResult.kwh ? `📊 Units: ${billResult.kwh} kWh\n` : ""}` +
                      `\n🔑 <b>Token(s):</b>\n${tokenStr}\n\n` +
                      `Ref: <code>${billResult.reference || "N/A"}</code>`
                    );
                  } else {
                    await sendTelegram(cbChatId, `❌ Purchase failed: ${billResult.error || "Unknown error"}\n\nTry again or use the app:\n🔗 ${APP_URL}/bill-pay`);
                  }
                } catch (e) {
                  await sendTelegram(cbChatId, `❌ Purchase failed. Try again later or use:\n🔗 ${APP_URL}/bill-pay`);
                }

                await supabase.from("telegram_sessions").delete().eq("id", session.id);
              } else {
                await answerCallbackQuery(callbackQuery.id, "Session expired");
              }
            } else if (cbData.startsWith("cancel_zesa:")) {
              const sessionId = cbData.split(":")[1];
              await supabase.from("telegram_sessions").delete().eq("id", sessionId);
              await answerCallbackQuery(callbackQuery.id, "Cancelled");
              await sendTelegram(cbChatId, "❌ ZESA purchase cancelled.");
            } else if (cbData === "topup_ecocash" || cbData === "topup_innbucks") {
              const method = cbData === "topup_ecocash" ? "EcoCash" : "InnBucks";
              const { data: session } = await supabase
                .from("telegram_sessions")
                .select("*")
                .eq("chat_id", cbChatId)
                .eq("session_type", "topup_pending")
                .single();

              if (session) {
                const ctx = session.context as any;
                const ref = `TG-${Date.now().toString(36).toUpperCase()}`;
                await answerCallbackQuery(callbackQuery.id, `${method} selected`);

                if (method === "EcoCash") {
                  await sendTelegram(cbChatId,
                    `📱 <b>EcoCash Top-Up</b>\n\n` +
                    `Amount: <b>$${ctx.amount.toFixed(2)}</b>\n` +
                    `Reference: <code>${ref}</code>\n\n` +
                    `<b>Instructions:</b>\n` +
                    `1. Dial *151#\n` +
                    `2. Select "Merchant Payment"\n` +
                    `3. Enter merchant code: <code>fulticket</code>\n` +
                    `4. Amount: $${ctx.amount.toFixed(2)}\n` +
                    `5. Reference: <code>${ref}</code>\n\n` +
                    `You'll be notified once payment is confirmed.`
                  );
                } else {
                  await sendTelegram(cbChatId,
                    `💚 <b>InnBucks Top-Up</b>\n\n` +
                    `Amount: <b>$${ctx.amount.toFixed(2)}</b>\n` +
                    `Reference: <code>${ref}</code>\n\n` +
                    `<b>Instructions:</b>\n` +
                    `1. Open InnBucks app\n` +
                    `2. Select "Pay Merchant"\n` +
                    `3. Scan QR or enter code\n` +
                    `4. Confirm $${ctx.amount.toFixed(2)}\n\n` +
                    `You'll be notified once payment is confirmed.`
                  );
                }
                await supabase.from("telegram_sessions").delete().eq("id", session.id);
              } else {
                await answerCallbackQuery(callbackQuery.id, "Session expired. Use /pay again.");
              }
            } else {
              await answerCallbackQuery(callbackQuery.id);
            }
          } else {
            await answerCallbackQuery(callbackQuery.id, "Please link your account first with /start");
          }

          // Mark processed and continue
          await supabase.from("telegram_messages").update({ processed: true }).eq("update_id", msg.update_id);
          processedCount++;
          continue;
        }

        // Check if user is linked
        const { data: link } = await supabase
          .from("telegram_user_links")
          .select("*")
          .eq("telegram_chat_id", chatId)
          .eq("status", "active")
          .single();

        const command = text.startsWith("/") ? text.split(" ")[0].toLowerCase().split("@")[0] : null;
        const args = text.split(" ").slice(1).join(" ").trim();

        const requireLink = async (): Promise<boolean> => {
          if (!link) {
            await sendTelegram(chatId, "⚠️ Please link your account first with /start");
            return false;
          }
          return true;
        };

        switch (command) {
          // ─── /start ───
          case "/start": {
            if (link) {
              await sendTelegram(chatId,
                `👋 Welcome back, <b>${firstName}</b>!\n\nYour account is linked and ready. Use /help to see all commands.`
              );
            } else {
              const linkCode = Math.floor(100000 + Math.random() * 900000).toString();
              const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

              await supabase
                .from("telegram_user_links")
                .upsert({
                  telegram_chat_id: chatId,
                  user_id: "00000000-0000-0000-0000-000000000000",
                  telegram_username: username,
                  link_code: linkCode,
                  link_code_expires_at: expiresAt,
                  status: "pending",
                }, { onConflict: "telegram_chat_id" });

              await sendTelegram(chatId,
                `👋 Welcome to <b>fulticket</b>!\n\n` +
                `To link your account, enter this code in the app:\n\n` +
                `🔑 <code>${linkCode}</code>\n\n` +
                `⏰ Expires in 10 minutes.\n\n` +
                `Go to <b>Profile → Settings → Link Telegram</b>\n` +
                `🔗 ${APP_URL}/profile`
              );
            }
            break;
          }

          // ─── /help ───
          case "/help": {
            if (!link) {
              await sendTelegram(chatId, `👋 Link your account first with /start to access all features.`);
              break;
            }

            await sendTelegram(chatId,
              `📋 <b>fulticket Commands</b>\n\n` +
              `🏠 <b>General</b>\n` +
              `/start — Welcome & account linking\n` +
              `/help — Show this command list\n\n` +
              `🎫 <b>Bookings</b>\n` +
              `/mybookings — View your current bookings\n` +
              `/status <code>[ref]</code> — Check a booking status\n\n` +
              `💰 <b>Wallet & Payments</b>\n` +
              `/wallet — View your balance\n` +
              `/send <code>[acct] [amount]</code> — Transfer funds\n` +
              `/bills zesa <code>[meter] [amount]</code> — Buy ZESA tokens\n` +
              `/pay topup <code>[amount]</code> — Top up wallet\n\n` +
              `📊 <b>Merchant / Agent / Driver</b>\n` +
              `/earnings — View your earnings summary\n` +
              `/float — Check agent float balance\n` +
              `/online — Go online (drivers)\n` +
              `/offline — Go offline (drivers)\n\n` +
              `⚙️ <b>Other</b>\n` +
              `/support — Contact support\n` +
              `/unlink — Unlink your Telegram account\n\n` +
              `💬 Or just type naturally — I can search, book, and answer questions!`
            );
            break;
          }

          // ─── /mybookings ───
          case "/mybookings": {
            if (!(await requireLink())) break;

            const { data: bookings } = await supabase
              .from("bookings")
              .select("booking_reference, item_name, status, travel_date, event_date, total_price, booking_type")
              .eq("user_id", link!.user_id)
              .in("status", ["confirmed", "pending"])
              .order("created_at", { ascending: false })
              .limit(5);

            if (!bookings || bookings.length === 0) {
              await sendTelegram(chatId, `📋 <b>No upcoming bookings</b>\n\nBrowse and book at:\n🔗 ${APP_URL}/explore`);
              break;
            }

            let response = "📋 <b>Your Bookings</b>\n\n";
            for (const b of bookings) {
              const date = b.travel_date || b.event_date || "TBD";
              const emoji = b.booking_type === "bus" ? "🚌" : b.booking_type === "event" ? "🎫" : b.booking_type === "stay" ? "🏨" : b.booking_type === "flight" ? "✈️" : b.booking_type === "transfer" ? "🚐" : "📦";
              response += `${emoji} <b>${b.item_name}</b>\n   Ref: <code>${b.booking_reference}</code>\n   📅 ${date} · $${b.total_price}\n   Status: ${b.status === "confirmed" ? "✅" : "⏳"} ${b.status}\n\n`;
            }
            response += `Use /status <code>[ref]</code> for full details.`;
            await sendTelegram(chatId, response);
            break;
          }

          // ─── /status ───
          case "/status": {
            if (!(await requireLink())) break;

            if (!args) {
              await sendTelegram(chatId, `📊 <b>Check Status</b>\n\nUsage: /status <code>[booking reference]</code>\nExample: /status ABC123`);
              break;
            }

            const { data: booking } = await supabase
              .from("bookings")
              .select("*")
              .eq("booking_reference", args.toUpperCase())
              .eq("user_id", link!.user_id)
              .single();

            if (!booking) {
              await sendTelegram(chatId, `❌ Booking <code>${args.toUpperCase()}</code> not found.`);
              break;
            }

            const statusEmoji = booking.status === "confirmed" ? "✅" : booking.status === "cancelled" ? "❌" : booking.status === "pending" ? "⏳" : "📦";
            await sendTelegram(chatId,
              `${statusEmoji} <b>Booking ${booking.booking_reference}</b>\n\n` +
              `📦 ${booking.item_name}\n🎫 Ticket: <code>${booking.ticket_number}</code>\n` +
              `💰 Total: $${booking.total_price}\n📅 Date: ${booking.travel_date || booking.event_date || "N/A"}\n` +
              `💳 Payment: ${booking.payment_status}\n📊 Status: ${booking.status}\n\n🔗 ${APP_URL}/orders`
            );
            break;
          }

          // ─── /wallet ───
          case "/wallet": {
            if (!(await requireLink())) break;

            const { data: wallet } = await supabase
              .from("user_wallets")
              .select("id, balance, currency, lifetime_earned, lifetime_spent")
              .eq("user_id", link!.user_id)
              .single();

            if (wallet) {
              await sendTelegram(chatId,
                `💰 <b>Wallet</b>\n\n` +
                `Balance: <b>$${Number(wallet.balance).toFixed(2)}</b>\n\n` +
                `📈 Lifetime earned: $${Number(wallet.lifetime_earned || 0).toFixed(2)}\n` +
                `📉 Lifetime spent: $${Number(wallet.lifetime_spent || 0).toFixed(2)}\n\n` +
                `Quick actions:\n• /pay topup <code>[amount]</code> — Top up\n• /send <code>[acct] [amount]</code> — Transfer\n\n🔗 ${APP_URL}/pay`
              );
            } else {
              await sendTelegram(chatId, `💰 No wallet found.\n\nCreate one at:\n🔗 ${APP_URL}/pay`);
            }
            break;
          }

          // ─── /send ───
          case "/send": {
            if (!(await requireLink())) break;

            const parts = args.split(" ");
            if (parts.length < 2 || !parts[0] || !parts[1]) {
              await sendTelegram(chatId, `💸 <b>Send Funds</b>\n\nUsage: /send <code>[account] [amount]</code>\nExample: /send ZW-U-00001 10`);
              break;
            }

            const [account, amountStr] = parts;
            const amount = parseFloat(amountStr);

            if (isNaN(amount) || amount <= 0) {
              await sendTelegram(chatId, "❌ Invalid amount. Please enter a positive number.");
              break;
            }

            const { data: senderWallet } = await supabase
              .from("user_wallets")
              .select("id, balance")
              .eq("user_id", link!.user_id)
              .single();

            if (!senderWallet) {
              await sendTelegram(chatId, `❌ No wallet found. Set one up at:\n🔗 ${APP_URL}/pay`);
              break;
            }

            if (Number(senderWallet.balance) < amount) {
              await sendTelegram(chatId,
                `❌ Insufficient balance.\nAvailable: <b>$${Number(senderWallet.balance).toFixed(2)}</b>\nRequested: $${amount.toFixed(2)}\n\nTop up: /pay topup ${amount}`
              );
              break;
            }

            const { data: recipientProfile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("account_number", account.toUpperCase())
              .single();

            const recipientDisplay = recipientProfile?.full_name
              ? `${recipientProfile.full_name} (<code>${account.toUpperCase()}</code>)`
              : `<code>${account.toUpperCase()}</code>`;

            await sendTelegram(chatId,
              `⚠️ <b>Confirm Transfer</b>\n\nTo: ${recipientDisplay}\nAmount: <b>$${amount.toFixed(2)}</b>\n\nReply <b>YES</b> to confirm or anything else to cancel.`
            );

            await supabase.from("telegram_sessions").upsert({
              chat_id: chatId,
              session_type: "transfer_confirm",
              context: { account: account.toUpperCase(), amount, wallet_id: senderWallet.id },
              expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            }, { onConflict: "chat_id" });
            break;
          }

          // ─── /bills — End-to-end ZESA purchase ───
          case "/bills": {
            if (!(await requireLink())) break;

            const billType = args.toLowerCase();

            if (billType.startsWith("zesa") || billType.startsWith("electricity")) {
              const zesaParts = args.split(" ").slice(1);
              if (zesaParts.length >= 2) {
                const meter = zesaParts[0];
                const zesaAmount = parseFloat(zesaParts[1]);

                if (isNaN(zesaAmount) || zesaAmount < 1) {
                  await sendTelegram(chatId, "❌ Invalid amount. Minimum $1.");
                  break;
                }

                // Check wallet balance
                const { data: wlt } = await supabase
                  .from("user_wallets")
                  .select("id, balance")
                  .eq("user_id", link!.user_id)
                  .single();

                if (!wlt || Number(wlt.balance) < zesaAmount) {
                  await sendTelegram(chatId,
                    `❌ Insufficient wallet balance.\n\nNeeded: $${zesaAmount.toFixed(2)}\nAvailable: $${wlt ? Number(wlt.balance).toFixed(2) : "0.00"}\n\nTop up: /pay topup ${zesaAmount}`
                  );
                  break;
                }

                // Create session for confirmation
                const { data: sess } = await supabase.from("telegram_sessions").insert({
                  chat_id: chatId,
                  session_type: "zesa_confirm",
                  context: { meter, amount: zesaAmount, wallet_id: wlt.id },
                  expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
                }).select("id").single();

                await sendTelegram(chatId,
                  `⚡ <b>ZESA Purchase</b>\n\n` +
                  `Meter: <code>${meter}</code>\n` +
                  `Amount: <b>$${zesaAmount.toFixed(2)}</b>\n` +
                  `Payment: Wallet ($${Number(wlt.balance).toFixed(2)} available)\n\n` +
                  `Confirm purchase?`,
                  {
                    inline_keyboard: [
                      [
                        { text: "✅ Confirm", callback_data: `confirm_zesa:${sess?.id}` },
                        { text: "❌ Cancel", callback_data: `cancel_zesa:${sess?.id}` },
                      ],
                    ],
                  }
                );
              } else {
                await sendTelegram(chatId,
                  `⚡ <b>ZESA Tokens</b>\n\nUsage: /bills zesa <code>[meter] [amount]</code>\nExample: /bills zesa 12345678901 10\n\nI'll purchase directly from your wallet!`
                );
              }
            } else if (billType.startsWith("airtime") || billType.startsWith("data")) {
              await sendTelegram(chatId, `📱 <b>Airtime & Data</b>\n\nPurchase airtime and data bundles:\n🔗 ${APP_URL}/bill-pay`);
            } else {
              await sendTelegram(chatId,
                `📄 <b>Pay Bills</b>\n\n` +
                `Available bill types:\n` +
                `⚡ /bills zesa <code>[meter] [amount]</code> — Buy ZESA tokens (instant!)\n` +
                `📱 /bills airtime — Airtime & data bundles\n\n` +
                `ZESA purchases are processed end-to-end right here in Telegram! 🚀`
              );
            }
            break;
          }

          // ─── /pay — Wallet top-up with inline payment options ───
          case "/pay": {
            if (!(await requireLink())) break;

            const payArgs = args.toLowerCase();
            const { data: payWallet } = await supabase
              .from("user_wallets")
              .select("id, balance")
              .eq("user_id", link!.user_id)
              .single();

            const bal = payWallet ? Number(payWallet.balance).toFixed(2) : "0.00";

            if (payArgs.startsWith("topup")) {
              const topupParts = args.split(" ").slice(1);
              const topupAmount = topupParts.length > 0 ? parseFloat(topupParts[0]) : 0;

              if (topupAmount < 1) {
                await sendTelegram(chatId,
                  `💳 <b>Top Up Wallet</b>\n\nUsage: /pay topup <code>[amount]</code>\nExample: /pay topup 20\n\nCurrent balance: $${bal}`
                );
                break;
              }

              // Create topup session
              await supabase.from("telegram_sessions").upsert({
                chat_id: chatId,
                session_type: "topup_pending",
                context: { amount: topupAmount, wallet_id: payWallet?.id },
                expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
              }, { onConflict: "chat_id" });

              await sendTelegram(chatId,
                `💳 <b>Top Up $${topupAmount.toFixed(2)}</b>\n\nCurrent balance: $${bal}\n\nChoose payment method:`,
                {
                  inline_keyboard: [
                    [
                      { text: "📱 EcoCash", callback_data: "topup_ecocash" },
                      { text: "💚 InnBucks", callback_data: "topup_innbucks" },
                    ],
                  ],
                }
              );
            } else {
              await sendTelegram(chatId,
                `💳 <b>Payments</b>\n\nCurrent balance: <b>$${bal}</b>\n\n` +
                `Quick actions:\n` +
                `• /pay topup <code>[amount]</code> — Top up wallet\n` +
                `• /send <code>[acct] [amount]</code> — Transfer funds\n` +
                `• /bills zesa <code>[meter] [amount]</code> — Buy ZESA\n\n` +
                `All transactions completed right here! 🚀`
              );
            }
            break;
          }

          // ─── /earnings ───
          case "/earnings": {
            if (!(await requireLink())) break;

            const { data: merchant } = await supabase
              .from("merchant_profiles")
              .select("id, business_name, role")
              .eq("user_id", link!.user_id)
              .single();

            if (merchant) {
              const { data: escrow } = await supabase
                .from("escrow_holds")
                .select("merchant_amount")
                .eq("merchant_profile_id", merchant.id)
                .eq("status", "released");

              const totalEarned = escrow?.reduce((sum: number, e: any) => sum + Number(e.merchant_amount), 0) || 0;

              const { data: pendingEscrow } = await supabase
                .from("escrow_holds")
                .select("merchant_amount")
                .eq("merchant_profile_id", merchant.id)
                .eq("status", "pending");

              const pendingAmount = pendingEscrow?.reduce((sum: number, e: any) => sum + Number(e.merchant_amount), 0) || 0;

              await sendTelegram(chatId,
                `📊 <b>Earnings — ${merchant.business_name}</b>\n\n` +
                `💰 Released: <b>$${totalEarned.toFixed(2)}</b>\n` +
                `⏳ Pending: <b>$${pendingAmount.toFixed(2)}</b>\n` +
                `🏷️ Role: ${merchant.role.replace(/_/g, " ")}\n\n🔗 ${APP_URL}/merchant`
              );
              break;
            }

            const { data: driver } = await supabase
              .from("drivers")
              .select("total_earnings, total_rides, rating")
              .eq("user_id", link!.user_id)
              .single();

            if (driver) {
              await sendTelegram(chatId,
                `📊 <b>Driver Earnings</b>\n\n` +
                `💰 Total: <b>$${Number(driver.total_earnings).toFixed(2)}</b>\n` +
                `🚗 Trips: ${driver.total_rides}\n⭐ Rating: ${Number(driver.rating).toFixed(1)}\n\n🔗 ${APP_URL}/driver`
              );
            } else {
              await sendTelegram(chatId, "❌ No merchant or driver account found.");
            }
            break;
          }

          // ─── /float ───
          case "/float": {
            if (!(await requireLink())) break;

            const { data: agentProfile } = await supabase
              .from("merchant_profiles")
              .select("id, business_name")
              .eq("user_id", link!.user_id)
              .in("role", ["travel_agent", "booking_agent"])
              .single();

            if (!agentProfile) {
              await sendTelegram(chatId, "❌ No agent account found. This command is for booking & travel agents.");
              break;
            }

            const { data: floatAccount } = await supabase
              .from("agent_float_accounts")
              .select("balance_usd, balance_zwg, low_balance_threshold_usd, low_balance_threshold_zwg")
              .eq("agent_profile_id", agentProfile.id)
              .single();

            if (floatAccount) {
              const usd = Number(floatAccount.balance_usd).toFixed(2);
              const zwg = Number(floatAccount.balance_zwg).toFixed(2);
              const usdLow = Number(floatAccount.balance_usd) < Number(floatAccount.low_balance_threshold_usd);
              const zwgLow = Number(floatAccount.balance_zwg) < Number(floatAccount.low_balance_threshold_zwg);

              await sendTelegram(chatId,
                `💼 <b>Float — ${agentProfile.business_name}</b>\n\n` +
                `🇺🇸 USD: <b>$${usd}</b>${usdLow ? " ⚠️ LOW" : ""}\n` +
                `🇿🇼 ZWG: <b>${zwg}</b>${zwgLow ? " ⚠️ LOW" : ""}\n\n` +
                `${(usdLow || zwgLow) ? "⚠️ Please request a top-up from your admin.\n\n" : ""}` +
                `🔗 ${APP_URL}/merchant`
              );
            } else {
              await sendTelegram(chatId, "No float account found. Contact admin to set up your float.");
            }
            break;
          }

          // ─── /online ───
          case "/online": {
            if (!(await requireLink())) break;

            const { data: onlineCheck } = await supabase.rpc("check_driver_can_go_online", { p_user_id: link!.user_id });
            const checkResult = onlineCheck as any;

            if (checkResult && !checkResult.allowed) {
              await sendTelegram(chatId,
                `❌ <b>Cannot go online</b>\n\nMinimum wallet balance of <b>$5.00</b> required.\n` +
                `Current balance: $${Number(checkResult.balance).toFixed(2)}\n\nTop up: /pay topup 10`
              );
              break;
            }

            const { data: onlineDriver, error: onlineErr } = await supabase
              .from("drivers")
              .update({ is_online: true, updated_at: new Date().toISOString() })
              .eq("user_id", link!.user_id)
              .eq("status", "active")
              .select("id")
              .single();

            if (onlineErr || !onlineDriver) {
              await sendTelegram(chatId, "❌ Driver account not found or not active.");
            } else {
              await sendTelegram(chatId, `🟢 You are now <b>ONLINE</b>!\n\nYou'll receive ride requests. Stay safe! 🚗\nUse /offline to go offline.`);
            }
            break;
          }

          // ─── /offline ───
          case "/offline": {
            if (!(await requireLink())) break;

            const { data: offlineDriver, error: offlineErr } = await supabase
              .from("drivers")
              .update({ is_online: false, updated_at: new Date().toISOString() })
              .eq("user_id", link!.user_id)
              .eq("status", "active")
              .select("id")
              .single();

            if (offlineErr || !offlineDriver) {
              await sendTelegram(chatId, "❌ Driver account not found or not active.");
            } else {
              await sendTelegram(chatId, `🔴 You are now <b>OFFLINE</b>.\n\nYou won't receive new ride requests.\nUse /online when you're ready.`);
            }
            break;
          }

          // ─── /support ───
          case "/support": {
            await sendTelegram(chatId,
              `🆘 <b>Support</b>\n\nNeed help? We're here for you:\n\n` +
              `📧 Email: support@fulticket.com\n💬 Live chat: ${APP_URL}/help\n📞 WhatsApp: +263 77 123 4567\n\n` +
              `Common issues:\n• /status <code>[ref]</code> — Check booking\n• /wallet — Check balance\n• /unlink — Unlink account`
            );
            break;
          }

          // ─── /unlink ───
          case "/unlink": {
            if (!link) {
              await sendTelegram(chatId, "ℹ️ Your account is not currently linked. Use /start to link.");
              break;
            }

            await supabase.from("telegram_user_links").update({ status: "unlinked" }).eq("telegram_chat_id", chatId);
            await sendTelegram(chatId, `✅ Account unlinked successfully.\n\nYou'll no longer receive notifications here.\nUse /start to link again anytime.`);
            break;
          }

          // ─── DEFAULT ───
          default: {
            // Handle YES confirmation for pending transfers
            if (text.toUpperCase() === "YES") {
              const { data: session } = await supabase
                .from("telegram_sessions")
                .select("*")
                .eq("chat_id", chatId)
                .eq("session_type", "transfer_confirm")
                .gt("expires_at", new Date().toISOString())
                .single();

              if (session && link) {
                const ctx = session.context as any;
                const { data: result } = await supabase.rpc("transfer_between_wallets", {
                  p_sender_wallet_id: ctx.wallet_id,
                  p_recipient_account_number: ctx.account,
                  p_amount: ctx.amount,
                  p_description: "Transfer via Telegram",
                });

                const res = result as any;
                if (res?.success) {
                  await sendTelegram(chatId,
                    `✅ <b>Transfer Successful</b>\n\nSent <b>$${ctx.amount.toFixed(2)}</b> to ${res.recipient_name || ctx.account}\n\nCheck balance: /wallet`
                  );
                } else {
                  await sendTelegram(chatId, `❌ Transfer failed: ${res?.error || "Unknown error"}`);
                }

                await supabase.from("telegram_sessions").delete().eq("id", session.id);
                break;
              }
            }

            // Natural language → commerce agent WITH multi-turn session persistence
            if (link && text && !text.startsWith("/")) {
              try {
                // Look up or create a conversation session for this chat
                const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

                const { data: convSession } = await supabase
                  .from("telegram_sessions")
                  .select("*")
                  .eq("chat_id", chatId)
                  .eq("session_type", "conversation")
                  .gt("expires_at", new Date().toISOString())
                  .single();

                let commerceSessionId = convSession?.context?.commerce_session_id || null;

                const agentRes = await fetch(`${supabaseUrl}/functions/v1/commerce-agent`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${supabaseServiceKey}`,
                  },
                  body: JSON.stringify({
                    message: text,
                    user_id: link.user_id,
                    channel: "telegram",
                    session_id: commerceSessionId,
                  }),
                });

                if (agentRes.ok) {
                  const agentData = await agentRes.json();
                  const reply = agentData.response || agentData.message || "I couldn't process that. Try /help for commands.";

                  // Persist the commerce session ID for multi-turn context
                  const newCommerceSessionId = agentData.session_id || commerceSessionId;
                  await supabase.from("telegram_sessions").upsert({
                    chat_id: chatId,
                    session_type: "conversation",
                    context: { commerce_session_id: newCommerceSessionId },
                    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                  }, { onConflict: "chat_id,session_type" });

                  await sendTelegram(chatId, reply);

                  // Post-booking: send QR code + receipt if booking was confirmed
                  if (agentData.message_type === "booking_confirmation") {
                    try {
                      // Extract booking reference from the reply text
                      const refMatch = reply.match(/[A-Z0-9]{6}/);
                      if (refMatch) {
                        const { data: booking } = await supabase
                          .from("bookings")
                          .select("booking_reference, ticket_number, item_name, total_price, qr_code_data, travel_date, event_date")
                          .eq("booking_reference", refMatch[0])
                          .eq("user_id", link.user_id)
                          .single();

                        if (booking) {
                          const receiptCaption =
                            `🎫 <b>Booking Receipt</b>\n\n` +
                            `📦 ${booking.item_name}\n` +
                            `🔖 Ref: <code>${booking.booking_reference}</code>\n` +
                            `🎟️ Ticket: <code>${booking.ticket_number}</code>\n` +
                            `💰 Total: <b>$${Number(booking.total_price).toFixed(2)}</b>\n` +
                            `📅 Date: ${booking.travel_date || booking.event_date || "TBD"}`;

                          if (booking.qr_code_data) {
                            // Generate QR code image URL using a public QR API
                            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(booking.qr_code_data)}`;
                            await sendTelegramPhoto(chatId, qrUrl, receiptCaption, {
                              inline_keyboard: [[
                                { text: "📄 View Full Receipt", url: `${APP_URL}/orders` },
                              ]],
                            });
                          } else {
                            await sendTelegram(chatId, receiptCaption, {
                              inline_keyboard: [[
                                { text: "📄 View Full Receipt", url: `${APP_URL}/orders` },
                              ]],
                            });
                          }
                        }
                      }
                    } catch (qrErr) {
                      console.error("QR delivery error:", qrErr);
                    }
                  }
                } else {
                  await sendTelegram(chatId, `🤖 I couldn't process that right now. Try:\n• /help — See all commands\n• /mybookings — Your bookings\n• /wallet — Your balance`);
                }
              } catch {
                await sendTelegram(chatId, `🤖 Something went wrong. Try /help to see available commands.`);
              }
            } else if (!link && !command) {
              await sendTelegram(chatId, "👋 Welcome! Use /start to link your fulticket account and get started.");
            } else if (command) {
              await sendTelegram(chatId, `❓ Unknown command: ${command}\n\nUse /help to see all available commands.`);
            }
            break;
          }
        }

        // Mark as processed
        await supabase.from("telegram_messages").update({ processed: true }).eq("update_id", msg.update_id);
        processedCount++;
      } catch (msgErr) {
        console.error(`Error processing message ${msg.update_id}:`, msgErr);
        await supabase.from("telegram_messages").update({ processed: true }).eq("update_id", msg.update_id);
      }
    }

    return new Response(JSON.stringify({ ok: true, processed: processedCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Telegram bot error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
