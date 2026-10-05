import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  adminClient,
  corsHeaders,
  isAllowedBrowserOrigin,
  jsonResponse,
  markRegistrationFromPayment,
  mercadoPagoAccessToken,
  mercadoPagoEnvironment,
  MP_API_URL,
  normalizePaymentState,
  safeProviderCode,
  type RegistrationType,
} from "../_shared/mercadopago.ts";
import { classAccessForRegistration, type ClassAccessItem } from "../_shared/classAccess.ts";

type CardPayload = {
  registrationType?: unknown;
  registrationId?: unknown;
  token?: unknown;
  payment_method_id?: unknown;
  payment_type_id?: unknown;
  installments?: unknown;
  payer?: unknown;
};

type Payer = {
  email?: string;
  identification?: { type?: string; number?: string };
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const identifierPattern = /^[a-z0-9_-]{1,64}$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validRegistrationType(value: unknown): value is RegistrationType {
  return value === "inscripciones_2026" || value === "clinica_oct_2026";
}

function parsePayer(value: unknown): Payer {
  if (!value || typeof value !== "object") return {};
  const source = value as Record<string, unknown>;
  const result: Payer = {};
  if (typeof source.email === "string" && emailPattern.test(source.email) && source.email.length <= 254) {
    result.email = source.email;
  }
  if (source.identification && typeof source.identification === "object") {
    const identification = source.identification as Record<string, unknown>;
    if (
      typeof identification.type === "string" && identifierPattern.test(identification.type) &&
      typeof identification.number === "string" && /^[0-9A-Za-z.-]{3,30}$/.test(identification.number)
    ) {
      result.identification = {
        type: identification.type,
        number: identification.number,
      };
    }
  }
  return result;
}

function readPaymentResult(order: Record<string, unknown>) {
  const transactions = order.transactions && typeof order.transactions === "object"
    ? order.transactions as Record<string, unknown>
    : {};
  const payments = Array.isArray(transactions.payments) ? transactions.payments : [];
  const payment = payments[0] && typeof payments[0] === "object"
    ? payments[0] as Record<string, unknown>
    : {};

  const providerStatus = typeof order.status === "string"
    ? order.status
    : typeof payment.status === "string" ? payment.status : null;
  const providerStatusDetail = typeof order.status_detail === "string"
    ? order.status_detail
    : typeof payment.status_detail === "string" ? payment.status_detail : null;

  return {
    providerOrderId: typeof order.id === "string" ? order.id : null,
    providerPaymentId: typeof payment.id === "string" ? payment.id : null,
    providerStatus,
    providerStatusDetail,
    paymentState: normalizePaymentState(providerStatus, providerStatusDetail),
  };
}

function escapeHtml(value: unknown): string {
  return String(value ?? "-")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

async function notifyPaidRegistration(
  supabase: ReturnType<typeof adminClient>,
  attempt: { id: string; registrationType: RegistrationType; registrationId: string; amount: number; paymentId: string | null },
): Promise<void> {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return;
  const { data: claimed, error: claimError } = await supabase
    .rpc("claim_pr_mp_payment_notification", { p_attempt_id: attempt.id });
  if (claimError || claimed !== true) return;

  const table = attempt.registrationType === "inscripciones_2026"
    ? "pr_inscripciones_2026"
    : "pr_clinica_oct_2026_inscripciones";
  const { data, error } = await supabase.from(table).select("*").eq("id", attempt.registrationId).maybeSingle();
  if (error || !data) {
    await supabase.from("pr_mercadopago_payments").update({ payment_notification_claimed_at: null }).eq("id", attempt.id);
    return;
  }

  const program = attempt.registrationType === "clinica_oct_2026"
    ? "Clínica Internacional Miguel Flores"
    : data.modalidad === "kids" ? "PR Kids" : data.modalidad === "grupales" ? "Adultos · Clases Grupales" : "Personalizadas 1 a 1";
  const amount = attempt.amount.toLocaleString("es-UY");
  const adminEmail = Deno.env.get("PAYMENT_NOTIFICATION_EMAIL") ?? "claudiofaccelli@gmail.com";
  const customerEmail = typeof data.email === "string" && /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(data.email.trim()) ? data.email.trim().toLowerCase() : null;

  const schedule = attempt.registrationType === "clinica_oct_2026"
    ? "<p><strong>Fechas:</strong> 28, 29 y 30 de octubre de 2026</p><p><strong>Modalidad:</strong> Clínica completa · 3 jornadas</p>"
    : data.modalidad === "kids"
      ? `<p><strong>Horario:</strong> ${escapeHtml(data.turno_sabado || "Sábado 19:00–20:00 · Pista cerrada Maldonado")}</p>`
      : data.modalidad === "grupales"
        ? `<p><strong>Encuentro incluido:</strong> Miércoles 19:30–20:30 · Parada 2, Punta del Este</p><p><strong>Turno sábado:</strong> ${escapeHtml(data.turno_sabado)}</p>`
        : "<p><strong>Modalidad:</strong> Personalizadas 1 a 1</p><p>Los horarios disponibles se habilitan semanalmente para que elijas tu turno.</p>";

  const adminHtml = `<!doctype html><html><body style="margin:0;background:#f5f6f8;font-family:Arial,sans-serif;color:#111"><div style="max-width:620px;margin:auto;padding:24px"><div style="background:#fff;border:1px solid #e6e6ea;border-radius:22px;padding:30px"><div style="font-size:12px;font-weight:900;letter-spacing:1.4px;color:#00a650">PUNTA ROLLERS · PAGO ACREDITADO</div><h1 style="font-size:26px;margin:10px 0 18px">${escapeHtml(program)}</h1><p><strong>Alumno/a:</strong> ${escapeHtml(data.nombre_completo)}</p><p><strong>Monto:</strong> ${escapeHtml(amount)} UYU</p><p><strong>WhatsApp:</strong> ${escapeHtml(data.telefono)}</p><p><strong>Email:</strong> ${escapeHtml(data.email)}</p>${schedule}<p><strong>ID de inscripción:</strong> ${escapeHtml(attempt.registrationId)}</p><p><strong>ID de pago:</strong> ${escapeHtml(attempt.paymentId)}</p></div></div></body></html>`;
  const customerHtml = `<!doctype html><html><body style="margin:0;background:#0b0b0f;font-family:Arial,sans-serif;color:#fff"><div style="max-width:620px;margin:auto;padding:28px 16px"><div style="background:#15151c;border:1px solid #292934;border-radius:24px;padding:30px"><div style="color:#78df9a;font-size:12px;font-weight:900;letter-spacing:1.5px">PUNTA ROLLERS · PAGO ACREDITADO</div><h1 style="margin:10px 0 12px;font-size:30px">Tu lugar está confirmado ✓</h1><p style="color:#c8c8d1;line-height:1.6">Hola, <b>${escapeHtml(data.nombre_completo)}</b>. Mercado Pago confirmó correctamente tu pago de <b>${escapeHtml(amount)} UYU</b>.</p><div style="background:#101014;border-radius:16px;padding:18px;margin:22px 0"><p style="margin:0 0 10px"><b>${escapeHtml(program)}</b></p>${schedule}</div><p style="color:#c8c8d1;line-height:1.6">${attempt.registrationType === "clinica_oct_2026" ? "Tu inscripción a la clínica quedó confirmada." : data.modalidad === "personalizadas" ? "Tu cuponera quedó confirmada. Vas a poder elegir tus horarios dentro de la disponibilidad semanal." : "Tu inscripción quedó confirmada. Te esperamos sobre ruedas."}</p><p style="margin-top:24px;color:#777784;font-size:12px">Punta Rollers · No es solo patinar, es pertenecer.</p></div></div></body></html>`;

  const batch = [{ from: "Punta Rollers <hola@puntarollers.com>", to: [adminEmail], subject: `✅ Pago acreditado — ${program} — ${data.nombre_completo}`, html: adminHtml }];
  if (customerEmail) batch.push({ from: "Punta Rollers <hola@puntarollers.com>", to: [customerEmail], subject: `✓ Pago acreditado · ${program}`, html: customerHtml });

  const response = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(batch),
    signal: AbortSignal.timeout(8_000),
  }).catch(() => null);

  await supabase.from("pr_mercadopago_payments").update(response?.ok
    ? { payment_notification_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    : { payment_notification_claimed_at: null, updated_at: new Date().toISOString() })
    .eq("id", attempt.id);
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: isAllowedBrowserOrigin(origin) ? 204 : 403, headers });
  }
  if (req.method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405, headers);
  if (!isAllowedBrowserOrigin(origin)) return jsonResponse({ error: "origin_not_allowed" }, 403, headers);

  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (contentLength > 20_000) return jsonResponse({ error: "request_too_large" }, 413, headers);

  let payload: CardPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400, headers);
  }

  if (!validRegistrationType(payload.registrationType)) {
    return jsonResponse({ error: "invalid_registration_type" }, 400, headers);
  }
  if (typeof payload.registrationId !== "string" || !uuidPattern.test(payload.registrationId)) {
    return jsonResponse({ error: "invalid_registration_id" }, 400, headers);
  }
  if (typeof payload.token !== "string" || payload.token.length < 10 || payload.token.length > 2048) {
    return jsonResponse({ error: "invalid_card_token" }, 400, headers);
  }
  if (typeof payload.payment_method_id !== "string" || !identifierPattern.test(payload.payment_method_id)) {
    return jsonResponse({ error: "invalid_payment_method" }, 400, headers);
  }
  if (typeof payload.payment_type_id !== "string" || !identifierPattern.test(payload.payment_type_id)) {
    return jsonResponse({ error: "invalid_payment_type" }, 400, headers);
  }
  if (!Number.isInteger(payload.installments) || Number(payload.installments) < 1 || Number(payload.installments) > 24) {
    return jsonResponse({ error: "invalid_installments" }, 400, headers);
  }

  const registrationType = payload.registrationType;
  const registrationId = payload.registrationId;
  const payerFromBrick = parsePayer(payload.payer);
  const supabase = adminClient();

  let amount: number;
  let registrationEmail: string | null = null;
  let classAccess: ClassAccessItem[] = [];

  if (registrationType === "inscripciones_2026") {
    const { data, error } = await supabase
      .from("pr_inscripciones_2026")
      .select("id, email, monto, monto_final, estado, modalidad, turno_sabado")
      .eq("id", registrationId)
      .maybeSingle();
    if (error || !data) return jsonResponse({ error: "registration_not_found" }, 404, headers);
    if (["pago_verificado", "confirmado", "cancelado"].includes(data.estado)) {
      return jsonResponse({ error: "registration_not_payable" }, 409, headers);
    }
    amount = Number(data.monto_final ?? data.monto);
    registrationEmail = typeof data.email === "string" ? data.email : null;
    classAccess = classAccessForRegistration(data.modalidad, data.turno_sabado);
  } else {
    const { data, error } = await supabase
      .from("pr_clinica_oct_2026_inscripciones")
      .select("id, email, monto, estado, opcion_pago")
      .eq("id", registrationId)
      .maybeSingle();
    if (error || !data) return jsonResponse({ error: "registration_not_found" }, 404, headers);
    if (data.opcion_pago !== "pagar_ahora" || ["confirmado", "lista_espera", "cancelado"].includes(data.estado)) {
      return jsonResponse({ error: "registration_not_payable" }, 409, headers);
    }
    amount = Number(data.monto);
    registrationEmail = typeof data.email === "string" ? data.email : null;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return jsonResponse({ error: "invalid_registration_amount" }, 409, headers);
  }

  const attemptId = crypto.randomUUID();
  const environment = mercadoPagoEnvironment();
  const { error: insertError } = await supabase.from("pr_mercadopago_payments").insert({
    id: attemptId,
    registration_type: registrationType,
    registration_id: registrationId,
    amount,
    currency: "UYU",
    environment,
    idempotency_key: attemptId,
    external_reference: attemptId,
    payment_state: "created",
    payment_method_id: payload.payment_method_id,
    payment_type: payload.payment_type_id,
    installments: Number(payload.installments),
  });

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: existing } = await supabase
        .from("pr_mercadopago_payments")
        .select("id, payment_state, provider_status, provider_status_detail")
        .eq("registration_type", registrationType)
        .eq("registration_id", registrationId)
        .in("payment_state", ["created", "pending", "paid", "review"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return jsonResponse({
        error: "payment_already_started",
        attemptId: existing?.id ?? null,
        paymentState: existing?.payment_state ?? "pending",
        status: existing?.provider_status ?? null,
        statusDetail: existing?.provider_status_detail ?? null,
      }, 409, headers);
    }
    return jsonResponse({ error: "could_not_create_payment_attempt" }, 500, headers);
  }

  const payer: Record<string, unknown> = {};
  const email = registrationEmail && emailPattern.test(registrationEmail)
    ? registrationEmail
    : payerFromBrick.email;
  if (email) payer.email = email;
  if (payerFromBrick.identification) payer.identification = payerFromBrick.identification;

  const orderBody = {
    type: "online",
    processing_mode: "automatic",
    total_amount: amount.toFixed(2),
    external_reference: attemptId,
    payer,
    transactions: {
      payments: [{
        amount: amount.toFixed(2),
        payment_method: {
          id: payload.payment_method_id,
          type: payload.payment_type_id,
          token: payload.token,
          installments: Number(payload.installments),
        },
      }],
    },
  };

  let providerResponse: Response;
  let providerPayload: unknown;
  try {
    providerResponse = await fetch(`${MP_API_URL}/v1/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mercadoPagoAccessToken()}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": attemptId,
      },
      body: JSON.stringify(orderBody),
      signal: AbortSignal.timeout(15_000),
    });
    providerPayload = await providerResponse.json().catch(() => ({}));
  } catch {
    await supabase.from("pr_mercadopago_payments").update({
      payment_state: "pending",
      failure_code: "provider_unreachable",
      updated_at: new Date().toISOString(),
    }).eq("id", attemptId);
    return jsonResponse({
      attemptId,
      paymentState: "pending",
      message: "No pudimos confirmar el resultado todavía. La inscripción quedó guardada.",
    }, 202, headers);
  }

  if (!providerResponse.ok || !providerPayload || typeof providerPayload !== "object") {
    const failureCode = safeProviderCode(providerPayload, `http_${providerResponse.status}`);
    const uncertain = providerResponse.status >= 500;
    await supabase.from("pr_mercadopago_payments").update({
      payment_state: uncertain ? "pending" : "failed",
      failure_code: failureCode,
      updated_at: new Date().toISOString(),
    }).eq("id", attemptId);
    return jsonResponse({
      error: uncertain ? "payment_result_pending" : "payment_rejected",
      attemptId,
      paymentState: uncertain ? "pending" : "failed",
      providerCode: failureCode,
      message: uncertain
        ? "No pudimos confirmar el resultado todavía. La inscripción quedó guardada."
        : "El pago no pudo procesarse. La inscripción quedó guardada y podés intentar nuevamente.",
    }, uncertain ? 202 : 422, headers);
  }

  const result = readPaymentResult(providerPayload as Record<string, unknown>);
  await supabase.from("pr_mercadopago_payments").update({
    provider_order_id: result.providerOrderId,
    provider_payment_id: result.providerPaymentId,
    provider_status: result.providerStatus,
    provider_status_detail: result.providerStatusDetail,
    payment_state: result.paymentState,
    paid_at: result.paymentState === "paid" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq("id", attemptId);

  await markRegistrationFromPayment(supabase, registrationType, registrationId, result.paymentState);
  if (result.paymentState === "paid") {
    await notifyPaidRegistration(supabase, {
      id: attemptId,
      registrationType,
      registrationId,
      amount,
      paymentId: result.providerPaymentId,
    });
  }

  return jsonResponse({
    attemptId,
    orderId: result.providerOrderId,
    paymentId: result.providerPaymentId,
    paymentState: result.paymentState,
    status: result.providerStatus,
    statusDetail: result.providerStatusDetail,
    registrationSaved: true,
    classAccess: result.paymentState === "paid" ? classAccess : [],
  }, result.paymentState === "pending" ? 202 : 200, headers);
});
