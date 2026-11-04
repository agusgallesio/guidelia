// POST /api/demo  -> recibe el pedido de demo, lo guarda y avisa por email.
import { json, error, leerJson, origenValido, telefonoValido, emailValido, limpiar, limitar } from "./_comun.js";

const DESTINO_POR_DEFECTO = "agustin@guidelia.com.ar";

const VISITAS = ["Menos de 5.000", "De 5.000 a 10.000", "De 10.000 a 30.000", "Más de 30.000"];
const PLATAFORMAS = ["WooCommerce", "Tiendanube", "Shopify", "Otra"];

export async function onRequestPost({ request, env }) {
  if (!origenValido(request)) return error("origen", "Pedido no permitido.", 403);
  // El aviso sale por un script de Google (APPS_SCRIPT_URL) o por Resend (RESEND_API_KEY). Sin ninguno, no hay a dónde mandarlo.
  if (!env.APPS_SCRIPT_URL && !env.RESEND_API_KEY) return error("no_configurado", "El formulario todavía no está disponible.", 503);
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
  try {
    if (env.APPS_SCRIPT_URL) {
      const res = await fetch(env.APPS_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ asunto, texto, responderA: email }), redirect: "follow" });
      enviado = res.ok && (await res.json().catch(() => ({}))).ok === true;
    } else {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: env.EMAIL_ORIGEN || "Guidelia <onboarding@resend.dev>", to: [destino], reply_to: email, subject: asunto, text: texto }),
      });
      enviado = res.ok;
    }
  } catch {
    enviado = false;
  }
  if (!enviado && !env.LEADS) return error("envio", "No pudimos registrar tu pedido. Probá de nuevo en un rato.", 502);
  return json({ ok: true });
}
