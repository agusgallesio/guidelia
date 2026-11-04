// Utilidades compartidas por las funciones del formulario de demo (Cloudflare Pages Functions).
// Variables (se cargan en Cloudflare Pages > Settings > Variables and Secrets):
//   APPS_SCRIPT_URL                 dirección del script de Google que manda el aviso por email (ver aviso-por-email.gs)
//   (o RESEND_API_KEY, EMAIL_DESTINO, EMAIL_ORIGEN si se prefiere Resend)
//   LEADS (opcional, KV)            guarda cada contacto y limita pedidos repetidos

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

// Límite de pedidos por clave (número de teléfono o IP). Si no hay KV configurado, no limita (Twilio igual limita).
export async function limitar(env, clave, maximo, segundos) {
  if (!env.LEADS) return true;
  const k = `limite:${clave}`;
  const n = Number((await env.LEADS.get(k)) || 0);
  if (n >= maximo) return false;
  await env.LEADS.put(k, String(n + 1), { expirationTtl: segundos });
  return true;
}
