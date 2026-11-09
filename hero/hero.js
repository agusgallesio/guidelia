/* Hero animado de Guidelia (~40 s, en bucle, sin sonido).
   Una línea de tiempo maestra: render(t) es una función pura del tiempo (t en segundos), así que se puede
   pausar, buscar un instante (HeroAnim.seek) y exportar cuadro por cuadro. Solo se escriben transform y opacity,
   más el texto que se escribe letra por letra. Los desplazamientos se escalan con el tamaño del escenario, así el
   movimiento es el mismo en la web y en el video. Sin dependencias. */
(function () {
  "use strict";
  var BASE = ((document.currentScript && document.currentScript.src) || "/hero/hero.js").replace(/[^/]*$/, "");

  // ============ CONTENIDO: para cambiar de rubro se tocan solo estos textos, datos e imágenes ============
  // Fotos, precios y características reales del catálogo de la tienda de la demo; nombres genéricos (sin marca ni modelo).
  var V492 = { nombre: "Cepillo secador alisador", precio: "$48.900", antes: "$78.500", desc: "-38%", img: "img/p492.webp" };
  var V561 = { nombre: "Cepillo alisador cerámico", precio: "$49.900", antes: "$58.600", desc: "-15%", img: "img/p561.webp" };
  var V556 = { nombre: "Planchita de titanio", precio: "$69.800", antes: "$88.200", desc: "-21%", img: "img/p556.webp" };
  var V528 = { nombre: "Buclera de 5 ondas", precio: "$62.300", antes: "$72.900", desc: "-15%", img: "img/p528.webp" };
  var V519 = { nombre: "Planchita rizadora", precio: "$44.200", antes: "$57.100", desc: "-23%", img: "img/p519.webp" };

  var CONFIG = {
    aria: "Animación de Guidelia: el asesor de compra responde al instante con los datos del catálogo, recomienda y suma productos al carrito, se ve y habla como tu marca, muestra en un panel qué buscan tus clientes y recomienda primero lo que querés vender.",
    boton: "Ver cómo queda en mi tienda",
    cierre: "Tu mejor vendedor, en cada visita.",
    cierreResalta: "en cada visita", // se escribe en celeste
    // tenue: posición (desde 1) de la palabra que queda a medio apagar en la primera línea
    tarjetas: [
      { l1: "Cada pregunta necesita", l2: "una respuesta precisa al instante.", tenue: 1 },
      { l1: "Se ve y habla", l2: "como tu marca.", tenue: 3 },
      { l1: "Cada conversación", l2: "te muestra qué buscan tus clientes.", tenue: 1 },
      { l1: "Vos decidís", l2: "qué recomienda primero.", tenue: 1 }
    ],
    rotulos: ["Asesor de compra", "Complemento", "Personalizable", "Panel", "Potenciar productos"],
    asesor: "Asesor de la tienda",
    placeholder: "Escribí tu consulta…",
    tienda: { marca: "Tu tienda", nav: ["Alisadores", "Secadores", "Rizadores", "Ofertas"] },
    producto: { nombre: V492.nombre, precio: V492.precio, antes: V492.antes, img: V492.img, boton: "Agregar al carrito",
      puntos: ["1000 W", "Control de temperatura", "Cable giratorio", "Función anti-frizz"], ruta: "Cepillos" },
    chat: {
      pregunta: "Busco algo para alisar. ¿Qué me conviene?",
      respuesta: "Te recomiendo el **cepillo secador alisador**: seca y alisa a la vez, con **1000 W**, control de temperatura y cable giratorio.",
      duda: "¿Tu pelo es lacio u ondulado?",
      opciones: ["Lacio", "Ondulado"], elegida: 1,
      reco: "Para pelo ondulado, su función **anti-frizz** te lo deja parejo. Mirá:",
      p1: [V492, V561],
      complemento: "Completá el alisado con la **planchita de titanio**.",
      p2: [V556],
      agregar: "Agregar al carrito", agregado: "Agregado", stock: "En stock"
    },
    marca: {
      titulo: "Apariencia del asesor",
      nombre: "Luna", color: "#1F2A30", radio: 0.45, fuente: "'Fraunces', Georgia, serif",
      // [ajuste, valor antes, valor después]
      ajustes: [["Nombre", "Asesor de la tienda", "Luna"], ["Foto", "Ícono", "Foto"], ["Color", "Petróleo", "Blanco"], ["Bordes", "Redondeados", "Suaves"], ["Tipografía", "Figtree", "Fraunces"], ["Tono", "Cercano", "Formal"]],
      holaA: "¡Hola! Soy el asesor de la tienda. ¿Qué estás buscando?",
      holaB: "¡Hola! Soy Luna. ¿Qué estás buscando?",
      cliente: "Busco algo para alisar el pelo.",
      tonoA: "¡Genial! Te muestro el **cepillo secador alisador**: seca y alisa a la vez.",
      tonoB: "Con gusto. Le presento el **cepillo secador alisador**, que seca y alisa en un solo paso.",
      sugeridas: ["Ver opciones", "Comparar modelos"]
    },
    panel: {
      masBuscado: { t: "Lo más buscado", filas: [["Alisadores", 128], ["Secadores", 94], ["Rizadores", 61]] },
      grafico: { t: "Conversaciones", s: "Últimos 14 días", total: 1284, unidad: "con tus clientes" },
      sinStock: { t: "Buscaron y no había", tags: [["Plancha de 4 cm", 12], ["Secador compacto", 9], ["Difusor universal", 6]] },
      sinRespuesta: { t: "Para sumar a tus fichas", n: 7, ej: "«¿Sirve para pelo muy rizado?»" },
      contactos: { t: "Contactos para llamar", filas: [["Mayoristas", 27], ["Avisos de stock", 18]] },
      potenciar: {
        t: "Potenciá lo que querés vender", badge: "Potenciado", vista: "Así lo ve tu cliente", recomendado: "Recomendado",
        filas: [[V492.nombre, V492.img], [V519.nombre, V519.img], [V528.nombre, V528.img]],
        cliente: "Quiero hacerme ondas.",
        asesor: "Te recomiendo la **buclera de 5 ondas**.",
        producto: [V528, V519]
      }
    }
  };

  // ============ LÍNEA DE TIEMPO (segundos) ============
  var DUR = 40.4, FINAL = 39;
  // En el sitio, mientras se lee el titular, se ve una imagen fija (la tienda con el chat y las tarjetas)
  // y el video arranca cuando terminaron de aparecer el titular y el subrayado.
  var POSTER = 8.95, ARRANQUE_MS = 1900, FUNDIDO = 0.45;
  var TL = { c0: [0, 2.4], p: [2.4, 12], c1: [12, 13.8], m: [13.8, 19.8], c2: [19.8, 22], d: [22, 27.6], c3: [27.6, 29.4], w: [29.4, 35.2], f: [35.2, 40.4] };
  var T = { panel: 2.95, type: 3.45, send: 4.4, dots1: [4.55, 5.0], a1: 5.0, a2: 6.15, press: 6.95, u2: 7.1, dots2: [7.25, 7.65], a3: 7.65, add1: 8.7, dots3: [9.2, 9.6], a4: 9.6, add2: 10.85 };
  var MARCA_T = [14.7, 15.3, 15.9, 16.5, 17.1, 17.7];
  var TW = { on: 30.8, move: 31.0, vista: 32.0, c: 32.15, a: 32.65, card: 33.05 };
  var RG = [[2.75, 9.15], [9.15, 12], [14.1, 19.8], [22.3, 27.6], [29.7, 35.2]];
  var CPS = 45;

  // ============ UTILIDADES ============
  function bez(x1, y1, x2, y2) {
    return function (x) {
      if (x <= 0) return 0; if (x >= 1) return 1;
      var t = x;
      for (var i = 0; i < 7; i++) {
        var cx = 3 * x1 * t * (1 - t) * (1 - t) + 3 * x2 * t * t * (1 - t) + t * t * t - x;
        var d = 3 * x1 * (1 - t) * (1 - t) + 6 * (x2 - x1) * (1 - t) * t + 3 * (1 - x2) * t * t;
        if (Math.abs(d) < 1e-6) break;
        t -= cx / d;
      }
      t = Math.max(0, Math.min(1, t));
      return 3 * y1 * t * (1 - t) * (1 - t) + 3 * y2 * t * t * (1 - t) + t * t * t;
    };
  }
  var ease = bez(0.2, 0.8, 0.2, 1);
  var clamp = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  var seg = function (t, a, b) { return ease(clamp((t - a) / (b - a))); };
  var lin = function (t, a, b) { return clamp((t - a) / (b - a)); };
  var fade = function (t, a, b, d) { d = d || 0.3; return Math.min(clamp((t - a) / d), clamp((b - t) / d)); };
  // Escenas encadenadas: cada una entra mientras sale la anterior (sin cuadros negros). La primera arranca ya
  // visible (su fondo es el mismo del escenario) y la última termina en ese mismo fondo: el bucle no se nota.
  var escena = function (t, a, b, d) {
    d = d || 0.3;
    var entra = a <= 0 ? 1 : clamp((t - (a - d / 2)) / d);
    var sale = b >= DUR ? clamp((b - t) / 0.45) : clamp((b + d / 2 - t) / d);
    return Math.min(entra, sale);
  };
  var ventana = function (t, a, b, d) { return Math.min(clamp((t - a) / d), clamp((b - t) / d)); };
  var pulso = function (t, a, d) { return Math.sin(Math.PI * lin(t, a, a + d)); };
  var typed = function (s, t, a, cps) { return s.slice(0, Math.max(0, Math.min(s.length, Math.floor((t - a) * cps)))); };
  var esc = function (s) { return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); };
  var rich = function (s) { return esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>"); };
  var num = function (n) { return Math.round(n).toLocaleString("es-AR"); };
  var icono = function (id) { return '<svg aria-hidden="true"><use href="#' + id + '"/></svg>'; };
  var img = function (src, alt) { return '<img src="' + BASE + src + '" alt="' + esc(alt || "") + '" decoding="sync">'; };

  // ============ CONSTRUCCIÓN DEL DOM ============
  function construir(raiz) {
    var C = CONFIG, ch = C.chat, mk = C.marca, pn = C.panel, pr = C.producto, po = pn.potenciar, h = "";
    var tarjeta = function (c, i) {
      return '<div class="ha-sc hc" data-sc="c' + i + '"><div class="hc-1">' + c.l1.split(" ").map(function (w) { return "<span>" + esc(w) + "</span>"; }).join("") + '</div><div class="hc-2"><span class="tx"></span><i class="hc-cur"></i><span class="rs"></span></div></div>';
    };
    var cabeza = function (nombre, sub) {
      return '<div class="ch-h"><div class="ch-av">' + icono("chispa") + '<span class="ph"><svg viewBox="0 0 100 100" aria-hidden="true"><use href="#avatar-lucia"/></svg></span></div><div><div class="ch-n">' + esc(nombre) + '</div><div class="ch-e">' + esc(sub || "En línea") + "</div></div></div>";
    };
    var entrada = function (txt) { return '<div class="ch-i"><span class="ch-it">' + esc(txt || "") + '</span><span class="ch-go">' + icono("enviar") + "</span></div>"; };
    // Tarjetas de producto como las del widget real: carrusel, foto cuadrada, descuento, nombre, precio (y tachado), stock y botón oscuro
    var tc = function (lista, badge) {
      return '<div class="tcs">' + lista.map(function (p, i) {
        return '<div class="tc"><div class="tc-foto">' + img(p.img, p.nombre) + (badge && i === 0 ? '<span class="tc-bd">' + esc(badge) + "</span>" : "") + (p.desc ? '<span class="tc-ds">' + esc(p.desc) + "</span>" : "") + '</div><div class="tc-n">' + esc(p.nombre) + '</div><div class="tc-pr"><b>' + esc(p.precio) + "</b>" + (p.antes ? "<s>" + esc(p.antes) + "</s>" : "") + '</div><div class="tc-s">' + esc(ch.stock) + '</div><div class="tc-b">' + icono("carrito") + "<span>" + esc(ch.agregar) + "</span></div></div>";
      }).join("") + "</div>";
    };
    // Página de producto de una tienda (para que se vea una web real, no una ilustración)
    var pagina = function () {
      return '<div class="pg"><div class="pg-h"><b class="pg-logo">' + esc(C.tienda.marca) + '</b><span class="pg-nav">' + C.tienda.nav.map(function (n) { return "<i>" + esc(n) + "</i>"; }).join("") + '</span><span class="pg-cart">' + icono("carrito") + "<em>1</em></span></div>" +
        '<div class="pg-b"><div class="pg-ph">' + img(pr.img, pr.nombre) + '</div><div class="pg-i"><div class="pg-r">' + esc(C.tienda.nav[0]) + " / " + esc(pr.ruta) + '</div><div class="pg-t">' + esc(pr.nombre) + '</div><div class="pg-pp"><b>' + esc(pr.precio) + "</b><s>" + esc(pr.antes) + '</s></div><ul>' + pr.puntos.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + '</ul><div class="pg-bt">' + esc(pr.boton) + "</div></div></div></div>";
    };
    var puntos = '<div class="dots"><i></i><i></i><i></i></div>';

    // 1. Tarjeta + asesor de compra + complemento
    h += tarjeta(C.tarjetas[0], 0);
    h += '<div class="ha-sc hp" data-sc="p"><div class="hp-bg">' + img(pr.img, "") + '</div><div class="ha-cam">' + pagina() +
      '<div class="ch ch-dock">' + cabeza(C.asesor) + '<div class="ch-b"><div class="ch-s">' +
      '<div class="sl"><div class="m mc">' + esc(ch.pregunta) + "</div></div>" +
      '<div class="sl">' + puntos + '<div class="m ma">' + rich(ch.respuesta) + "</div></div>" +
      '<div class="sl"><div class="m ma">' + esc(ch.duda) + '<div class="qs">' + ch.opciones.map(function (o) { return '<span class="q">' + esc(o) + "</span>"; }).join("") + "</div></div></div>" +
      '<div class="sl"><div class="m mc">' + esc(ch.opciones[ch.elegida]) + "</div></div>" +
      '<div class="sl">' + puntos + '<div class="m ma">' + rich(ch.reco) + "</div>" + tc(ch.p1) + "</div>" +
      '<div class="sl">' + puntos + '<div class="m ma">' + rich(ch.complemento) + "</div>" + tc(ch.p2) + "</div>" +
      "</div></div>" + entrada() + "</div></div></div>";

    // 2. Tarjeta + tu marca
    h += tarjeta(C.tarjetas[1], 1);
    var muestra = function (fila, cual) {
      var v = fila[cual];
      if (fila[0] === "Foto") return '<i class="mk-av">' + (cual === 1 ? icono("chispa") : '<svg viewBox="0 0 100 100" aria-hidden="true"><use href="#avatar-lucia"/></svg>') + "</i>" + esc(v);
      if (fila[0] === "Color") return '<i class="mk-sw" style="background:' + (cual === 1 ? "#0E4A62" : "#fff") + '"></i>' + esc(v);
      if (fila[0] === "Tipografía") return '<span style="font-family:' + (cual === 1 ? "var(--ha-f)" : mk.fuente.replace(/"/g, "'")) + '">' + esc(v) + "</span>";
      return esc(v);
    };
    h += '<div class="ha-sc hm" data-sc="m"><div class="ha-cam"><div class="mk"><div class="mk-t">' + esc(mk.titulo) + "</div>" +
      mk.ajustes.map(function (f) { return '<div class="mk-r"><span class="mk-l">' + esc(f[0]) + '</span><span class="mk-v"><span class="a">' + muestra(f, 1) + '</span><span class="b">' + muestra(f, 2) + '</span></span><i class="mk-ok">' + icono("check") + "</i></div>"; }).join("") +
      '</div><div class="ch">' + cabeza(C.asesor) + '<div class="ch-b"><div class="ch-s"><div class="tono hola"><div class="m ma">' + esc(mk.holaA) + '</div><div class="m ma">' + esc(mk.holaB) + '</div></div><div class="m mc">' + esc(mk.cliente) + '</div><div class="tono"><div class="m ma">' + rich(mk.tonoA) + '</div><div class="m ma">' + rich(mk.tonoB) + '</div></div><div class="qs">' + mk.sugeridas.map(function (o) { return '<span class="q">' + esc(o) + "</span>"; }).join("") + "</div></div></div>" + entrada(C.placeholder) + "</div></div></div>";

    // 3. Tarjeta + panel
    h += tarjeta(C.tarjetas[2], 2);
    var filas = function (lista, max) {
      return lista.map(function (f) { return '<div class="pr"><span>' + esc(f[0]) + '</span><b data-n="' + f[1] + '">0</b><span class="rl"><i data-r="' + (f[1] / max).toFixed(3) + '"></i></span></div>'; }).join("");
    };
    var curva = "M0 50 L25 44 L50 46 L75 34 L100 38 L125 26 L150 30 L175 20 L200 24 L225 14 L250 18 L275 8 L300 10";
    h += '<div class="ha-sc hd" data-sc="d"><div class="ha-cam">' +
      '<div class="pc"><div class="pc-t">' + esc(pn.masBuscado.t) + "</div>" + filas(pn.masBuscado.filas, 140) + "</div>" +
      '<div class="pc pc-c"><div class="pc-t">' + esc(pn.grafico.t) + '</div><div class="big"><span data-n="' + pn.grafico.total + '">0</span><small>' + esc(pn.grafico.unidad) + '</small></div><div class="chart"><svg viewBox="0 0 300 60" preserveAspectRatio="none" aria-hidden="true"><path class="ar" d="' + curva + ' V60 H0Z" fill="rgba(28,98,128,.14)"/><path d="' + curva + '" fill="none" stroke="#1C6280" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg><div class="cub"></div></div><div class="pc-s">' + esc(pn.grafico.s) + "</div></div>" +
      '<div class="pc"><div class="pc-t">' + esc(pn.sinStock.t) + "</div><div>" + pn.sinStock.tags.map(function (g) { return '<span class="tag">' + esc(g[0]) + "<em>×" + g[1] + "</em></span>"; }).join("") + "</div></div>" +
      '<div class="pc"><div class="pc-t">' + esc(pn.sinRespuesta.t) + '</div><div class="big"><span data-n="' + pn.sinRespuesta.n + '">0</span></div><div class="q2">' + esc(pn.sinRespuesta.ej) + "</div></div>" +
      '<div class="pc"><div class="pc-t">' + esc(pn.contactos.t) + "</div>" + filas(pn.contactos.filas, 40) + "</div>" +
      "</div></div>";

    // 4. Tarjeta + potenciar productos
    h += tarjeta(C.tarjetas[3], 3);
    h += '<div class="ha-sc hw" data-sc="w"><div class="ha-cam"><div class="pc po-l"><div class="pc-t">' + esc(po.t) + '</div><div class="po-rows">' + po.filas.map(function (f) { return '<div class="po-r"><span class="th">' + img(f[1], "") + '</span><span class="po-n">' + esc(f[0]) + '</span><em class="po-b">' + esc(po.badge) + '</em><span class="sw"><i></i></span></div>'; }).join("") + "</div></div>" +
      '<div class="ch po-v">' + cabeza(po.vista, C.asesor) + '<div class="ch-b"><div class="ch-s"><div class="m mc">' + esc(po.cliente) + '</div><div class="m ma">' + rich(po.asesor) + "</div>" + tc(po.producto, po.recomendado) + "</div></div></div></div></div>";

    // 5. Cierre
    h += '<div class="ha-sc hf" data-sc="f"><div class="hf-logo"><svg viewBox="0 0 908 213" role="img" aria-label="Guidelia"><use href="#logo-guidelia" width="908" height="213"/></svg><span class="hf-st">' + icono("chispa") + '</span></div><div class="hf-l"><span class="tx"></span><i class="hc-cur"></i><span class="rs"></span></div><div class="hf-b">' + esc(C.boton) + "</div></div>";

    // Rótulos de función (abajo a la derecha)
    C.rotulos.forEach(function (r) {
      var p = r.split(" "), ult = p.pop();
      h += '<div class="ha-lab">' + (p.length ? esc(p.join(" ")) + " <i>" + esc(ult) + "</i>" : esc(ult)) + "</div>";
    });
    raiz.innerHTML = '<div class="ha-in" aria-hidden="true">' + h + "</div>";
  }

  // ============ MOTOR ============
  function montar(el, opciones) {
    opciones = opciones || {};
    var C = CONFIG;
    el.setAttribute("role", "img");
    el.setAttribute("aria-label", C.aria);
    construir(el);
    // tipografía «elegante» del ejemplo de personalización (se pide una sola vez)
    if (!document.getElementById("ha-fuente")) {
      var lf = document.createElement("link");
      lf.id = "ha-fuente"; lf.rel = "stylesheet";
      lf.href = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&display=swap";
      document.head.appendChild(lf);
    }

    var q = function (s, r) { return (r || el).querySelector(s); };
    var qa = function (s, r) { return [].slice.call((r || el).querySelectorAll(s)); };
    var sc = {}; qa("[data-sc]").forEach(function (n) { sc[n.getAttribute("data-sc")] = n; });
    var K = 1, PERSP = 1300; // escala del movimiento según el ancho del escenario (diseñado a 650 px)
    var put = function (n, o, y, s) {
      var oo = o.toFixed(3), yy = (y * K).toFixed(2), ss = s == null ? "" : s.toFixed(4);
      var k = oo + "|" + yy + "|" + ss;
      if (n._k === k) return; n._k = k;
      n.style.opacity = oo;
      n.style.transform = "translate3d(0," + yy + "px,0)" + (ss ? " scale(" + ss + ")" : "");
    };
    var texto = function (n, s) { if (n._s !== s) { n._s = s; n._h = null; n.textContent = s; } };
    var html = function (n, s) { if (n._h !== s) { n._h = s; n._s = null; n.innerHTML = s; } };
    var clase = function (n, c, on) { if (!n._c) n._c = {}; if (n._c[c] !== on) { n._c[c] = on; n.classList.toggle(c, on); } };
    var cam = function (n, x, y, ry, rx, s) {
      n.style.transform = "perspective(" + PERSP + "px) translate3d(" + x.toFixed(2) + "%," + y.toFixed(2) + "%,0) rotateY(" + ry.toFixed(3) + "deg) rotateX(" + rx.toFixed(3) + "deg) scale(" + s.toFixed(4) + ")";
    };
    var esVertical = function () { return el.classList.contains("ha--v"); };
    // entrada de cámara: llega inclinada, se endereza en ~0,7 s y queda quieta con un acercamiento casi imperceptible
    var entradaCam = function (n, t, a, b, x0, ry0, rx0, extraX) {
      var e = seg(t, a, a + 0.75), v = esVertical();
      cam(n, v ? 0 : x0 * (1 - e) + (extraX || 0), v ? 3 * (1 - e) : 0, v ? 0 : ry0 * (1 - e), rx0 * (1 - e), 0.88 + 0.12 * e + 0.035 * lin(t, a + 0.75, b));
    };
    var escribir = function (n, s, t, a, fin, ph) {
      if (t >= a && t < fin) { html(n, esc(typed(s, t, a, CPS)) + '<i class="cur"></i>'); clase(n, "on", true); }
      else { texto(n, ph); clase(n, "on", false); }
    };

    // --- tarjetas negras
    var cards = [TL.c0, TL.c1, TL.c2, TL.c3].map(function (rg, i) {
      var n = sc["c" + i], cfg = C.tarjetas[i];
      return { n: n, rg: rg, w: qa(".hc-1 span", n), tx: q(".tx", n), rs: q(".rs", n), cur: q(".hc-cur", n), t2: cfg.l2, tenue: cfg.tenue };
    });
    function renderTarjeta(c, t) {
      var a = c.rg[0], b = c.rg[1];
      c.n.style.opacity = escena(t, a, b, 0.3).toFixed(3);
      c.w.forEach(function (w, i) {
        var p = seg(t, a + 0.08 + i * 0.09, a + 0.5 + i * 0.09);
        put(w, p * (i + 1 === c.tenue ? 0.42 : 1), (1 - p) * 16);
      });
      var ini = a + 0.15 + c.w.length * 0.09 + 0.15, cps = 40, fin = ini + c.t2.length / cps;
      var ya = typed(c.t2, t, ini, cps);
      texto(c.tx, ya); texto(c.rs, c.t2.slice(ya.length));
      c.cur.style.opacity = t < ini || t > b - 0.25 ? 0 : (t < fin + 0.1 || Math.floor((t - fin) * 2.4) % 2 === 0 ? 1 : 0);
    }

    // --- 1. asesor de compra + complemento
    var P = sc.p, camP = q(".ha-cam", P), dock = q(".ch-dock", P), cartPg = q(".pg-cart", P), cartN = q(".pg-cart em", P);
    var slots = qa(".sl", P), stack = q(".ch-s", P), cuerpo = q(".ch-b", P), inP = q(".ch-it", P), qsP = qa(".q", P);
    var add1 = qa(".tc-b", slots[4])[0], add2 = qa(".tc-b", slots[5])[0];
    var msgs = slots.map(function (s) { return { s: s, m: q(".m", s), d: q(".dots", s), c: q(".tcs", s) }; });
    var tIn = [T.send, T.a1, T.a2, T.u2, T.a3, T.a4];
        var dotsT = [null, T.dots1, null, null, T.dots2, T.dots3];
    var claves = [];
    function medir() {
      K = Math.max(0.5, el.clientWidth / 650);
      PERSP = Math.round(el.clientWidth * 2);
      var vh = cuerpo.clientHeight, pad = 12 * K, prev = 0;
      stack.style.position = "relative";
      claves = [];
      msgs.forEach(function (x, i) {
        var arriba = x.s.offsetTop, abajo = arriba + x.s.offsetHeight, tope = Math.max(0, arriba - 6 * K);
        if (x.d) { prev = Math.max(prev, Math.min(arriba + x.d.offsetHeight + pad - vh, tope)); claves.push([dotsT[i][0], Math.max(0, prev)]); }
        prev = Math.max(prev, Math.min(abajo + pad - vh, tope));
        claves.push([tIn[i], Math.max(0, prev)]);
        x.abajo = abajo + pad - vh;
      });
      // justo antes de tocar «Agregar al carrito», el chat baja lo necesario para que se vea el botón
      claves.push([T.add1 - 0.5, msgs[4].abajo], [T.add2 - 0.5, msgs[5].abajo]);
      claves.sort(function (x, y) { return x[0] - y[0]; });
      for (var k = 1; k < claves.length; k++) claves[k][1] = Math.max(0, claves[k][1], claves[k - 1][1]);
      qa(".ha-sc *").forEach(function (n) { n._k = null; });
    }
    function scroll(t) {
      var y = 0;
      for (var k = 0; k < claves.length; k++) {
        if (t < claves[k][0] - 0.05) break;
        var desde = k ? claves[k - 1][1] : 0;
        y = desde + (claves[k][1] - desde) * seg(t, claves[k][0] - 0.05, claves[k][0] + 0.4);
      }
      return y;
    }
    function boton(n, t, cuando) {
      var ok = t >= cuando;
      clase(n, "on", ok);
      texto(q("span", n), ok ? C.chat.agregado : C.chat.agregar);
      put(n, 1, 0, 1 - 0.07 * pulso(t, cuando - 0.05, 0.35));
    }
    function renderP(t) {
      var a = TL.p[0], b = TL.p[1], v = esVertical();
      P.style.opacity = escena(t, a, b, 0.3).toFixed(3);
      // un solo movimiento decidido: entra inclinada y, cuando aparece el chat, un paneo corto hacia él
      entradaCam(camP, t, a, b, 9, -18, 8, v ? 0 : -3.5 * seg(t, T.panel, T.panel + 0.7));
      var pe = seg(t, T.panel, T.panel + 0.5);
      dock.style.transform = v ? "translate3d(0," + ((1 - pe) * 106).toFixed(2) + "%,0)" : "translate3d(" + ((1 - pe) * 106).toFixed(2) + "%,0,0)";
      dock.style.opacity = clamp((t - T.panel) / 0.12).toFixed(3);
      msgs.forEach(function (x, i) {
        var p = seg(t, tIn[i], tIn[i] + 0.28);
        put(x.m, p, (1 - p) * 12);
        if (x.c) { var pc = seg(t, tIn[i] + 0.15, tIn[i] + 0.5); put(x.c, pc, (1 - pc) * 14); }
        if (x.d) x.d.style.opacity = ventana(t, dotsT[i][0], dotsT[i][1], 0.15).toFixed(3);
      });
      stack.style.transform = "translate3d(0," + (-scroll(t)).toFixed(2) + "px,0)";
      escribir(inP, C.chat.pregunta, t, T.type, T.send, C.placeholder);
      qsP.forEach(function (n, i) {
        if (i !== C.chat.elegida) return;
        clase(n, "on", t >= T.press);
        put(n, 1, 0, 1 - 0.08 * pulso(t, T.press, 0.25));
      });
      boton(add1, t, T.add1);
      boton(add2, t, T.add2);
      // el carrito de la página suma cada producto
      var cant = t >= T.add2 ? 2 : t >= T.add1 ? 1 : 0;
      texto(cartN, String(cant || 1));
      cartN.style.opacity = cant ? 1 : 0;
      put(cartPg, 1, 0, 1 + 0.3 * Math.max(pulso(t, T.add1, 0.4), pulso(t, T.add2, 0.4)));
    }

    // --- 2. tu marca
    var M = sc.m, camM = q(".ha-cam", M), wm = q(".ch", M), nom = q(".ch-n", M), ph = q(".ph", M), chispaAv = q(".ch-av > svg", M);
    var filasM = qa(".mk-r", M), holas = qa(".hola .m", M), tonos = qa(".tono:not(.hola) .m", M);
    var estadoM = -2;
    function aplicarMarca(n) {
      if (n === estadoM) return; estadoM = n;
      var mk = C.marca, claro = n >= 2;
      texto(nom, n >= 0 ? mk.nombre : C.asesor);
      ph.style.opacity = n >= 1 ? 1 : 0; chispaAv.style.opacity = n >= 1 ? 0 : 1;
      // el «color de marca» pasa a blanco y grafito: encabezado blanco, burbuja del cliente grafito
      wm.style.setProperty("--pc", claro ? mk.color : "");
      wm.style.setProperty("--hb", claro ? "#FFFFFF" : "");
      wm.style.setProperty("--ht", claro ? "#0B2833" : "");
      wm.style.setProperty("--hav", claro ? "#E8EFF2" : "");
      wm.style.setProperty("--hln", claro ? "#E3ECEF" : "transparent");
      wm.style.setProperty("--r", n >= 3 ? "calc(var(--u) * " + (2 * mk.radio).toFixed(2) + ")" : "");
      wm.style.setProperty("--wf", n >= 4 ? mk.fuente : "");
    }
    function renderM(t) {
      var a = TL.m[0], b = TL.m[1];
      M.style.opacity = escena(t, a, b, 0.3).toFixed(3);
      entradaCam(camM, t, a, b, -6, 12, 5);
      var n = -1; MARCA_T.forEach(function (x, i) { if (t >= x) n = i; });
      aplicarMarca(n);
      var golpe = 0; MARCA_T.forEach(function (x) { golpe = Math.max(golpe, pulso(t, x, 0.35)); });
      put(wm, 1, 0, 1 + 0.025 * golpe);
      filasM.forEach(function (r, i) {
        var p = seg(t, MARCA_T[i], MARCA_T[i] + 0.35);
        clase(r, "on", n === i);
        clase(r, "ok", i <= n);
        put(q(".a", r), 1 - p, -6 * p);
        put(q(".b", r), p, 6 * (1 - p));
      });
      var ph2 = seg(t, MARCA_T[0], MARCA_T[0] + 0.35), pt = seg(t, MARCA_T[5], MARCA_T[5] + 0.35);
      put(holas[0], 1 - ph2, 0); put(holas[1], ph2, 0);
      put(tonos[0], 1 - pt, 0); put(tonos[1], pt, 0);
    }

    // --- 3. panel
    var D = sc.d, camD = q(".ha-cam", D), cardsD = qa(".pc", D), nums = qa("[data-n]", D), barras = qa("[data-r]", D), cubierta = q(".cub", D), area = q(".ar", D);
    function renderD(t) {
      var a = TL.d[0], b = TL.d[1];
      D.style.opacity = escena(t, a, b, 0.3).toFixed(3);
      entradaCam(camD, t, a, b, 3, 10, 5);
      cardsD.forEach(function (c, i) { var p = seg(t, a + 0.15 + i * 0.12, a + 0.65 + i * 0.12); put(c, p, (1 - p) * 30); });
      nums.forEach(function (n) { texto(n, num(+n.getAttribute("data-n") * seg(t, a + 0.5, a + 2.0))); });
      barras.forEach(function (n) { n.style.transform = "scaleX(" + (+n.getAttribute("data-r") * seg(t, a + 0.6, a + 2.0)).toFixed(3) + ")"; });
      cubierta.style.transform = "scaleX(" + (1 - seg(t, a + 0.9, a + 3.0)).toFixed(4) + ")";
      area.style.opacity = seg(t, a + 2.4, a + 3.4).toFixed(3);
    }

    // --- 4. potenciar productos
    var W = sc.w, camW = q(".ha-cam", W), poL = q(".po-l", W), poRows = qa(".po-r", W), poV = q(".po-v", W), poMsgs = qa(".po-v .m", W), poCards = q(".po-v .tcs", W);
    var poBadge = q(".po-b", poRows[2]), poSw = q(".sw", poRows[2]);
    function renderW(t) {
      var a = TL.w[0], b = TL.w[1];
      W.style.opacity = escena(t, a, b, 0.3).toFixed(3);
      entradaCam(camW, t, a, b, 3, 8, 4);
      var pl = seg(t, a + 0.1, a + 0.7);
      put(poL, pl, (1 - pl) * 26);
      var mv = seg(t, TW.move, TW.move + 0.7);
      poRows.forEach(function (r, i) { r.style.transform = "translate3d(0," + (i === 2 ? -200 * mv : 100 * mv).toFixed(2) + "%,0)"; });
      poBadge.style.opacity = seg(t, TW.on, TW.on + 0.25).toFixed(3);
      clase(poSw, "on", t >= TW.on); clase(poRows[2], "pot", t >= TW.on);
      var pv = seg(t, TW.vista, TW.vista + 0.5);
      put(poV, pv, (1 - pv) * 26);
      var m1 = seg(t, TW.c, TW.c + 0.28), m2 = seg(t, TW.a, TW.a + 0.28), m3 = seg(t, TW.card, TW.card + 0.4);
      put(poMsgs[0], m1, (1 - m1) * 12);
      put(poMsgs[1], m2, (1 - m2) * 12);
      put(poCards, m3, (1 - m3) * 14);
    }

    // --- 5. cierre
    var F = sc.f, logo = q(".hf-logo", F), est = q(".hf-st", F), linea = q(".hf-l", F), lineaTx = q(".tx", F), lineaRs = q(".rs", F), lineaCur = q(".hc-cur", F), btn = q(".hf-b", F);
    function renderF(t) {
      var a = TL.f[0], b = TL.f[1];
      F.style.opacity = escena(t, a, b, 0.3).toFixed(3);
      var pl = seg(t, a + 0.15, a + 0.8);
      put(logo, pl, (1 - pl) * 16, 0.92 + 0.08 * pl);
      var pe = seg(t, a + 0.4, a + 1.6);
      est.style.transform = "rotate(" + (180 * pe).toFixed(2) + "deg) scale(" + (0.4 + 0.6 * pe + 0.3 * pulso(t, a + 0.4, 0.7)).toFixed(3) + ")";
      est.style.opacity = clamp((t - a - 0.4) / 0.2).toFixed(3);
      var ini = a + 1.0, fin = ini + C.cierre.length / 38;
      linea.style.opacity = t >= ini ? 1 : 0;
      var ya = typed(C.cierre, t, ini, 38);
      var iR = C.cierre.indexOf(C.cierreResalta);
      html(lineaTx, iR < 0 || ya.length <= iR ? esc(ya) : esc(ya.slice(0, iR)) + '<span class="cel">' + esc(ya.slice(iR)) + "</span>");
      texto(lineaRs, C.cierre.slice(ya.length));
      lineaCur.style.opacity = t < ini || t > b - 0.6 ? 0 : (t < fin + 0.1 || Math.floor((t - fin) * 2.4) % 2 === 0 ? 1 : 0);
      var pb = seg(t, fin + 0.25, fin + 0.75);
      put(btn, pb, (1 - pb) * 12, 0.96 + 0.04 * pb);
    }

    // --- rótulos de función
    var rot = qa(".ha-lab");
    function renderRotulos(t) {
      rot.forEach(function (r, i) { var p = fade(t, RG[i][0], RG[i][1], 0.3); put(r, p, (1 - p) * 10); });
    }

    function render(t) {
      // antes de empezar: la imagen fija se funde con la primera tarjeta
      if (t < 0) {
        render(POSTER);
        renderTarjeta(cards[0], 0);
        cards[0].n.style.opacity = clamp(1 + t / FUNDIDO).toFixed(3);
        return;
      }
      t = ((t % DUR) + DUR) % DUR;
      cards.forEach(function (c) { renderTarjeta(c, t); });
      renderP(t); renderM(t); renderD(t); renderW(t); renderF(t); renderRotulos(t);
    }

    // --- vertical (4:5) en celular, apaisado (16:10) en escritorio
    var mq = window.matchMedia("(max-width: 940px)");
    var vertical = function () { el.classList.toggle("ha--v", opciones.vertical != null ? opciones.vertical : mq.matches); };
    vertical();
    if (mq.addEventListener) mq.addEventListener("change", function () { vertical(); medir(); render(reloj); });

    var reloj = opciones.manual ? 0 : POSTER, ultimo = 0, corriendo = false, raf = 0, visible = true, primera = !opciones.manual, espera = 0;
    medir();
    if (window.ResizeObserver) new ResizeObserver(function () { medir(); if (!corriendo) render(reloj); }).observe(el);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { medir(); render(reloj); });
    // las fotos cambian el alto de las tarjetas del chat: se vuelve a medir cuando cargan
    qa("img").forEach(function (i) { if (!i.complete) i.addEventListener("load", function () { medir(); if (!corriendo) render(reloj); }); });

    // --- reloj, visibilidad y movimiento reducido
    var quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function tic(ahora) {
      if (!corriendo) return;
      var dt = Math.min(0.1, (ahora - ultimo) / 1000); ultimo = ahora;
      reloj += dt; if (reloj >= DUR) reloj -= DUR;
      render(reloj);
      raf = requestAnimationFrame(tic);
    }
    function arrancar() {
      if (corriendo || quieto || opciones.manual) return;
      if (primera) {
        // la primera vez espera a que se lea el titular (si la persona llega más tarde con el scroll, casi no espera)
        if (!espera) espera = setTimeout(function () { espera = 0; primera = false; reloj = -FUNDIDO; revisar(); }, Math.max(300, ARRANQUE_MS - performance.now()));
        return;
      }
      corriendo = true; ultimo = performance.now(); raf = requestAnimationFrame(tic);
    }
    function parar() { corriendo = false; cancelAnimationFrame(raf); if (espera) { clearTimeout(espera); espera = 0; } }
    function revisar() { (visible && !document.hidden) ? arrancar() : parar(); }
    document.addEventListener("visibilitychange", revisar);
    if (quieto) { render(FINAL); }
    else {
      render(reloj);
      if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; revisar(); }, { threshold: 0.2 }).observe(el);
      else revisar();
    }
    return { seek: function (s) { parar(); reloj = s; render(s); }, render: render, dur: DUR, medir: medir };
  }

  var host = document.getElementById("ha");
  if (host) window.HeroAnim = montar(host, { manual: /[?&]export/.test(location.search), vertical: /[?&]vertical/.test(location.search) ? true : (/[?&]horizontal/.test(location.search) ? false : null) });
  window.HeroAnimConfig = CONFIG;
})();
