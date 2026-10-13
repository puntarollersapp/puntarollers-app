import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { adminClient, corsHeaders, isAllowedBrowserOrigin, jsonResponse } from "../_shared/mercadopago.ts";

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
  const { data: previous } = await db.from("pr_uniform_orders").select("id,total,buyer_email,product_id").eq("request_key",requestKey).maybeSingle();
  if (previous) {
    if (previous.buyer_email !== email || previous.product_id !== productId) return jsonResponse({ error: "request_key_conflict" }, 409, headers);
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
    const { data: existing } = await db.from("pr_uniform_orders").select("id,total,buyer_email,product_id").eq("request_key",requestKey).maybeSingle();
    if (existing && existing.buyer_email === email && existing.product_id === productId) return jsonResponse({ orderId: existing.id, amount: existing.total, paymentStatus: "pending" }, 200, headers);
    return jsonResponse({ error: "request_key_conflict" }, 409, headers);
  }
  if (insertError || !order) return jsonResponse({ error: "could_not_save_order" }, 500, headers);
  return jsonResponse({ orderId: order.id, amount: order.total, paymentStatus: "pending" }, 201, headers);
});
