/* Prueba técnica de Guidelia para Tiendanube.
   Solo LEE la página donde se instala y muestra un panel de diagnóstico. No envía datos a ningún servidor.
   Es invisible para los clientes de la tienda: el panel aparece únicamente si se entra con ?guidelia=1 en la dirección.
   Para apagarlo: ?guidelia=0 */
(function () {
  "use strict";
  var CLAVE = "guidelia_diag";
  try {
    if (/[?&]guidelia=0/.test(location.search)) sessionStorage.removeItem(CLAVE);
    if (/[?&]guidelia=1/.test(location.search)) sessionStorage.setItem(CLAVE, "1");
    if (sessionStorage.getItem(CLAVE) !== "1") return;
  } catch (e) { if (!/[?&]guidelia=1/.test(location.search)) return; }

  var filas = [];
  var panel = document.createElement("div");
  panel.setAttribute("style", "position:fixed;right:16px;bottom:16px;z-index:2147483000;width:340px;max-width:calc(100vw - 32px);max-height:80vh;overflow:auto;background:#072C3B;color:#fff;font:13px/1.45 system-ui,sans-serif;border-radius:16px;box-shadow:0 18px 50px rgba(0,0,0,.35);padding:16px");
  panel.innerHTML = '<b style="font-size:15px">Prueba de Guidelia</b><div id="gd-filas" style="margin-top:10px"></div><button id="gd-copiar" type="button" style="margin-top:12px;width:100%;padding:10px;border:0;border-radius:10px;background:#F2383B;color:#fff;font:700 13px system-ui;cursor:pointer">Copiar resultados</button><div id="gd-msg" style="margin-top:8px;color:#9ED3E6"></div>';
  document.body.appendChild(panel);
  var cont = panel.querySelector("#gd-filas");

  function fila(titulo, ok, detalle) {
    filas.push({ prueba: titulo, resultado: ok === true ? "OK" : ok === false ? "NO" : "?", detalle: detalle || "" });
    var d = document.createElement("div");
    d.setAttribute("style", "padding:7px 0;border-top:1px solid rgba(255,255,255,.14)");
    d.innerHTML = '<span style="font-weight:700">' + (ok === true ? "✅ " : ok === false ? "❌ " : "❔ ") + titulo + '</span>' + (detalle ? '<div style="color:#BFD8E2;word-break:break-word">' + String(detalle).replace(/</g, "&lt;") + "</div>" : "");
    cont.appendChild(d);
  }

  // 1. El código se cargó
  fila("El código de Guidelia se cargó en la tienda", true, location.hostname + location.pathname);

  // 2. Plataforma
  var ls = window.LS || window.Tiendanube || null;
  var gen = document.querySelector('meta[name="generator"]');
  fila("Se detecta Tiendanube", !!ls || /nube|nuvem/i.test(document.documentElement.innerHTML.slice(0, 20000)), "objeto LS: " + (window.LS ? "sí" : "no") + (window.LS && window.LS.store ? " · tienda " + (window.LS.store.id || "") : "") + (gen ? " · generator: " + gen.content : ""));

  // 3. Producto de la página
  var prod = null;
  try {
    document.querySelectorAll('script[type="application/ld+json"]').forEach(function (s) {
      var j = JSON.parse(s.textContent);
      (Array.isArray(j) ? j : [j]).forEach(function (x) { if (x && (x["@type"] === "Product" || (x["@graph"] || []).some(function (g) { return g["@type"] === "Product"; }))) prod = x["@type"] === "Product" ? x : x["@graph"].filter(function (g) { return g["@type"] === "Product"; })[0]; });
    });
  } catch (e) {}
  var lsProd = window.LS && window.LS.product ? window.LS.product : null;
  fila("Se puede leer el producto de la página", prod || lsProd ? true : null, prod ? (prod.name + " · SKU " + (prod.sku || "—")) : lsProd ? ("LS.product: " + (lsProd.name || lsProd.id || "")) : "Abrí la página de un producto para esta prueba");

  // 4. Formulario de compra del tema (para entender cómo agregar al carrito)
  var form = document.querySelector('form[action*="comprar"], form[data-store*="product"], form[action*="cart"], form[action*="carrito"]');
  if (form) {
    var campos = Array.prototype.map.call(form.querySelectorAll("input[name],select[name]"), function (i) { return i.name; }).join(", ");
    fila("Formulario de compra encontrado", true, "acción: " + (form.getAttribute("action") || "(vacía)") + " · método: " + (form.method || "get") + " · campos: " + campos);
  } else fila("Formulario de compra encontrado", null, "Abrí la página de un producto para esta prueba");

  // 5. Carrito
  fila("Información del carrito en la página", !!(window.LS && window.LS.cart), window.LS && window.LS.cart ? "LS.cart presente (" + Object.keys(window.LS.cart).slice(0, 8).join(", ") + ")" : "no se ve LS.cart");

  // 6. Catálogo público (mapa del sitio)
  fetch("/sitemap.xml").then(function (r) { return r.ok ? r.text().then(function (t) { return { n: (t.match(/<loc>/g) || []).length, s: r.status }; }) : { n: 0, s: r.status }; })
    .then(function (r) { fila("Mapa del sitio público (para leer el catálogo)", r.n > 0, "estado " + r.s + " · " + r.n + " enlaces"); })
    .catch(function (e) { fila("Mapa del sitio público (para leer el catálogo)", false, String(e)); });

  // 7. ¿La tienda deja que el código llame a nuestro servidor?
  fetch("https://guidelia.pages.dev/prueba/ok.json", { cache: "no-store" }).then(function (r) { return r.json(); })
    .then(function (j) { fila("La tienda permite hablar con el servidor de Guidelia", j && j.ok === true, "respuesta recibida"); })
    .catch(function (e) { fila("La tienda permite hablar con el servidor de Guidelia", false, String(e)); });

  panel.querySelector("#gd-copiar").addEventListener("click", function () {
    var texto = "Prueba Guidelia en " + location.href + "\n" + filas.map(function (f) { return "[" + f.resultado + "] " + f.prueba + " — " + f.detalle; }).join("\n");
    var ok = function () { panel.querySelector("#gd-msg").textContent = "Copiado. Pegalo en un mensaje."; };
    if (navigator.clipboard) navigator.clipboard.writeText(texto).then(ok, function () { window.prompt("Copiá este texto:", texto); });
    else window.prompt("Copiá este texto:", texto);
  });
})();
