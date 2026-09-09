import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.57.4";

export const MP_API_URL = "https://api.mercadopago.com";

const productionOrigins = new Set([
  "https://www.puntarollers.com",
  "https://puntarollers.com",
]);

export type RegistrationType = "inscripciones_2026" | "clinica_oct_2026";
export type PaymentState = "created" | "pending" | "paid" | "failed" | "cancelled" | "review";

export function isAllowedBrowserOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (productionOrigins.has(origin)) return true;
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

export function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
  if (isAllowedBrowserOrigin(origin)) headers["Access-Control-Allow-Origin"] = origin!;
  return headers;
}

export function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

function secretKey(): string {
  const legacyKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacyKey) return legacyKey;

  const keySet = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (keySet) {
    const parsed = JSON.parse(keySet) as Record<string, string>;
    if (parsed.default) return parsed.default;
  }
  throw new Error("Supabase service key is not configured");
}

export function adminClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  if (!url) throw new Error("SUPABASE_URL is not configured");
  return createClient(url, secretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function mercadoPagoAccessToken(): string {
  const value = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
  if (!value) throw new Error("MERCADOPAGO_ACCESS_TOKEN is not configured");
  return value;
}

export function mercadoPagoEnvironment(): "test" | "production" {
  return Deno.env.get("MERCADOPAGO_ENVIRONMENT") === "production" ? "production" : "test";
}

export function normalizePaymentState(
  status: string | null | undefined,
  statusDetail: string | null | undefined,
): PaymentState {
  const normalizedStatus = (status ?? "").toLowerCase();
  const normalizedDetail = (statusDetail ?? "").toLowerCase();

  if (normalizedStatus === "processed" && normalizedDetail === "accredited") return "paid";
  if (["cancelled", "canceled"].includes(normalizedStatus)) return "cancelled";
  if (["failed", "rejected", "expired"].includes(normalizedStatus)) return "failed";
  if (["processing", "action_required", "created"].includes(normalizedStatus)) return "pending";
  return "review";
}

export async function markRegistrationFromPayment(
  supabase: SupabaseClient,
  registrationType: RegistrationType,
  registrationId: string,
  state: PaymentState,
): Promise<void> {
  if (registrationType === "inscripciones_2026") {
    if (state === "paid") {
      const { error } = await supabase
        .from("pr_inscripciones_2026")
        .update({
          metodo_pago: "Mercado Pago",
          comprobante_recibido: true,
          estado: "pago_verificado",
          updated_at: new Date().toISOString(),
        })
        .eq("id", registrationId);
      if (error) throw new Error("Could not mark the registration as paid");
    } else if (state === "pending") {
      const { error } = await supabase
        .from("pr_inscripciones_2026")
        .update({
          metodo_pago: "Mercado Pago",
          estado: "pago_pendiente",
          updated_at: new Date().toISOString(),
        })
        .eq("id", registrationId)
        .neq("estado", "pago_verificado");
      if (error) throw new Error("Could not mark the registration as pending");
    }
    return;
  }

  if (state === "paid") {
    const { error } = await supabase
      .from("pr_clinica_oct_2026_inscripciones")
      .update({
        comprobante_recibido: true,
        estado: "confirmado",
        updated_at: new Date().toISOString(),
      })
      .eq("id", registrationId);
    if (error) throw new Error("Could not mark the clinic registration as paid");
  }
}

export function safeProviderCode(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const source = payload as Record<string, unknown>;
  for (const key of ["code", "error", "status", "cause"]) {
    const value = source[key];
    if (typeof value === "string" && value.length <= 100) return value;
  }
  return fallback;
}

