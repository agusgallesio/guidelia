// POST /api/telefono-confirmar  { telefono, codigo }  -> si el código es correcto, devuelve una constancia firmada.
import { json, error, leerJson, origenValido, telefonoValido, limitar, twilio, verificacionConfigurada, crearConstancia } from "./_comun.js";

export async function onRequestPost({ request, env }) {
  if (!origenValido(request)) return error("origen", "Pedido no permitido.", 403);
  if (!verificacionConfigurada(env)) return error("no_configurado", "La verificación todavía no está disponible.", 503);
  let cuerpo;
  try {
    cuerpo = await leerJson(request);
  } catch {
    return error("pedido", "Pedido inválido.");
  }
  if (!telefonoValido(cuerpo.telefono) || !/^\d{4,8}$/.test(String(cuerpo.codigo || ""))) return error("pedido", "Revisá el código.");
  if (!(await limitar(env, `conf:${cuerpo.telefono}`, 10, 3600))) return error("limite", "Demasiados intentos. Pedí un código nuevo más tarde.", 429);
  const r = await twilio(env, "VerificationCheck", { To: cuerpo.telefono, Code: String(cuerpo.codigo) });
  if (!r.ok || r.datos.status !== "approved") return error("codigo", "El código no es correcto o venció.", 400);
  return json({ ok: true, constancia: await crearConstancia(cuerpo.telefono, env.FIRMA_SECRETO) });
}
