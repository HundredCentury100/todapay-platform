import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

function normalizeBaseUrl(url: string): string {
  // Remove trailing slash and known path suffixes to avoid doubling
  let normalized = url.replace(/\/+$/, "");
  // If the base URL already ends with /auth/third-party, strip it so we can add paths cleanly
  if (normalized.endsWith("/auth/third-party")) {
    normalized = normalized.replace(/\/auth\/third-party$/, "");
  }
  return normalized;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const rawBaseUrl = Deno.env.get("INNBUCKS_BASE_URL");
  const username = Deno.env.get("INNBUCKS_USERNAME");
  const password = Deno.env.get("INNBUCKS_PASSWORD");
  const apiKey = Deno.env.get("INNBUCKS_API_KEY");

  if (!rawBaseUrl || !username || !password || !apiKey) {
    throw new Error("InnBucks credentials not configured");
  }

  const baseUrl = normalizeBaseUrl(rawBaseUrl);
  const authUrl = `${baseUrl}/auth/third-party`;

  console.log("Authenticating with InnBucks API at:", authUrl);

  const authAttempts: Array<{
    label: string;
    headers: Record<string, string>;
    body: string;
  }> = [
    {
      label: "json_username",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify({ username, password }),
    },
    {
      label: "form_username",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Api-Key": apiKey,
      },
      body: new URLSearchParams({ username, password }).toString(),
    },
  ];

  let lastError = "Authentication failed";

  for (const attempt of authAttempts) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 40000);

      const response = await fetch(authUrl, {
        method: "POST",
        headers: attempt.headers,
        body: attempt.body,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const rawText = await response.text();
      let data: any = null;
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        const message = data?.responseMsg || data?.message || rawText || `HTTP ${response.status}`;
        lastError = `Auth ${attempt.label} failed: ${response.status} - ${message}`;
        console.warn(lastError);
        continue;
      }

      const responseCode = data?.responseCode;
      const accessToken = data?.accessToken || data?.token || data?.auth?.token;
      const isAcceptedCode = responseCode === undefined || responseCode === 0 || responseCode === "00";

      if (isAcceptedCode && accessToken) {
        cachedToken = accessToken;
        tokenExpiresAt = Date.now() + 12 * 60 * 1000;
        console.log(`InnBucks auth successful via ${attempt.label}`);
        return cachedToken;
      }

      const responseMessage = data?.responseMsg || data?.message || "Authentication rejected";
      lastError = `Auth ${attempt.label} rejected: ${responseMessage}`;
      console.warn(lastError);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        lastError = `Auth ${attempt.label} timed out after 40s`;
      } else {
        lastError = `Auth ${attempt.label} error: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
      console.warn(lastError);
    }
  }

  throw new Error(lastError);
}

async function apiRequest(endpoint: string, body: any, method: string = "POST"): Promise<any> {
  const baseUrl = normalizeBaseUrl(Deno.env.get("INNBUCKS_BASE_URL") || "");
  const apiKey = Deno.env.get("INNBUCKS_API_KEY");
  const token = await getAccessToken();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 40000);

  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey!,
      Authorization: `Bearer ${token}`,
    },
    signal: controller.signal,
  };

  if (method !== "GET" && body) {
    options.body = JSON.stringify(body);
  }

  console.log(`InnBucks API ${method} ${endpoint}`);

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, options);
    clearTimeout(timeout);

    if (!response.ok) {
      const text = await response.text();
      console.error(`API error ${response.status}:`, text);
      throw new Error(`API error ${response.status}: ${text}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timed out after 40s");
    }
    throw error;
  }
}

function successResponse(data: any) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status: number = 400) {
  return new Response(
    JSON.stringify({ success: false, message }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();

    // ─── 1. Code Generate (PAYMENT or WITHDRAWAL) ───
    if (action === "generate") {
      const result = await apiRequest("/api/code/generate", {
        reference: params.reference,
        narration: params.narration || "Payment",
        amount: params.amount,
        type: params.type || "PAYMENT",
      });

      if (result.responseCode === 0 || result.responseCode === "00") {
        return successResponse({
          success: true,
          code: result.code,
          qrCode: result.qrCode,
          stan: result.stan,
          authNumber: result.authNumber,
          amount: result.amount,
          currency: result.currency,
          timeToLive: result.timeToLive,
        });
      }

      return successResponse({
        success: false,
        message: result.responseMsg || "Code generation failed",
        responseCode: result.responseCode,
      });
    }

    // ─── 2. Code Inquiry ───
    if (action === "query") {
      const result = await apiRequest("/api/code/query", {
        reference: params.reference,
        code: params.code,
      });

      if (result.responseCode === 0 || result.responseCode === "00") {
        return successResponse({
          success: true,
          status: result.status,
          amount: result.amount,
          timeToLive: result.timeToLive,
          authNumber: result.authNumber,
          code: result.code,
        });
      }

      return successResponse({
        success: false,
        message: result.responseMsg || "Query failed",
        status: result.status,
        responseCode: result.responseCode,
      });
    }

    // ─── 3. Account Full Statement ───
    if (action === "statement") {
      const result = await apiRequest("/api/account/fullStatement", {
        accountNumber: params.accountNumber,
        currency: params.currency || "USD",
        startDateTime: params.startDateTime,
        endDateTime: params.endDateTime,
      });

      if (result.responseCode === 0 || result.responseCode === "00") {
        return successResponse({
          success: true,
          transactions: result.transactions,
          accountNumber: result.accountNumber,
          currency: result.currency,
          openingBalance: result.openingBalance,
          closingBalance: result.closingBalance,
        });
      }

      return successResponse({
        success: false,
        message: result.responseMsg || "Statement retrieval failed",
        responseCode: result.responseCode,
      });
    }

    // ─── 4. Bank Change ───
    if (action === "bankChange") {
      const result = await apiRequest("/api/transaction/bankChange", {
        reference: params.reference,
        currency: params.currency || "USD",
        amount: params.amount,
        narration: params.narration || "Bank change",
        destinationMsisdn: params.destinationMsisdn,
      });

      if (result.responseCode === 0 || result.responseCode === "00") {
        return successResponse({
          success: true,
          transactionId: result.transactionId,
          reference: result.reference,
          amount: result.amount,
          currency: result.currency,
          destinationMsisdn: result.destinationMsisdn,
        });
      }

      return successResponse({
        success: false,
        message: result.responseMsg || "Bank change failed",
        responseCode: result.responseCode,
      });
    }

    // ─── 5. Linked Account Inquiry ───
    if (action === "linkedAccountInquiry") {
      const msisdn = params.msisdn;
      if (!msisdn) {
        return errorResponse("MSISDN is required");
      }

      const result = await apiRequest(
        `/api/account/msisdn/${encodeURIComponent(msisdn)}/details`,
        null,
        "GET"
      );

      if (result.responseCode === 0 || result.responseCode === "00") {
        return successResponse({
          success: true,
          accountNumber: result.accountNumber,
          accountName: result.accountName,
          msisdn: result.msisdn,
          status: result.status,
          currency: result.currency,
        });
      }

      return successResponse({
        success: false,
        message: result.responseMsg || "Account inquiry failed",
        responseCode: result.responseCode,
      });
    }

    // ─── 6. Account Deposit ───
    if (action === "deposit") {
      const result = await apiRequest("/api/transaction/deposit", {
        reference: params.reference,
        currency: params.currency || "USD",
        amount: params.amount,
        narration: params.narration || "Deposit",
        destinationAccount: params.destinationAccount,
        type: params.type,
      });

      if (result.responseCode === 0 || result.responseCode === "00") {
        return successResponse({
          success: true,
          transactionId: result.transactionId,
          reference: result.reference,
          participantReference: result.participantReference,
          amount: result.amount,
          currency: result.currency,
        });
      }

      return successResponse({
        success: false,
        message: result.responseMsg || "Deposit failed",
        responseCode: result.responseCode,
      });
    }

    // ─── 7. Utility Payment ───
    if (action === "utilityPayment") {
      const result = await apiRequest("/api/utility/provider/payment", {
        provider: params.provider,
        providerProduct: params.providerProduct,
        amount: params.amount,
        currency: params.currency || "USD",
        reference: params.reference,
        narration: params.narration || "Utility payment",
        destinationAccount: params.destinationAccount,
        ...(params.additionalData ? { additionalData: params.additionalData } : {}),
      });

      if (result.responseCode === 0 || result.responseCode === "00") {
        return successResponse({
          success: true,
          transactionId: result.transactionId,
          reference: result.reference,
          provider: result.provider,
          providerProduct: result.providerProduct,
          amount: result.amount,
          currency: result.currency,
          tokens: result.tokens,
          additionalData: result.additionalData,
        });
      }

      return successResponse({
        success: false,
        message: result.responseMsg || "Utility payment failed",
        responseCode: result.responseCode,
      });
    }

    // ─── 8. Reversal ───
    if (action === "reversal") {
      const result = await apiRequest("/api/transaction/reversal/v2", {
        amount: params.amount,
        currency: params.currency || "USD",
        type: params.type || "CREDIT",
        destinationAccount: params.destinationAccount,
        participantReference: params.participantReference,
        originalParticipantReference: params.originalParticipantReference,
      });

      const isSuccess = result.responseCode === 0 || result.responseCode === "00";

      return successResponse({
        success: isSuccess,
        message: result.responseMsg,
        responseCode: result.responseCode,
        transactionId: result.transactionId,
        reference: result.reference,
        ...(result.responseCode === "025" ? { errorDetail: "Unable to locate original transaction" } : {}),
        ...(result.responseCode === "096" ? { errorDetail: "Request failed" } : {}),
      });
    }

    // ─── 9. Deposit Inquiry ───
    if (action === "depositInquiry") {
      const result = await apiRequest("/bank/api/transaction/inquiry", {
        accountNumber: params.accountNumber,
        participantReference: params.participantReference,
        originalParticipantReference: params.originalParticipantReference,
      });

      if (result.responseCode === 0 || result.responseCode === "00") {
        return successResponse({
          success: true,
          status: result.status,
          transactionId: result.transactionId,
          amount: result.amount,
          currency: result.currency,
          reference: result.reference,
        });
      }

      return successResponse({
        success: false,
        message: result.responseMsg || "Deposit inquiry failed",
        responseCode: result.responseCode,
      });
    }

    return errorResponse("Invalid action. Supported: generate, query, statement, bankChange, linkedAccountInquiry, deposit, utilityPayment, reversal, depositInquiry");
  } catch (error) {
    console.error("InnBucks error:", error);
    return successResponse({
      success: false,
      message: error instanceof Error ? error.message : "Unexpected InnBucks error",
    });
  }
});
