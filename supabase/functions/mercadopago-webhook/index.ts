import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  adminClient,
  jsonResponse,
  markRegistrationFromPayment,
  mercadoPagoAccessToken,
  MP_API_URL,
  normalizePaymentState,
  type RegistrationType,
} from "../_shared/mercadopago.ts";

function parseSignature(header: string): { ts: string; hashes: string[] } | null {
  const parts = header.split(",").map((part) => part.trim());
  const ts = parts.find((part) => part.startsWith("ts="))?.slice(3);
  const hashes = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3).toLowerCase());
  if (!ts || !/^\d+$/.test(ts) || hashes.length === 0) return null;
  return { ts, hashes };
}

function toHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function timingSafeHexEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

async function validSignature(
  dataId: string,
  requestId: string,
  signatureHeader: string,
  secret: string,
): Promise<boolean> {
  const parsed = parseSignature(signatureHeader);
  if (!parsed) return false;
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${parsed.ts};`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = toHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest)));
  return parsed.hashes.some((hash) => timingSafeHexEqual(digest, hash));
}

function paymentResult(order: Record<string, unknown>) {
  const transactions = order.transactions && typeof order.transactions === "object"
    ? order.transactions as Record<string, unknown>
    : {};
  const payments = Array.isArray(transactions.payments) ? transactions.payments : [];
  const payment = payments[0] && typeof payments[0] === "object"
    ? payments[0] as Record<string, unknown>
    : {};
  const status = typeof order.status === "string"
    ? order.status
    : typeof payment.status === "string" ? payment.status : null;
  const statusDetail = typeof order.status_detail === "string"
    ? order.status_detail
    : typeof payment.status_detail === "string" ? payment.status_detail : null;
  return {
    externalReference: typeof order.external_reference === "string" ? order.external_reference : null,
    providerOrderId: typeof order.id === "string" ? order.id : null,
    providerPaymentId: typeof payment.id === "string" ? payment.id : null,
    totalAmount: Number(order.total_amount),
    status,
    statusDetail,
    state: normalizePaymentState(status, statusDetail),
  };
}

function escapeHtml(value: unknown): string {
  return String(value ?? "-")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendPaymentNotification(
  supabase: ReturnType<typeof adminClient>,
  attempt: {
    id: string;
    registration_type: RegistrationType;
    registration_id: string;
    amount: number | string;
    provider_payment_id?: string | null;
  },
): Promise<boolean> {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return false;

  const { data: claimed, error: claimError } = await supabase
    .rpc("claim_pr_mp_payment_notification", { p_attempt_id: attempt.id });
  if (claimError || claimed !== true) return !claimError;

  let name = "-";
  let program = "Inscripción Punta Rollers";
  let phone = "-";
  let email = "-";

  if (attempt.registration_type === "inscripciones_2026") {
    const { data, error } = await supabase
      .from("pr_inscripciones_2026")
      .select("nombre_completo, modalidad, telefono, email")
      .eq("id", attempt.registration_id)
      .maybeSingle();
    if (error || !data) {
      await supabase.from("pr_mercadopago_payments")
        .update({ payment_notification_claimed_at: null })
        .eq("id", attempt.id);
      return false;
    }
    name = data.nombre_completo;
    phone = data.telefono;
    email = data.email;
    program = data.modalidad === "kids"
      ? "PR Kids"
      : data.modalidad === "grupales" ? "Adultos" : "Personalizadas";
  } else {
    const { data, error } = await supabase
      .from("pr_clinica_oct_2026_inscripciones")
      .select("nombre_completo, telefono, email")
      .eq("id", attempt.registration_id)
      .maybeSingle();
    if (error || !data) {
      await supabase.from("pr_mercadopago_payments")
        .update({ payment_notification_claimed_at: null })
        .eq("id", attempt.id);
      return false;
    }
    name = data.nombre_completo;
    phone = data.telefono;
    email = data.email ?? "-";
    program = "Clínica de Octubre";
  }

  const amount = Number(attempt.amount).toLocaleString("es-UY");
  const subject = `✅ Pago Mercado Pago acreditado — ${program} — ${name}`;
  const html = `
    <div style="font-family:Arial,sans-serif;background:#f6f7f9;padding:24px;color:#151515">
      <div style="max-width:620px;margin:auto;background:white;border-radius:18px;padding:28px;border:1px solid #ececec">
        <div style="font-size:13px;font-weight:700;color:#00a650;letter-spacing:.08em;text-transform:uppercase">Punta Rollers · Pago acreditado</div>
        <h1 style="font-size:24px;margin:8px 0 20px">${escapeHtml(program)}</h1>
        <p><strong>Alumno/a:</strong> ${escapeHtml(name)}</p>
        <p><strong>Monto:</strong> $${escapeHtml(amount)} UYU</p>
        <p><strong>WhatsApp:</strong> ${escapeHtml(phone)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>ID de inscripción:</strong> ${escapeHtml(attempt.registration_id)}</p>
        <p><strong>ID de pago:</strong> ${escapeHtml(attempt.provider_payment_id)}</p>
        <p style="color:#777"><strong>Fecha:</strong> ${escapeHtml(new Date().toLocaleString("es-UY", { timeZone: "America/Montevideo" }))}</p>
      </div>
    </div>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Punta Rollers <onboarding@resend.dev>",
      to: [Deno.env.get("PAYMENT_NOTIFICATION_EMAIL") ?? "claudiofaccelli@gmail.com"],
      subject,
      html,
    }),
    signal: AbortSignal.timeout(8_000),
  }).catch(() => null);

  if (!response?.ok) {
    await supabase.from("pr_mercadopago_payments")
      .update({ payment_notification_claimed_at: null, updated_at: new Date().toISOString() })
      .eq("id", attempt.id);
    return false;
  }

  await supabase.from("pr_mercadopago_payments").update({
    payment_notification_sent_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", attempt.id);
  return true;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return jsonResponse({ ok: false, error: "method_not_allowed" }, 405);

  const url = new URL(req.url);
  const signature = req.headers.get("x-signature");
  const requestId = req.headers.get("x-request-id");
  const dataIdFromQuery = url.searchParams.get("data.id");

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // The signed data id in the query string remains authoritative.
  }

  const bodyData = body.data && typeof body.data === "object" ? body.data as Record<string, unknown> : {};
  const dataId = dataIdFromQuery ?? (typeof bodyData.id === "string" ? bodyData.id : null);
  const topic = typeof body.type === "string" ? body.type : url.searchParams.get("type");
  const webhookSecret = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET");

  if (!dataId || !/^ORD[0-9A-Za-z_-]{3,100}$/i.test(dataId)) {
    return jsonResponse({ ok: false, error: "invalid_notification" }, 400);
  }
  if (topic && topic !== "order") return jsonResponse({ ok: true, ignored: true });
  if (!signature || !requestId || !webhookSecret) {
    return jsonResponse({ ok: false, error: "webhook_not_configured" }, 503);
  }
  if (!(await validSignature(dataId, requestId, signature, webhookSecret))) {
    return jsonResponse({ ok: false, error: "invalid_signature" }, 401);
  }

  let orderResponse: Response;
  let order: unknown;
  try {
    orderResponse = await fetch(`${MP_API_URL}/v1/orders/${encodeURIComponent(dataId)}`, {
      headers: { "Authorization": `Bearer ${mercadoPagoAccessToken()}` },
      signal: AbortSignal.timeout(10_000),
    });
    order = await orderResponse.json().catch(() => ({}));
  } catch {
    return jsonResponse({ ok: false, error: "provider_unreachable" }, 500);
  }

  if (!orderResponse.ok || !order || typeof order !== "object") {
    return jsonResponse({ ok: false, error: "order_lookup_failed" }, 500);
  }

  const result = paymentResult(order as Record<string, unknown>);
  const supabase = adminClient();
  let query = supabase
    .from("pr_mercadopago_payments")
    .select("id, registration_type, registration_id, amount, payment_state, provider_payment_id")
    .limit(1);
  query = result.externalReference
    ? query.eq("external_reference", result.externalReference)
    : query.eq("provider_order_id", dataId);
  const { data: attempt, error } = await query.maybeSingle();

  if (error) return jsonResponse({ ok: false, error: "payment_lookup_failed" }, 500);
  if (!attempt) return jsonResponse({ ok: true, ignored: true });

  if (!Number.isFinite(result.totalAmount) || Math.abs(result.totalAmount - Number(attempt.amount)) >= 0.01) {
    await supabase.from("pr_mercadopago_payments").update({
      provider_order_id: result.providerOrderId ?? dataId,
      provider_payment_id: result.providerPaymentId,
      provider_status: result.status,
      provider_status_detail: result.statusDetail,
      payment_state: "review",
      failure_code: "amount_mismatch",
      webhook_received_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", attempt.id);
    return jsonResponse({ ok: true, review: true });
  }

  const effectiveState = attempt.payment_state === "paid" ? "paid" : result.state;
  const paidAt = effectiveState === "paid"
    ? (attempt.payment_state === "paid" ? undefined : new Date().toISOString())
    : null;
  const update: Record<string, unknown> = {
    provider_order_id: result.providerOrderId ?? dataId,
    provider_payment_id: result.providerPaymentId,
    provider_status: result.status,
    provider_status_detail: result.statusDetail,
    payment_state: effectiveState,
    webhook_received_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (paidAt !== undefined) update.paid_at = paidAt;

  const { error: updateError } = await supabase
    .from("pr_mercadopago_payments")
    .update(update)
    .eq("id", attempt.id);
  if (updateError) return jsonResponse({ ok: false, error: "payment_update_failed" }, 500);

  await markRegistrationFromPayment(
    supabase,
    attempt.registration_type as RegistrationType,
    attempt.registration_id,
    effectiveState,
  );

  if (effectiveState === "paid") {
    const notificationSent = await sendPaymentNotification(supabase, {
      id: attempt.id,
      registration_type: attempt.registration_type as RegistrationType,
      registration_id: attempt.registration_id,
      amount: attempt.amount,
      provider_payment_id: result.providerPaymentId ?? attempt.provider_payment_id,
    });
    if (!notificationSent) return jsonResponse({ ok: false, error: "payment_notification_failed" }, 500);
  }

  return jsonResponse({ ok: true });
});
