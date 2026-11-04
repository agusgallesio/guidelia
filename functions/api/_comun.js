// Utilidades compartidas por las funciones del formulario de demo (Cloudflare Pages Functions).
// Secretos necesarios (se cargan en Cloudflare Pages > Settings > Variables and Secrets):
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SID   verificación del teléfono por SMS
//   FIRMA_SECRETO                                               texto largo y al azar para firmar la verificación
//   RESEND_API_KEY, EMAIL_DESTINO, EMAIL_ORIGEN                 aviso por email de cada contacto nuevo
//   LEADS (opcional, KV)                                        guarda cada contacto y limita pedidos repetidos

export const json = (datos, status = 200) =>
  new Response(JSON.stringify(datos), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });

export const error = (codigo, mensaje, status = 400) => json({ ok: false, codigo, error: mensaje }, status);

export async function leerJson(request, maxBytes = 4096) {
  const texto = await request.text();
  if (texto.length > maxBytes) throw new Error("grande");
  try {
    return JSON.parse(texto);
  } catch {
    throw new Error("json");
  }
}

// Solo se aceptan pedidos que nacen en el propio sitio.
export function origenValido(request) {
  const origen = request.headers.get("Origin");
  if (!origen) return true;
  try {
    return new URL(origen).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export const telefonoValido = (t) => typeof t === "string" && /^\+[1-9]\d{9,14}$/.test(t);
export const emailValido = (e) => typeof e === "string" && e.length <= 120 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(e);
export const limpiar = (v, max) => (typeof v === "string" ? v.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max) : "");

const enc = new TextEncoder();
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function firmar(texto, secreto) {
  const clave = await crypto.subtle.importKey("raw", enc.encode(secreto), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64(await crypto.subtle.sign("HMAC", clave, enc.encode(texto)));
}

// Constancia de que el teléfono se verificó: dura 30 minutos y solo sirve para ese número.
export async function crearConstancia(telefono, secreto) {
  const carga = `${telefono}|${Date.now() + 30 * 60 * 1000}`;
  return `${b64(enc.encode(carga))}.${await firmar(carga, secreto)}`;
}

export async function constanciaValida(constancia, telefono, secreto) {
  if (typeof constancia !== "string" || !secreto) return false;
  const [cargaB64, firma] = constancia.split(".");
  if (!cargaB64 || !firma) return false;
  let carga;
  try {
    carga = atob(cargaB64.replace(/-/g, "+").replace(/_/g, "/"));
  } catch {
    return false;
  }
  const [tel, vence] = carga.split("|");
  if (tel !== telefono || Number(vence) < Date.now()) return false;
  return (await firmar(carga, secreto)) === firma;
}

// Límite de pedidos por clave (número de teléfono o IP). Si no hay KV configurado, no limita (Twilio igual limita).
export async function limitar(env, clave, maximo, segundos) {
  if (!env.LEADS) return true;
  const k = `limite:${clave}`;
  const n = Number((await env.LEADS.get(k)) || 0);
  if (n >= maximo) return false;
  await env.LEADS.put(k, String(n + 1), { expirationTtl: segundos });
  return true;
}

export async function twilio(env, ruta, datos) {
  const auth = btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`);
  const res = await fetch(`https://verify.twilio.com/v2/Services/${env.TWILIO_VERIFY_SID}/${ruta}`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(datos),
  });
  return { ok: res.ok, status: res.status, datos: await res.json().catch(() => ({})) };
}

export const verificacionConfigurada = (env) => Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_VERIFY_SID && env.FIRMA_SECRETO);
