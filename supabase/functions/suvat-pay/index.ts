import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Pesepay environment switch — set PESEPAY_ENV=test for sandbox, anything else hits live.
// Switch to live by setting PESEPAY_ENV=live in secrets. Defaults to sandbox.
const PESEPAY_ENV = (Deno.env.get('PESEPAY_ENV') ?? '').toLowerCase() === 'live' ? 'live' : 'test';
const PESEPAY_HOST = PESEPAY_ENV === 'live' ? 'api.pesepay.com' : 'api.test.sandbox.pesepay.com';
const PESEPAY_BASE_PATH = PESEPAY_ENV === 'live' ? '/api/payments-engine/v1' : '/payments-engine/v1';

// Use Deno.connect with manual TLS to bypass hyper's HTTP header parsing
async function pesepayRequest(path: string, method: string, body?: string, authKey?: string, timeoutMs = 15000): Promise<{ status: number; body: string }> {
  const hostname = PESEPAY_HOST;
  const port = 443;
  const fullPath = `${PESEPAY_BASE_PATH}${path}`;
  console.log(`Pesepay request -> https://${hostname}${fullPath} (env=${PESEPAY_ENV})`);

  // Build raw HTTP request
  const contentLength = body ? new TextEncoder().encode(body).length : 0;
  let rawRequest = `${method} ${fullPath} HTTP/1.1\r\n`;
  rawRequest += `Host: ${hostname}\r\n`;
  rawRequest += `Content-Type: application/json\r\n`;
  if (authKey) rawRequest += `Authorization: ${authKey}\r\n`;
  if (body) rawRequest += `Content-Length: ${contentLength}\r\n`;
  rawRequest += `Connection: close\r\n`;
  rawRequest += `\r\n`;
  if (body) rawRequest += body;

  // Connect with TLS
  const conn = await Deno.connectTls({
    hostname,
    port,
  });

  // Send request
  const encoder = new TextEncoder();
  await conn.write(encoder.encode(rawRequest));

  // Read response with timeout
  const decoder = new TextDecoder();
  let responseData = '';
  const buf = new Uint8Array(4096);

  const readWithTimeout = async (): Promise<string> => {
    return new Promise<string>(async (resolve, reject) => {
      const timer = setTimeout(() => {
        try { conn.close(); } catch { /* ignore */ }
        reject(new Error(`Suvat Pay request timed out after ${timeoutMs / 1000}s`));
      }, timeoutMs);

      try {
        while (true) {
          const n = await conn.read(buf);
          if (n === null) break;
          responseData += decoder.decode(buf.subarray(0, n));
        }
      } catch {
        // Connection closed
      } finally {
        clearTimeout(timer);
        try { conn.close(); } catch { /* ignore */ }
      }
      resolve(responseData);
    });
  };

  responseData = await readWithTimeout();

  // Parse HTTP response
  const headerEnd = responseData.indexOf('\r\n\r\n');
  if (headerEnd === -1) {
    throw new Error('Invalid HTTP response');
  }

  const headerPart = responseData.substring(0, headerEnd);
  let bodyPart = responseData.substring(headerEnd + 4);

  // Parse status line
  const statusLine = headerPart.split('\r\n')[0];
  const statusMatch = statusLine.match(/HTTP\/[\d.]+ (\d+)/);
  const status = statusMatch ? parseInt(statusMatch[1]) : 500;

  // Handle chunked transfer encoding
  if (headerPart.toLowerCase().includes('transfer-encoding: chunked')) {
    bodyPart = decodeChunked(bodyPart);
  }

  return { status, body: bodyPart };
}

function decodeChunked(data: string): string {
  let result = '';
  let remaining = data;

  while (remaining.length > 0) {
    const lineEnd = remaining.indexOf('\r\n');
    if (lineEnd === -1) break;

    const sizeHex = remaining.substring(0, lineEnd).trim();
    const size = parseInt(sizeHex, 16);
    if (isNaN(size) || size === 0) break;

    remaining = remaining.substring(lineEnd + 2);
    result += remaining.substring(0, size);
    remaining = remaining.substring(size + 2); // skip chunk data + \r\n
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const integrationKey = (Deno.env.get('PESEPAY_INTEGRATION_KEY') ?? '').replace(/[^\x20-\x7E]/g, '').trim();
    const encryptionKey = (Deno.env.get('PESEPAY_ENCRYPTION_KEY') ?? '').replace(/[^\x20-\x7E]/g, '').trim();

    if (!integrationKey || !encryptionKey) {
      throw new Error('Payment gateway not configured');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const rawBody = await req.text();
    const body = rawBody ? JSON.parse(rawBody) : {};
    const { action } = body;

    // Pesepay posts final results to resultUrl without our action wrapper.
    if (!action && (body.payload || body.referenceNumber || body.transactionStatus || body.reference || body.merchantReference)) {
      const callbackData = await parsePesepayBody(body, encryptionKey);
      const syncResult = await syncPaymentStatus(supabase, callbackData);

      return new Response(JSON.stringify({ success: true, ...syncResult }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    switch (action) {
      case 'initiate': {
        const { amount, currencyCode, reason, returnUrl, bookingId, merchantProfileId, customer, paymentMethodCode, paymentChannel, merchantReference } = body;
        const numericAmount = Number(amount);

        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
          throw new Error('Invalid payment amount');
        }

        const selectedPaymentMethodCode = paymentMethodCode
          || (paymentChannel === 'mobile_money' ? 'PZW211' : Deno.env.get('PESEPAY_DEFAULT_PAYMENT_METHOD_CODE') || 'PZW212');
        const customerPhone = String(customer?.phoneNumber || customer?.phone || body.customerPhoneNumber || '0770000000');
        const pesepayResultUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/suvat-pay`;
        const safeMerchantReference = String(merchantReference || bookingId || crypto.randomUUID());

        const transactionDetails = {
          amountDetails: {
            amount: Math.round(numericAmount * 100) / 100,
            currencyCode: currencyCode || 'USD',
          },
          merchantReference: safeMerchantReference,
          reasonForPayment: reason || 'Suvat Pay - Booking Payment',
          resultUrl: pesepayResultUrl,
          returnUrl: returnUrl,
          paymentMethodCode: selectedPaymentMethodCode,
          customer: {
            email: String(customer?.email || 'payments@todapayments.com'),
            phoneNumber: customerPhone,
            name: String(customer?.name || 'TodaPay Customer'),
          },
          paymentMethodRequiredFields: selectedPaymentMethodCode === 'PZW211'
            ? { customerPhoneNumber: customerPhone }
            : {},
        };

        console.log('Initiating payment, integration key length:', integrationKey.length, 'encryption key length:', encryptionKey.length);

        // Encrypt payload for Pesepay v2 endpoint
        const encryptedPayload = await encryptPayload(JSON.stringify(transactionDetails), encryptionKey);
        const requestBody = JSON.stringify({ payload: encryptedPayload });

        const response = await pesepayRequest('/payments/initiate', 'POST', requestBody, integrationKey);
        console.log('Pesepay response status:', response.status, 'body:', response.body.substring(0, 300));

        if (response.status < 200 || response.status >= 300) {
          throw new Error(`Payment initiation failed: ${response.status} - ${response.body.substring(0, 200)}`);
        }

        let data;
        try {
          data = await parsePesepayBody(JSON.parse(response.body), encryptionKey);
        } catch (parseErr) {
          console.error('Failed to parse response:', response.body.substring(0, 500));
          throw new Error('Invalid response from payment gateway');
        }

        if (bookingId && merchantProfileId) {
          await supabase.from('transactions').update({
            payment_metadata: {
              gateway: 'suvat_pay',
              pesepay_reference: data.referenceNumber,
              merchant_reference: safeMerchantReference,
              poll_url: data.pollUrl,
              payment_method_code: selectedPaymentMethodCode,
            },
          }).eq('booking_id', bookingId);
        }

        return new Response(JSON.stringify({
          success: true,
          redirectUrl: data.redirectUrl,
          referenceNumber: data.referenceNumber,
          pollUrl: data.pollUrl,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'check-status': {
        const { referenceNumber } = body;

        const response = await pesepayRequest(
          `/payments/check-payment?referenceNumber=${encodeURIComponent(referenceNumber)}`,
          'GET',
          undefined,
          integrationKey
        );

        if (response.status < 200 || response.status >= 300) {
          throw new Error(`Status check failed: ${response.status}`);
        }

        const data = await parsePesepayBody(JSON.parse(response.body), encryptionKey);
        await syncPaymentStatus(supabase, data);

        const isPaid = isPaidStatus(data.transactionStatus);

        return new Response(JSON.stringify({
          success: true,
          paid: isPaid,
          status: data.transactionStatus,
          amount: data.amountDetails?.totalTransactionAmount,
          currency: data.amountDetails?.currencyCode,
          raw: data,
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
    console.error('Suvat Pay error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// AES-CBC encryption matching Pesepay's CryptoJS format
// CryptoJS.enc.Utf8.parse(key) converts key to raw UTF-8 bytes
// IV = first 16 chars of encryption key  
// CryptoJS pads key to next valid AES size (16, 24, 32) with zeros
function getKeyBytes(key: string): Uint8Array {
  const encoder = new TextEncoder();
  const rawBytes = encoder.encode(key);
  // Pad to nearest valid AES key size
  const validSizes = [16, 24, 32];
  const targetSize = validSizes.find(s => s >= rawBytes.length) || 32;
  const padded = new Uint8Array(targetSize);
  padded.set(rawBytes.slice(0, targetSize));
  return padded;
}

async function encryptPayload(data: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyBytes = getKeyBytes(key);
  const ivBytes = encoder.encode(key.slice(0, 16));
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyBytes, { name: 'AES-CBC' }, false, ['encrypt']
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv: ivBytes }, cryptoKey, encoder.encode(data)
  );

  // CryptoJS .toString() outputs base64 of just the ciphertext
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

async function decryptPayload(data: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyBytes = getKeyBytes(key);
  const ivBytes = encoder.encode(key.slice(0, 16));
  const encrypted = Uint8Array.from(atob(data), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyBytes, { name: 'AES-CBC' }, false, ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-CBC', iv: ivBytes }, cryptoKey, encrypted
  );

  return new TextDecoder().decode(decrypted);
}
