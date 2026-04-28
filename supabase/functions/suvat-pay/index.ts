import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import CryptoJS from "npm:crypto-js@4.2.0";

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

    console.log('Environment check:', {
      hasIntegrationKey: !!integrationKey,
      integrationKeyLength: integrationKey.length,
      hasEncryptionKey: !!encryptionKey,
      encryptionKeyLength: encryptionKey.length,
      pesepayEnv: PESEPAY_ENV,
    });

    if (!integrationKey || !encryptionKey) {
      console.error('Missing Pesepay credentials');
      return new Response(JSON.stringify({
        error: 'Payment gateway not configured - missing credentials',
        details: {
          hasIntegrationKey: !!integrationKey,
          hasEncryptionKey: !!encryptionKey,
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const rawBody = await req.text();
    const queryBody = Object.fromEntries(new URL(req.url).searchParams.entries());
    const body = rawBody ? JSON.parse(rawBody) : queryBody;
    const { action } = body;

    // Pesepay posts final results to resultUrl without our action wrapper.
    if (!action && (body.payload || body.referenceNumber || body.transactionStatus || body.reference || body.merchantReference)) {
      const callbackData = await parsePesepayBody(body, encryptionKey, integrationKey);
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
          data = await parsePesepayBody(JSON.parse(response.body), encryptionKey, integrationKey);
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

        if (!referenceNumber) {
          console.error('check-status called without referenceNumber');
          return new Response(JSON.stringify({
            error: 'Missing referenceNumber',
            success: false,
            paid: false,
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        console.log('Checking payment status for:', referenceNumber);

        try {
          const response = await pesepayRequest(
            `/payments/check-payment?referenceNumber=${encodeURIComponent(referenceNumber)}`,
            'GET',
            undefined,
            integrationKey
          );

          console.log('Pesepay check-payment response:', { status: response.status, bodyPreview: response.body.substring(0, 200) });

          if (response.status < 200 || response.status >= 300) {
            console.error('Status check HTTP error:', response.status, response.body);
            throw new Error(`Status check failed: ${response.status} - ${response.body.substring(0, 100)}`);
          }

          const data = await parsePesepayBody(JSON.parse(response.body), encryptionKey, integrationKey);
          console.log('Payment status check:', { referenceNumber, status: data.transactionStatus, fullData: JSON.stringify(data).substring(0, 500) });

          await syncPaymentStatus(supabase, data);

          const isPaid = isPaidStatus(data.transactionStatus);
          console.log('Payment isPaid check:', { status: data.transactionStatus, isPaid });

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
        } catch (checkError: any) {
          console.error('check-status error:', checkError.message, checkError.stack);
          throw checkError;
        }
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

// Pesepay's docs use CryptoJS AES-256-CBC with the first 16 key chars as IV.
// Using CryptoJS here keeps encryption/decryption identical to their examples.
function encryptPayload(data: string, key: string): string {
  const keyBytes = CryptoJS.enc.Utf8.parse(key);
  const ivBytes = CryptoJS.enc.Utf8.parse(key.substring(0, 16));
  const encrypted = CryptoJS.AES.encrypt(data, keyBytes, {
    iv: ivBytes,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return encrypted.ciphertext.toString(CryptoJS.enc.Base64);
}

function decryptPayload(data: string, key: string): string {
  const encryptedPayload = data.trim();
  const keyBytes = CryptoJS.enc.Utf8.parse(key);
  const ivBytes = CryptoJS.enc.Utf8.parse(key.substring(0, 16));
  const cipherParams = CryptoJS.lib.CipherParams.create({
    ciphertext: CryptoJS.enc.Base64.parse(encryptedPayload),
  });
  const decryptedBytes = CryptoJS.AES.decrypt(cipherParams, keyBytes, {
    iv: ivBytes,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  const decrypted = decryptedBytes.toString(CryptoJS.enc.Utf8);

  if (!decrypted) {
    throw new Error('Decryption failed');
  }

  return decrypted;
}

async function parsePesepayBody(body: Record<string, unknown>, encryptionKey: string, fallbackKey?: string): Promise<Record<string, any>> {
  if (typeof body.payload === 'string') {
    const keysToTry = [encryptionKey, fallbackKey].filter(Boolean) as string[];
    let lastError: unknown;

    for (const key of keysToTry) {
      try {
        const decrypted = decryptPayload(body.payload, key);
        return JSON.parse(decrypted);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Decryption failed');
  }

  return body as Record<string, any>;
}

function isPaidStatus(status: unknown): boolean {
  const statusUpper = String(status || '').toUpperCase();
  // Pesepay sandbox sometimes returns different statuses
  return ['SUCCESS', 'PAID', 'COMPLETED', 'COMPLETE', 'SUCCESSFUL', 'APPROVED', 'ACCEPTED'].includes(statusUpper);
}

function isFailedStatus(status: unknown): boolean {
  return ['FAILED', 'CANCELLED', 'CANCELED', 'DECLINED', 'TIMEOUT', 'EXPIRED'].includes(String(status || '').toUpperCase());
}

function toTransactionStatus(status: unknown): 'completed' | 'failed' | 'pending' {
  if (isPaidStatus(status)) return 'completed';
  if (isFailedStatus(status)) return 'failed';
  return 'pending';
}

async function findTransaction(supabase: any, referenceNumber?: string, merchantReference?: string) {
  const selectFields = 'id, booking_id, merchant_profile_id, amount, payment_metadata';
  const refs = [referenceNumber, merchantReference].filter(Boolean) as string[];

  for (const ref of refs) {
    const direct = await supabase.from('transactions').select(selectFields).eq('transaction_reference', ref).maybeSingle();
    if (direct.data) return direct.data;

    const byPesepay = await supabase.from('transactions').select(selectFields).eq('payment_metadata->>pesepay_reference', ref).maybeSingle();
    if (byPesepay.data) return byPesepay.data;

    const byMerchant = await supabase.from('transactions').select(selectFields).eq('payment_metadata->>merchant_reference', ref).maybeSingle();
    if (byMerchant.data) return byMerchant.data;
  }

  return null;
}

async function syncPaymentStatus(supabase: any, data: Record<string, any>) {
  const referenceNumber = data.referenceNumber || data.reference;
  const merchantReference = data.merchantReference;
  const paymentStatus = toTransactionStatus(data.transactionStatus);
  const transaction = await findTransaction(supabase, referenceNumber, merchantReference);

  if (!transaction) {
    if (merchantReference) {
      const { data: booking } = await supabase.from('bookings').update({
        payment_status: paymentStatus === 'completed' ? 'paid' : 'pending',
        status: paymentStatus === 'completed' ? 'confirmed' : 'pending',
        updated_at: new Date().toISOString(),
      }).eq('id', merchantReference).select('id').maybeSingle();

      if (booking) {
        await supabase.from('payment_verifications').insert({
          booking_id: booking.id,
          gateway_provider: 'suvat_pay',
          gateway_reference: referenceNumber || merchantReference,
          verification_status: paymentStatus === 'completed' ? 'verified' : paymentStatus === 'failed' ? 'failed' : 'pending',
          gateway_response: data,
          verified_at: paymentStatus === 'pending' ? null : new Date().toISOString(),
        });

        return { paymentStatus, transactionFound: false, bookingUpdated: true };
      }
    }

    console.warn('No local transaction found for Pesepay result', { referenceNumber, merchantReference, status: data.transactionStatus });
    return { paymentStatus, transactionFound: false };
  }

  const mergedMetadata = {
    ...(transaction.payment_metadata || {}),
    gateway: 'suvat_pay',
    pesepay_reference: referenceNumber,
    merchant_reference: merchantReference,
    pesepay_status: data.transactionStatus,
    pesepay_result: data,
    synced_at: new Date().toISOString(),
  };

  await supabase.from('transactions').update({
    payment_status: paymentStatus,
    payment_metadata: mergedMetadata,
    updated_at: new Date().toISOString(),
  }).eq('id', transaction.id);

  await supabase.from('payment_verifications').insert({
    transaction_id: transaction.id,
    booking_id: transaction.booking_id,
    gateway_provider: 'suvat_pay',
    gateway_reference: referenceNumber || merchantReference,
    verification_status: paymentStatus === 'completed' ? 'verified' : paymentStatus === 'failed' ? 'failed' : 'pending',
    gateway_response: data,
    verified_at: paymentStatus === 'pending' ? null : new Date().toISOString(),
  });

  if (paymentStatus === 'completed' && transaction.booking_id) {
    await supabase.from('bookings').update({
      payment_status: 'paid',
      status: 'confirmed',
      updated_at: new Date().toISOString(),
    }).eq('id', transaction.booking_id);
  }

  return { paymentStatus, transactionFound: true, transactionId: transaction.id };
}
