// POST /api/demo  -> recibe el pedido de demo (con el teléfono ya verificado), lo guarda y avisa por email.
import { json, error, leerJson, origenValido, telefonoValido, emailValido, limpiar, constanciaValida, limitar } from "./_comun.js";

const VISITAS = ["Menos de 5.000", "De 5.000 a 10.000", "De 10.000 a 30.000", "Más de 30.000"];
const PLATAFORMAS = ["WooCommerce", "Tiendanube", "Shopify", "Otra"];

export async function onRequestPost({ request, env }) {
  if (!origenValido(request)) return error("origen", "Pedido no permitido.", 403);
  if (!env.FIRMA_SECRETO || !(env.RESEND_API_KEY && env.EMAIL_DESTINO) ) return error("no_configurado", "El formulario todavía no está disponible.", 503);
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
  if (!telefonoValido(c.telefono) || !(await constanciaValida(c.constancia, c.telefono, env.FIRMA_SECRETO))) {
    return error("verificacion", "Verificá tu teléfono para continuar.", 403);
  }
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
    `Teléfono (verificado por SMS): ${c.telefono}`,
    `Plataforma: ${plataforma}`,
    `Visitas mensuales estimadas: ${visitas}`,
    `Fecha: ${lead.fecha}${lead.pais ? ` · País: ${lead.pais}` : ""}`,
  ].join("\n");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.EMAIL_ORIGEN || "Guidelia <onboarding@resend.dev>",
      to: [env.EMAIL_DESTINO],
      reply_to: email,
      subject: `Demo: ${tienda} (${plataforma}, ${visitas} visitas)`,
      text: texto,
    }),
  });
  if (!res.ok && !env.LEADS) return error("envio", "No pudimos registrar tu pedido. Probá de nuevo en un rato.", 502);
  return json({ ok: true });
}
