// POST /api/telefono-enviar  { telefono: "+5491123456789" }  -> manda el código por SMS.
import { json, error, leerJson, origenValido, telefonoValido, limitar, twilio, verificacionConfigurada } from "./_comun.js";

export async function onRequestPost({ request, env }) {
  if (!origenValido(request)) return error("origen", "Pedido no permitido.", 403);
  if (!verificacionConfigurada(env)) return error("no_configurado", "La verificación todavía no está disponible.", 503);
  let cuerpo;
  try {
    cuerpo = await leerJson(request);
  } catch {
    return error("pedido", "Pedido inválido.");
  }
  if (!telefonoValido(cuerpo.telefono)) return error("telefono", "Revisá el número de teléfono.");
  const ip = request.headers.get("CF-Connecting-IP") || "sin-ip";
  if (!(await limitar(env, `tel:${cuerpo.telefono}`, 3, 3600)) || !(await limitar(env, `ip:${ip}`, 10, 3600))) {
    return error("limite", "Pediste demasiados códigos. Probá de nuevo en una hora.", 429);
  }
  const r = await twilio(env, "Verifications", { To: cuerpo.telefono, Channel: "sms", Locale: "es" });
  if (!r.ok) return error("envio", "No pudimos enviar el código. Revisá el número y probá de nuevo.", 502);
  return json({ ok: true });
}
