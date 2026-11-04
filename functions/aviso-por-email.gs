// Script de Google que te manda por email cada pedido de demo del sitio.
// Se pega en https://script.google.com (con la cuenta agustin@guidelia.com.ar). No es parte del sitio: es solo para copiarlo.
//
// Importante: el mail SIEMPRE se manda a la dueña o dueño del script (a vos mismo). Aunque alguien conozca la dirección
// del script, no puede usarlo para mandar mails a otras personas.
function doPost(e) {
  var datos = {};
  try {
    datos = JSON.parse(e.postData.contents);
  } catch (err) {
    return respuesta({ ok: false });
  }
  var asunto = String(datos.asunto || "Pedido de demo").slice(0, 150);
  var texto = String(datos.texto || "").slice(0, 3000);
  var opciones = { name: "Formulario de guidelia.com.ar" };
  if (datos.responderA && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.responderA)) opciones.replyTo = datos.responderA;
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(), asunto, texto, opciones);
  return respuesta({ ok: true });
}

function respuesta(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(ContentService.MimeType.JSON);
}
