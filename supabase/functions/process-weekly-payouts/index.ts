import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setHours(23, 59, 59, 999);
    const periodStart = new Date(periodEnd);
    periodStart.setDate(periodStart.getDate() - 7);
    periodStart.setHours(0, 0, 0, 0);

    // Get completed transactions not yet in a payout
    const { data: transactions, error: txnError } = await supabase
      .from('transactions')
      .select('id, merchant_profile_id, amount, platform_fee_amount, merchant_amount, payment_method')
      .eq('payment_status', 'completed')
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', periodEnd.toISOString());

    if (txnError) throw txnError;
    if (!transactions || transactions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No transactions to process', payoutsCreated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check which transactions are already in payout_items
    const txnIds = transactions.map(t => t.id);
    const { data: existingItems } = await supabase
      .from('payout_items')
      .select('transaction_id')
      .in('transaction_id', txnIds);

    const existingTxnIds = new Set((existingItems || []).map(i => i.transaction_id));
    const newTransactions = transactions.filter(t => !existingTxnIds.has(t.id));

    if (newTransactions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'All transactions already processed', payoutsCreated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Group by merchant
    const merchantGroups: Record<string, typeof newTransactions> = {};
    for (const txn of newTransactions) {
      if (!merchantGroups[txn.merchant_profile_id]) {
        merchantGroups[txn.merchant_profile_id] = [];
      }
      merchantGroups[txn.merchant_profile_id].push(txn);
    }

    let payoutsCreated = 0;

    for (const [merchantId, txns] of Object.entries(merchantGroups)) {
      const totalAmount = txns.reduce((sum, t) => sum + Number(t.merchant_amount), 0);
      const totalFees = txns.reduce((sum, t) => sum + Number(t.platform_fee_amount), 0);

      // Create payout record — Wednesday payout cycle
      const { data: payout, error: payoutError } = await supabase
        .from('merchant_payouts')
        .insert({
          merchant_profile_id: merchantId,
          amount: totalAmount,
          fee_deducted: totalFees,
          payout_method: 'bank_transfer',
          status: 'pending',
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          notes: `Wednesday weekly payout: ${txns.length} transactions`,
        })
        .select()
        .single();

      if (payoutError) {
        console.error(`Error creating payout for merchant ${merchantId}:`, payoutError);
        continue;
      }

      // Create payout items
      const payoutItems = txns.map(txn => ({
        payout_id: payout.id,
        transaction_id: txn.id,
        amount: Number(txn.merchant_amount),
      }));

      const { error: itemsError } = await supabase
        .from('payout_items')
        .insert(payoutItems);

      if (itemsError) {
        console.error(`Error creating payout items for merchant ${merchantId}:`, itemsError);
      }

      payoutsCreated++;
    }

    return new Response(
      JSON.stringify({ 
        message: `Processed ${payoutsCreated} merchant payouts (Wednesday cycle)`,
        payoutsCreated,
        transactionsProcessed: newTransactions.length,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing weekly payouts:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
