// POST /api/demo  -> recibe el pedido de demo, lo guarda y avisa por email.
import { json, error, leerJson, origenValido, telefonoValido, emailValido, limpiar, limitar } from "./_comun.js";

const DESTINO_POR_DEFECTO = "agustin@guidelia.com.ar";

const VISITAS = ["Menos de 5.000", "De 5.000 a 10.000", "De 10.000 a 30.000", "Más de 30.000"];
const PLATAFORMAS = ["WooCommerce", "Tiendanube", "Shopify", "Otra"];

export async function onRequestPost({ request, env }) {
  if (!origenValido(request)) return error("origen", "Pedido no permitido.", 403);
  let c;
  try {
    c = await leerJson(request, 6000);
  } catch {
    return error("pedido", "Pedido inválido.");
  }
  // Campo trampa: las personas no lo ven ni lo completan; los robots sí.
  if (c.sitio_web) return json({ ok: true });

  const nombre = limpiar(c.nombre, 80);
  const tienda = limpiar(c.tienda, 120);
  const email = limpiar(c.email, 120);
  const plataforma = PLATAFORMAS.includes(c.plataforma) ? c.plataforma : null;
  const visitas = VISITAS.includes(c.visitas) ? c.visitas : null;
  if (!nombre || !tienda || !emailValido(email) || !plataforma || !visitas) return error("datos", "Revisá los datos del formulario.");
  if (!telefonoValido(c.telefono)) return error("telefono", "Revisá el número de teléfono.");
  const ip = request.headers.get("CF-Connecting-IP") || "sin-ip";
  if (!(await limitar(env, `demo:${ip}`, 5, 3600))) return error("limite", "Enviaste varios pedidos seguidos. Probá más tarde.", 429);

  const lead = { nombre, tienda, email, telefono: c.telefono, plataforma, visitas, fecha: new Date().toISOString(), pais: request.headers.get("CF-IPCountry") || "" };
  if (env.LEADS) await env.LEADS.put(`lead:${lead.fecha}:${crypto.randomUUID().slice(0, 8)}`, JSON.stringify(lead));

  const texto = [
    "Nuevo pedido de demo de Guidelia",
    "",
    `Nombre: ${nombre}`,
    `Tienda: ${tienda}`,
    `Email: ${email}`,
    `Teléfono: ${c.telefono}`,
    `Plataforma: ${plataforma}`,
    `Visitas mensuales estimadas: ${visitas}`,
    `Fecha: ${lead.fecha}${lead.pais ? ` · País: ${lead.pais}` : ""}`,
  ].join("\n");
  const destino = env.EMAIL_DESTINO || DESTINO_POR_DEFECTO;
  const asunto = `Demo: ${tienda} (${plataforma}, ${visitas} visitas)`;
  let enviado = false;
  let detalle = "";
  try {
    if (env.APPS_SCRIPT_URL) {
      const res = await fetch(env.APPS_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ asunto, texto, responderA: email }), redirect: "follow" });
      enviado = res.ok && (await res.json().catch(() => ({}))).ok === true;
    } else if (env.RESEND_API_KEY) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: env.EMAIL_ORIGEN || "Guidelia <onboarding@resend.dev>", to: [destino], reply_to: email, subject: asunto, text: texto }),
      });
      enviado = res.ok;
    } else {
      // Sin configurar nada: se usa FormSubmit, un servicio gratuito que reenvía el formulario al mail de destino.
      // La primera vez manda un mail para activar la dirección (hay que tocar un botón una sola vez).
      const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(env.FORMSUBMIT_ID || destino)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Origin: "https://guidelia.com.ar", Referer: "https://guidelia.com.ar/" },
        body: JSON.stringify({ _subject: asunto, _replyto: email, _captcha: "false", _template: "table", Nombre: nombre, Tienda: tienda, Email: email, "Teléfono": c.telefono, Plataforma: plataforma, "Visitas mensuales": visitas, Fecha: lead.fecha, "País": lead.pais }),
      });
      const cuerpo = await res.json().catch(() => ({}));
      enviado = res.ok && String(cuerpo.success) === "true";
      if (!enviado) detalle = `formsubmit ${res.status}: ${String(cuerpo.message || "").slice(0, 200)}`;
    }
  } catch (err) {
    enviado = false;
    detalle = `excepción: ${String(err && err.message).slice(0, 160)}`;
  }
  // Se responde con 424 (no 502) para que Cloudflare no reemplace el mensaje por su página de error.
  if (!enviado && !env.LEADS) return json({ ok: false, codigo: "envio", error: "No pudimos registrar tu pedido. Probá de nuevo en un rato.", detalle }, 424);
  return json({ ok: true });
}
