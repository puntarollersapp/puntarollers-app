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
  const string = (key: string, max = 160) => typeof body[key] === "string" ? String(body[key]).trim().slice(0, max) : "";
  const productId = string("productId", 40);
  const name = string("name", 120);
  const email = string("email", 254).toLowerCase();
  const phone = string("phone", 35);
  const model = string("model", 100);
  const color = string("color", 100);
  const size = string("size", 50);
  const notes = string("notes", 500);
  const quantity = Number(body.quantity);
  if (!/^[0-9a-f-]{36}$/i.test(productId) || name.length < 3 || !validEmail.test(email) ||
      phone.length < 6 || !size || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    return jsonResponse({ error: "invalid_order" }, 400, headers);
  }
  const db = adminClient();
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
    product_id: product.id, product_name: product.nombre, model: model || null,
    color: color || null, size, quantity, unit_price: price, total: price * quantity,
    buyer_name: name, buyer_email: email, buyer_phone: phone, notes: notes || null,
    payment_method: "transfer", payment_status: "pending",
  }).select("id,total").single();
  if (insertError || !order) return jsonResponse({ error: "could_not_save_order" }, 500, headers);
  return jsonResponse({ orderId: order.id, amount: order.total, paymentStatus: "pending" }, 201, headers);
});
