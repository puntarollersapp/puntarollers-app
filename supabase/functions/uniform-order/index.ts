import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { adminClient, jsonResponse } from "../_shared/mercadopago.ts";

const allowedPreview = /^https:\/\/puntarollers-[a-z0-9-]+-puntarollersapps-projects\.vercel\.app$/;
function isAllowedBrowserOrigin(origin: string | null): boolean {
  return !!origin && (origin === "https://puntarollers.com" || origin === "https://www.puntarollers.com" || allowedPreview.test(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin));
}
function corsHeaders(origin: string | null): Record<string,string> {
  return { "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin", ...(isAllowedBrowserOrigin(origin) ? { "Access-Control-Allow-Origin": origin! } : {}) };
}

const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);
  if (req.method === "OPTIONS") return new Response(null, { status: isAllowedBrowserOrigin(origin) ? 204 : 403, headers });
  if (req.method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405, headers);
  if (!isAllowedBrowserOrigin(origin)) return jsonResponse({ error: "origin_not_allowed" }, 403, headers);
  if (Number(req.headers.get("content-length") || 0) > 8000) return jsonResponse({ error: "too_large" }, 413, headers);
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return jsonResponse({ error: "invalid_json" }, 400, headers); }
  const string = (key: string) => typeof body[key] === "string" ? String(body[key]).trim() : "";
  const requestKey = string("requestKey");
  const productId = string("productId");
  const name = string("name");
  const email = string("email").toLowerCase();
  const phone = string("phone");
  const model = string("model");
  const color = string("color");
  const size = string("size");
  const notes = string("notes");
  const quantity = Number(body.quantity);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestKey) || !productId || productId.length > 100 || name.length < 3 || name.length > 120 || !validEmail.test(email) || email.length > 254 ||
      phone.length < 6 || phone.length > 35 || model.length > 100 || color.length > 100 || size.length > 50 || notes.length > 500 || !size || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    return jsonResponse({ error: "invalid_order" }, 400, headers);
  }
  const db = adminClient();
  const { data: previous } = await db.from("pr_uniform_orders").select("id,total,buyer_email,product_id,model,color,size,quantity,buyer_name,buyer_phone,notes").eq("request_key",requestKey).maybeSingle();
  const sameOrder = (item: Record<string, unknown>) => item.buyer_email === email && item.product_id === productId && item.model === (model || null) && item.color === (color || null) && item.size === size && Number(item.quantity) === quantity && item.buyer_name === name && item.buyer_phone === phone && item.notes === (notes || null);
  if (previous) {
    if (!sameOrder(previous)) return jsonResponse({ error: "request_key_conflict" }, 409, headers);
    return jsonResponse({ orderId: previous.id, amount: previous.total, paymentStatus: "pending" }, 200, headers);
  }
  const { data: product, error } = await db.from("productos_pr").select("*").eq("id", productId).eq("activo", true).maybeSingle();
  if (error || !product) return jsonResponse({ error: "product_unavailable" }, 404, headers);
  const options = (key: string): string[] => Array.isArray(product[key]) ? product[key] : [];
  if (!options("talles").includes(size) ||
      (options("modelos").length && !options("modelos").includes(model)) ||
      (options("colores").length && !options("colores").includes(color))) {
    return jsonResponse({ error: "invalid_variant" }, 400, headers);
  }
  const price = Number(product.precio);
  if (!Number.isFinite(price) || price <= 0) return jsonResponse({ error: "invalid_price" }, 409, headers);
  const { data: order, error: insertError } = await db.from("pr_uniform_orders").insert({
    request_key: requestKey, product_id: product.id, product_name: product.nombre, model: model || null,
    color: color || null, size, quantity, unit_price: price, total: price * quantity,
    buyer_name: name, buyer_email: email, buyer_phone: phone, notes: notes || null,
    payment_method: "transfer", payment_status: "pending",
  }).select("id,total").single();
  if (insertError?.code === "23505") {
    const { data: existing } = await db.from("pr_uniform_orders").select("id,total,buyer_email,product_id,model,color,size,quantity,buyer_name,buyer_phone,notes").eq("request_key",requestKey).maybeSingle();
    if (existing && sameOrder(existing)) return jsonResponse({ orderId: existing.id, amount: existing.total, paymentStatus: "pending" }, 200, headers);
    return jsonResponse({ error: "request_key_conflict" }, 409, headers);
  }
  if (insertError || !order) return jsonResponse({ error: "could_not_save_order" }, 500, headers);
  return jsonResponse({ orderId: order.id, amount: order.total, paymentStatus: "pending" }, 201, headers);
});
