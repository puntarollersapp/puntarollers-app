import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { adminClient, jsonResponse, mercadoPagoAccessToken, MP_API_URL } from "../_shared/mercadopago.ts";

const allowedPreview = /^https:\/\/puntarollers-[a-z0-9-]+-puntarollersapps-projects\.vercel\.app$/;
function isAllowedBrowserOrigin(origin: string | null): boolean {
  return !!origin && (origin === "https://puntarollers.com" || origin === "https://www.puntarollers.com" || allowedPreview.test(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin));
}
function corsHeaders(origin: string | null): Record<string,string> {
  return { "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin", ...(isAllowedBrowserOrigin(origin) ? { "Access-Control-Allow-Origin": origin! } : {}) };
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);
  if (req.method === "OPTIONS") return new Response(null, { status: isAllowedBrowserOrigin(origin) ? 204 : 403, headers });
  if (req.method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405, headers);
  if (!isAllowedBrowserOrigin(origin)) return jsonResponse({ error: "origin_not_allowed" }, 403, headers);
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return jsonResponse({ error: "invalid_json" }, 400, headers); }
  const orderId = body.orderId;
  const requestKey = body.requestKey;
  if (typeof orderId !== "string" || !uuid.test(orderId) || typeof requestKey !== "string" || !uuid.test(requestKey)) return jsonResponse({ error: "invalid_order" }, 400, headers);
  const db = adminClient();
  const { data: order, error } = await db.from("pr_uniform_orders").select("*").eq("id", orderId).eq("request_key", requestKey).maybeSingle();
  if (error || !order) return jsonResponse({ error: "order_not_found" }, 404, headers);
  if (order.payment_status !== "pending") return jsonResponse({ error: "order_not_payable" }, 409, headers);
  if (order.provider_preference_id) return jsonResponse({ error: "payment_already_started" }, 409, headers);
  const supabaseBase = Deno.env.get("SUPABASE_URL");
  const webhookBase = Deno.env.get("UNIFORM_MP_WEBHOOK_URL") || (supabaseBase ? `${supabaseBase}/functions/v1/uniform-mp-webhook` : "");
  if (!webhookBase || !webhookBase.startsWith("https://")) return jsonResponse({ error: "payment_not_configured" }, 503, headers);
  if (!Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")) return jsonResponse({ error: "mercadopago_credentials_missing" }, 503, headers);
  const preference = {
    items: [{ id: order.product_id, title: order.product_name, description: [order.model, order.color, order.size].filter(Boolean).join(" / "), quantity: order.quantity, currency_id: "UYU", unit_price: Number(order.unit_price) }],
    payer: { name: order.buyer_name, email: order.buyer_email },
    external_reference: order.id,
    notification_url: webhookBase,
    back_urls: { success: `${origin}/uniformes?payment=return`, failure: `${origin}/uniformes?payment=return`, pending: `${origin}/uniformes?payment=return` },
    auto_return: "approved",
    expires: true,
    expiration_date_from: new Date().toISOString(),
    expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
  let response: Response;
  let result: Record<string, unknown>;
  try {
    response = await fetch(`${MP_API_URL}/checkout/preferences`, {
      method: "POST",
      headers: { Authorization: `Bearer ${mercadoPagoAccessToken()}`, "Content-Type": "application/json", "X-Idempotency-Key": order.id },
      body: JSON.stringify(preference),
      signal: AbortSignal.timeout(12000),
    });
    result = await response.json();
  } catch { return jsonResponse({ error: "provider_unreachable" }, 503, headers); }
  if (!response.ok || typeof result.id !== "string" || typeof result.init_point !== "string" || !result.init_point.startsWith("https://")) return jsonResponse({ error: "preference_failed" }, 502, headers);
  const { data: saved, error: saveError } = await db.from("pr_uniform_orders").update({ provider_preference_id: result.id, payment_method: "mercadopago" }).eq("id", order.id).is("provider_preference_id", null).eq("payment_status", "pending").select("id").maybeSingle();
  if (saveError || !saved) return jsonResponse({ error: "preference_not_saved" }, 409, headers);
  return jsonResponse({ checkoutUrl: result.init_point, preferenceId: result.id }, 200, headers);
});
