import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Merchant configuration mapping
const MERCHANT_CONFIG: Record<string, { merchantName: string; productName: string; processingCode: string; supportsCustomerInfo: boolean; isAirtime: boolean }> = {
  econet: { merchantName: 'ECONET', productName: 'ECONET_AIRTIME', processingCode: 'U50000', supportsCustomerInfo: false, isAirtime: true },
  netone: { merchantName: 'NETONE', productName: 'NETONE_AIRTIME', processingCode: 'U50000', supportsCustomerInfo: false, isAirtime: true },
  telecel: { merchantName: 'TELECEL', productName: 'TELECEL_AIRTIME', processingCode: 'U50000', supportsCustomerInfo: false, isAirtime: true },
  edgars: { merchantName: 'EDGARS', productName: 'EDGARS', processingCode: 'U50000', supportsCustomerInfo: true, isAirtime: false },
  jet: { merchantName: 'EDGARS', productName: 'JET', processingCode: '520000', supportsCustomerInfo: true, isAirtime: false },
  bcc: { merchantName: 'BYOBILL', productName: 'BYOBILL', processingCode: 'U50000', supportsCustomerInfo: true, isAirtime: false },
  nyaradzo: { merchantName: 'NYARADZO', productName: 'NYARADZO', processingCode: 'U50000', supportsCustomerInfo: true, isAirtime: false },
  moonlight: { merchantName: 'MOONLIGHT', productName: 'MOONLIGHT', processingCode: 'U50000', supportsCustomerInfo: true, isAirtime: false },
  zetdc: { merchantName: 'ZETDC', productName: 'ZETDC_PREPAID', processingCode: 'U50000', supportsCustomerInfo: true, isAirtime: false },
};

function generateVendorReference(): string {
  return 'SVT' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
}

function formatTransmissionDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2);
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${month}${day}${year}${hours}${minutes}${seconds}`;
}

function formatPhone(phone: string): string {
  if (phone.startsWith('0')) {
    return '263' + phone.substring(1);
  }
  return phone;
}

function parseJsonSafely(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// Helper to make eSolutions API calls with defensive parsing + timeout
async function callEsolutions(apiUrl: string, authHeader: string, payload: Record<string, unknown>): Promise<any> {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });

  const rawBody = await response.text();
  const contentType = response.headers.get('content-type') || '';
  const parsedBody = parseJsonSafely(rawBody);

  if (!response.ok) {
    const statusText = response.statusText || 'Unknown';
    const bodyPreview = rawBody.substring(0, 300);
    console.error(`eSolutions HTTP ${response.status} ${statusText}:`, bodyPreview);
    throw new Error(`eSolutions API error: ${response.status} ${statusText}`);
  }

  if (contentType.includes('application/json') && parsedBody) {
    return parsedBody;
  }

  if (parsedBody) {
    return parsedBody;
  }

  console.error('eSolutions returned non-JSON response:', rawBody.substring(0, 300));
  throw new Error('Invalid response from eSolutions gateway');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let baseUrl = Deno.env.get('ESOLUTIONS_BASE_URL') || '';
    const username = Deno.env.get('ESOLUTIONS_USERNAME');
    const password = Deno.env.get('ESOLUTIONS_PASSWORD');
    const vendorNumber = Deno.env.get('ESOLUTIONS_VENDOR_NUMBER');
    const terminalId = Deno.env.get('ESOLUTIONS_TERMINAL_ID');

    if (!baseUrl || !username || !password || !vendorNumber) {
      throw new Error('eSolutions credentials not configured');
    }

    baseUrl = baseUrl.replace(/^(https?:)\/{3,}/, '$1//').replace(/\/+$/, '');
    const apiUrl = baseUrl;

    const authHeader = 'Basic ' + btoa(`${username}:${password}`);
    const body = await req.json();
    const action = String(body?.action || '');
    const merchantId = String(body?.merchantId || '');
    const accountNumber = String(body?.accountNumber || '').trim();
    const amount = typeof body?.amount === 'number' ? body.amount : Number(body?.amount || 0);
    const currency = String(body?.currency || 'USD');

    const config = MERCHANT_CONFIG[merchantId];
    if (!config) {
      return new Response(JSON.stringify({ success: false, error: `Unknown merchant: ${merchantId}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const vendorReference = generateVendorReference();
    const transmissionDate = formatTransmissionDate();

    switch (action) {
      case 'customer-info': {
        if (!config.supportsCustomerInfo) {
          return new Response(JSON.stringify({
            success: true,
            skipValidation: true,
            message: 'Merchant does not support customer info lookup',
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const payload: Record<string, unknown> = {
          mti: '0200',
          vendorReference,
          processingCode: '310000',
          transmissionDate,
          vendorNumber,
          merchantName: config.merchantName,
          productName: config.productName,
          utilityAccount: accountNumber,
          currencyCode: currency,
          apiVersion: '02',
        };

        if (amount > 0) {
          payload.transactionAmount = Math.round(amount * 100);
        }

        const data = await callEsolutions(apiUrl, authHeader, payload);

        if (data.responseCode !== '00') {
          return new Response(JSON.stringify({
            success: false,
            error: data.narrative || `Validation failed (code: ${data.responseCode || 'unknown'})`,
            responseCode: data.responseCode,
            raw: data,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        let customerName = String(data.customerData || data.customerName || data.customer || '').trim();
        let customerAddress = String(data.customerAddress || data.address || '').trim();
        let balance = String(data.customerBalance || data.arrears || data.balance || '').trim();
        let monthlyPremium = '';

        if (merchantId === 'nyaradzo' && customerName.includes('|')) {
          const parts = customerName.split('|');
          if (parts.length >= 3) {
            balance = parts[0]?.trim() || balance;
            monthlyPremium = parts[1]?.trim() || '';
            customerName = parts[2]?.trim() || customerName;
          }
        } else if (merchantId === 'moonlight' && customerName.includes('|')) {
          const parts = customerName.split('|');
          if (parts.length >= 2) {
            customerName = parts[1]?.trim() || customerName;
          }
        } else if ((merchantId === 'edgars' || merchantId === 'jet') && customerName.includes('|')) {
          const parts = customerName.split('|');
          if (parts.length >= 1) {
            customerName = parts[0]?.trim() || customerName;
            if (parts.length >= 2) {
              balance = parts[1]?.trim() || balance;
            }
          }
        }

        return new Response(JSON.stringify({
          success: true,
          customerName,
          customerAddress,
          balance,
          monthlyPremium,
          settlementCurrency: data.settlementCurrencyCode || currency,
          raw: data,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'pay': {
        const amountInCents = Math.round(amount * 100);
        const formattedPhone = config.isAirtime ? formatPhone(accountNumber) : undefined;

        const payload: Record<string, unknown> = {
          mti: '0200',
          vendorReference,
          processingCode: config.processingCode,
          transactionAmount: amountInCents,
          transmissionDate,
          vendorNumber,
          terminalID: terminalId || 'POS001',
          merchantName: config.merchantName,
          productName: config.productName,
          utilityAccount: config.isAirtime ? formattedPhone : accountNumber,
          currencyCode: currency,
          apiVersion: '02',
        };

        if (config.isAirtime && formattedPhone) {
          payload.sourceMobile = formattedPhone;
          payload.targetMobile = formattedPhone;
        }

        if (merchantId === 'nyaradzo' && body.customerData) {
          payload.customerData = body.customerData;
        }

        if (merchantId === 'netone') {
          payload.serviceId = 'CS';
        }

        const data = await callEsolutions(apiUrl, authHeader, payload);

        if (data.responseCode === '09') {
          return new Response(JSON.stringify({
            success: false,
            pending: true,
            error: 'Transaction still in progress',
            vendorReference,
            transactionReference: data.transactionReference,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (data.responseCode !== '00') {
          return new Response(JSON.stringify({
            success: false,
            error: data.narrative || `Payment failed (code: ${data.responseCode})`,
            responseCode: data.responseCode,
            raw: data,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        let tokens: string[] = [];
        let tokenDetails: { kwh?: string; energyCharge?: string; debt?: string; reaLevy?: string; vat?: string } = {};

        if (data.token && data.token !== 'Accepted') {
          const tokenRecords = String(data.token).split('#');
          tokenRecords.forEach((record: string) => {
            const parts = record.split('|');
            if (parts[0]) tokens.push(parts[0].trim());
            if (parts.length >= 7) {
              const units = parts[1]?.trim();
              const netAmountCents = parseInt(parts[4] || '0');
              const taxAmountCents = parseInt(parts[5] || '0');
              tokenDetails = {
                kwh: units,
                energyCharge: `${currency} ${(netAmountCents / 100).toFixed(2)}`,
                vat: `${currency} ${(taxAmountCents / 100).toFixed(2)}`,
              };
            }
          });
        }

        if (data.arrears) {
          const arrearsRecords = String(data.arrears).split('#');
          let totalDebt = 0;
          arrearsRecords.forEach((record: string) => {
            const parts = record.split('|');
            const debtCents = parseInt(parts[2] || parts[1] || '0');
            totalDebt += debtCents;
          });
          if (totalDebt > 0) {
            tokenDetails.debt = `${currency} ${(totalDebt / 100).toFixed(2)}`;
          }
        }

        if (data.fixedCharges) {
          const chargeRecords = String(data.fixedCharges).split('#');
          let totalLevy = 0;
          chargeRecords.forEach((record: string) => {
            const parts = record.split('|');
            const chargeCents = parseInt(parts[2] || '0');
            totalLevy += chargeCents;
          });
          if (totalLevy > 0) {
            tokenDetails.reaLevy = `${currency} ${(totalLevy / 100).toFixed(2)}`;
          }
        }

        return new Response(JSON.stringify({
          success: true,
          transactionReference: data.transactionReference || vendorReference,
          receiptNumber: data.receiptNumber,
          narrative: data.narrative,
          tokens: tokens.length > 0 ? tokens : undefined,
          ...tokenDetails,
          raw: data,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'resend': {
        const payload: Record<string, unknown> = {
          mti: '0201',
          vendorReference,
          processingCode: config.processingCode,
          transmissionDate,
          vendorNumber,
          merchantName: config.merchantName,
          productName: config.productName,
          utilityAccount: accountNumber,
          originalReference: body.originalReference,
          currencyCode: currency,
          apiVersion: '02',
        };

        if (amount > 0) {
          payload.transactionAmount = Math.round(amount * 100);
        }

        const data = await callEsolutions(apiUrl, authHeader, payload);

        return new Response(JSON.stringify({
          success: data.responseCode === '00',
          pending: data.responseCode === '09',
          responseCode: data.responseCode,
          narrative: data.narrative,
          transactionReference: data.transactionReference,
          token: data.token,
          raw: data,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'balance': {
        const payload = {
          mti: '0200',
          vendorReference,
          processingCode: '300000',
          transmissionDate,
          vendorNumber,
          accountNumber: body.accountNumber || vendorNumber,
          currencyCode: currency,
        };

        const data = await callEsolutions(apiUrl, authHeader, payload);

        return new Response(JSON.stringify({
          success: data.responseCode === '00',
          vendorBalance: data.vendorBalance,
          narrative: data.narrative,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('eSolutions error:', error);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
