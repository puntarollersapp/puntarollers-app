import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { adminClient, jsonResponse, mercadoPagoAccessToken, MP_API_URL } from "../_shared/mercadopago.ts";

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
async function signed(id: string, requestId: string, header: string, secret: string): Promise<boolean> {
  const parts = header.split(",").map(x => x.trim());
  const ts = parts.find(x => x.startsWith("ts="))?.slice(3);
  const hashes = parts.filter(x => x.startsWith("v1=")).map(x => x.slice(3).toLowerCase());
  if (!ts || !/^\d+$/.test(ts) || Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`id:${id.toLowerCase()};request-id:${requestId};ts:${ts};`));
  const expected = Array.from(new Uint8Array(digest)).map(x => x.toString(16).padStart(2, "0")).join("");
  return hashes.some(x => safeEqual(x, expected));
}
Deno.serve(async (req) => {
  if (req.method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405);
  const url = new URL(req.url);
  const paymentId = url.searchParams.get("data.id") || url.searchParams.get("id");
  const type = url.searchParams.get("type");
  if (type && type !== "payment") return jsonResponse({ ok: true, ignored: true });
  if (!paymentId || !/^\d{1,30}$/.test(paymentId)) return jsonResponse({ error: "invalid_payment_id" }, 400);
  const secret = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET");
  const requestId = req.headers.get("x-request-id");
  const signature = req.headers.get("x-signature");
  if (!secret || !requestId || !signature) return jsonResponse({ error: "signature_required" }, 401);
  if (!(await signed(paymentId, requestId, signature, secret))) return jsonResponse({ error: "invalid_signature" }, 401);
  let response: Response;
  let payment: Record<string, unknown>;
  try {
    response = await fetch(`${MP_API_URL}/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${mercadoPagoAccessToken()}` },
      signal: AbortSignal.timeout(12000),
    });
    payment = await response.json();
  } catch { return jsonResponse({ error: "provider_unreachable" }, 503); }
  if (!response.ok || !payment || typeof payment !== "object") return jsonResponse({ error: "payment_lookup_failed" }, 502);
  const ref = payment.external_reference;
  if (typeof ref !== "string" || !/^[0-9a-f-]{36}$/i.test(ref)) return jsonResponse({ ok: true, ignored: true });
  const db = adminClient();
  const { data: order, error } = await db.from("pr_uniform_orders").select("*").eq("id", ref).maybeSingle();
  if (error) return jsonResponse({ error: "order_lookup_failed" }, 500);
  if (!order || !order.provider_preference_id) return jsonResponse({ ok: true, ignored: true });
  if (order.provider_payment_id && String(order.provider_payment_id) !== String(payment.id)) return jsonResponse({ error: "different_payment_for_order" }, 409);
  if (payment.currency_id !== "UYU" || Math.abs(Number(payment.transaction_amount) - Number(order.total)) >= 0.01) return jsonResponse({ error: "payment_mismatch" }, 409);
  const status = payment.status;
  if (!["approved", "rejected", "refunded"].includes(String(status))) return jsonResponse({ ok: true, pending: true });
  if (order.payment_status === "approved" && status !== "refunded") return jsonResponse({ ok: true, alreadyProcessed: true });
  if (order.payment_status === "refunded") return jsonResponse({ ok: true, alreadyProcessed: true });
  const { error: updateError } = await db.from("pr_uniform_orders").update({
    payment_status: status,
    provider_payment_id: String(payment.id),
    paid_at: status === "approved" ? new Date().toISOString() : order.paid_at,
  }).eq("id", order.id);
  if (updateError) return jsonResponse({ error: "payment_update_failed" }, 500);
  return jsonResponse({ ok: true });
});
