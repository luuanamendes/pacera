(function () {
  // link do clube no strava: troque aqui quando tiver o endereço final (igual ao script.js)
  var STRAVA_URL = "https://www.strava.com/clubs/1765318";
  document.querySelectorAll(".js-strava").forEach(function (a) { a.href = STRAVA_URL; });

  /* ---------- cabeçalho e menu do celular ---------- */
  var top = document.getElementById("top");
  var menuBtn = document.getElementById("menu-btn");
  function setMenu(open) {
    top.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    menuBtn.setAttribute("aria-label", open ? "fechar menu" : "abrir menu");
  }
  menuBtn.addEventListener("click", function () { setMenu(!top.classList.contains("open")); });
  document.querySelectorAll("#menu a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

  /* ---------- e-mail ---------- */
  var mail = document.getElementById("mail"), toast = document.getElementById("toast"), tt;
  function show(msg) { toast.textContent = msg; toast.classList.add("show"); clearTimeout(tt); tt = setTimeout(function () { toast.classList.remove("show"); }, 1400); }
  mail.addEventListener("click", function () {
    function fallback() { var r = document.createRange(); r.selectNodeContents(mail); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); show("e-mail selecionado, é só copiar"); }
    try { navigator.clipboard.writeText(mail.textContent).then(function () { show("e-mail copiado"); }, fallback); } catch (e) { fallback(); }
  });

  /* ---------- utilidades ---------- */
  var KM = 1000, MI = 1609.344, LB = 0.45359237;
  var unit = "km";
  try { if (localStorage.getItem("pacera-unidade") === "mi") unit = "mi"; } catch (e) {}
  function U() { return unit === "mi" ? MI : KM; }
  function $(id) { return document.getElementById(id); }
  function num(el) {
    var v = String(el.value).trim().replace(",", ".");
    if (v === "") return null;
    var n = Number(v);
    return isFinite(n) && n >= 0 ? n : NaN;
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function dec(n, d) { return n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: d }); }
  function dec1(n) { return n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }
  function hms(sec) {
    sec = Math.round(sec);
    var h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    return h ? h + ":" + pad(m) + ":" + pad(s) : m + ":" + pad(s);
  }
  // tempo (h, min, s) em segundos; null se vazio, NaN se inválido
  function readTime(p) {
    var h = num($(p + "-h")), m = num($(p + "-m")), s = num($(p + "-s"));
    if (h === null && m === null && s === null) return null;
    if ([h, m, s].some(function (x) { return x !== null && isNaN(x); })) return NaN;
    var t = (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
    return t > 0 ? t : null;
  }
  function writeTime(p, sec) {
    sec = Math.round(sec);
    $(p + "-h").value = Math.floor(sec / 3600) || "";
    $(p + "-m").value = pad(Math.floor(sec % 3600 / 60));
    $(p + "-s").value = pad(sec % 60);
  }
  // pace em segundos por metro
  function readPace(mEl, sEl) {
    var m = num(mEl), s = num(sEl);
    if (m === null && s === null) return null;
    if (isNaN(m) || isNaN(s)) return NaN;
    var t = (m || 0) * 60 + (s || 0);
    return t > 0 ? t / U() : null;
  }
  function writePace(mEl, sEl, secPerM) {
    var t = Math.round(secPerM * U());
    mEl.value = Math.floor(t / 60); sEl.value = pad(t % 60);
  }
  // metros por segundo
  function readSpeed(el) {
    var v = num(el); if (v === null || isNaN(v)) return v;
    if (el.dataset.mps && el.value === el.dataset.shown) return Number(el.dataset.mps);
    return v > 0 ? v * U() / 3600 : null;
  }
  function writeSpeed(el, mps) { el.value = dec(mps * 3600 / U(), 1); el.dataset.mps = mps; el.dataset.shown = el.value; }
  // metros; guarda o valor exato pra não perder precisão ao trocar km/milhas
  function readDist(el) {
    var v = num(el); if (v === null || isNaN(v)) return v;
    if (el.dataset.m && el.value === el.dataset.shown) return Number(el.dataset.m);
    return v > 0 ? v * U() : null;
  }
  function writeDist(el, m) { el.value = dec(m / U(), 2); el.dataset.m = m; el.dataset.shown = el.value; }
  function ok(x) { return x !== null && !isNaN(x) && x > 0; }
  function lbl(kind) {
    if (kind === "dist") return unit === "mi" ? "mi" : "km";
    if (kind === "pace") return unit === "mi" ? "/mi" : "/km";
    if (kind === "speed") return unit === "mi" ? "mph" : "km/h";
    if (kind === "weight") return unit === "mi" ? "lb" : "kg";
  }
  function paceStr(secPerM) { return hms(secPerM * U()); }
  function speedStr(mps) { return dec1(mps * 3600 / U()); }

  // botões de distância rápida
  document.querySelectorAll(".chips").forEach(function (box) {
    var input = $(box.getAttribute("data-for"));
    box.addEventListener("click", function (e) {
      var b = e.target.closest(".chip"); if (!b) return;
      writeDist(input, Number(b.getAttribute("data-km")) * KM);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  });

  /* ---------- / 01 calculadora de corrida ---------- */
  var cDist = $("c-dist"), cPm = $("c-pm"), cPs = $("c-ps"), cV = $("c-v"), cOut = $("c-out");
  var target = "pace", mode = "pace";
  function pressed(box, attr, val) { box.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute(attr) === val ? "true" : "false"); }); }
  // ritmo digitado, em segundos por metro (vem do pace ou da velocidade)
  function cPaceIn() { if (mode === "pace") return readPace(cPm, cPs); var v = readSpeed(cV); return ok(v) ? 1 / v : v; }
  function cSolve() {
    var d = readDist(cDist), t = readTime("c"), p = cPaceIn(), big, k, rest;
    // o valor calculado também vai pro campo escondido, pra continuar valendo se a pessoa mudar o que quer descobrir
    if (target === "pace") { if (ok(d) && ok(t)) { p = t / d; writePace(cPm, cPs, p); writeSpeed(cV, 1 / p); } else { p = null; cPm.value = ""; cPs.value = ""; cV.value = ""; } }
    if (target === "time") { if (ok(d) && ok(p)) { t = d * p; writeTime("c", t); } else { t = null; ["c-h", "c-m", "c-s"].forEach(function (id) { $(id).value = ""; }); } }
    if (target === "dist") { if (ok(t) && ok(p)) { d = t / p; writeDist(cDist, d); } else { d = null; cDist.value = ""; } }
    var done = ok(d) && ok(t) && ok(p), dash = "—";
    var paceTxt = done ? paceStr(p) + '<small>' + lbl("pace") + '</small>' : dash;
    var speedTxt = done ? speedStr(1 / p) + '<small>' + lbl("speed") + '</small>' : dash;
    var distTxt = done ? dec(d / U(), 2) + '<small>' + lbl("dist") + '</small>' : dash;
    var timeTxt = done ? hms(t) : dash;
    var ritmo = mode === "speed" ? ["velocidade", speedTxt] : ["pace", paceTxt];
    var outro = mode === "speed" ? ["pace", paceTxt] : ["velocidade", speedTxt];
    var k, big, rest;
    // a estrutura é sempre a mesma: um número grande e três dados embaixo
    if (target === "pace") { k = "seu ritmo"; big = ritmo[1]; rest = [outro, ["distância", distTxt], ["tempo", timeTxt]]; }
    if (target === "time") { k = "seu tempo"; big = timeTxt; rest = [ritmo, outro, ["distância", distTxt]]; }
    if (target === "dist") { k = "sua distância"; big = distTxt; rest = [ritmo, outro, ["tempo", timeTxt]]; }
    cOut.innerHTML = '<span class="k">' + k + '</span><div class="big">' + big + '</div><div class="facts three">' +
      rest.map(function (r) { return '<div><span class="k">' + r[0] + '</span><div class="mid">' + r[1] + '</div></div>'; }).join("") + '</div>' +
      '<p class="hint">' + (done ? "mude qualquer campo e o resultado atualiza na hora." : "preencha os dois campos que faltam.") + '</p>';
  }
  function setTarget(t) {
    target = t; pressed($("c-target"), "data-t", t);
    document.querySelectorAll("#corrida .field").forEach(function (f) {
      var isT = f.getAttribute("data-group") === t;
      f.classList.toggle("calc", isT);
      f.querySelectorAll(".in").forEach(function (el) { el.readOnly = isT; el.tabIndex = isT ? -1 : 0; });
    });
    cSolve();
  }
  function setMode(m) {
    var p = cPaceIn();
    mode = m; pressed($("c-mode"), "data-m", m);
    $("c-pace-in").hidden = m !== "pace"; $("c-speed-in").hidden = m !== "speed";
    if (ok(p)) { writePace(cPm, cPs, p); writeSpeed(cV, 1 / p); }
    cSolve();
  }
  $("c-target").addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) setTarget(b.getAttribute("data-t")); });
  $("c-mode").addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) setMode(b.getAttribute("data-m")); });
  [cDist, cPm, cPs, cV, $("c-h"), $("c-m"), $("c-s")].forEach(function (el) { el.addEventListener("input", cSolve); });
  $("c-clear").addEventListener("click", function () {
    document.querySelectorAll("#corrida .in").forEach(function (el) { el.value = ""; });
    cSolve();
  });

  /* ---------- / 02 esteira ---------- */
  var ePm = $("e-pm"), ePs = $("e-ps"), eV = $("e-v"), eOut = $("e-out"), eLast = "pace";
  function eRender() {
    var p = readPace(ePm, ePs);
    if (!ok(p)) { eOut.innerHTML = '<span class="k">resultado</span><p class="empty">digite o pace ou a velocidade.</p>'; return; }
    var other = unit === "mi" ? KM : MI, otherPace = hms(p * other), otherSpeed = dec1(3600 / (p * other));
    var otherL = unit === "mi" ? ["/km", "km/h"] : ["/mi", "mph"];
    var main = eLast === "pace"
      ? '<span class="k">na esteira</span><div class="big">' + speedStr(1 / p) + '<small>' + lbl("speed") + '</small></div><div class="mid">' + paceStr(p) + '<small>' + lbl("pace") + '</small></div>'
      : '<span class="k">no relógio</span><div class="big">' + paceStr(p) + '<small>' + lbl("pace") + '</small></div><div class="mid">' + speedStr(1 / p) + '<small>' + lbl("speed") + '</small></div>';
    eOut.innerHTML = main +
      '<div class="facts"><div><span class="k">em ' + (unit === "mi" ? "quilômetros" : "milhas") + '</span><div class="mid">' + otherPace + '<small>' + otherL[0] + '</small> · ' + otherSpeed + '<small>' + otherL[1] + '</small></div></div></div>';
  }
  [ePm, ePs].forEach(function (el) {
    el.addEventListener("input", function () { var p = readPace(ePm, ePs); if (ok(p)) writeSpeed(eV, 1 / p); else eV.value = ""; eLast = "pace"; eRender(); });
  });
  eV.addEventListener("input", function () {
    var s = readSpeed(eV);
    if (ok(s)) writePace(ePm, ePs, 1 / s); else { ePm.value = ""; ePs.value = ""; }
    eLast = "speed"; eRender();
  });

  /* ---------- / 03 calorias ---------- */
  var kW = $("k-w"), kDist = $("k-dist"), kOut = $("k-out");
  function readWeightKg() { var v = num(kW); if (!ok(v)) return null; return unit === "mi" ? v * LB : v; }
  function kRender() {
    var kg = readWeightKg(), d = readDist(kDist), t = readTime("k");
    if (!(ok(kg) && ok(d) && ok(t))) { kOut.innerHTML = '<span class="k">resultado</span><p class="empty">preencha peso, distância e tempo.</p>'; return; }
    // equação de corrida do ACSM: VO2 = 0,2 × velocidade (m/min) + 3,5; 1 L de O2 ≈ 5 kcal
    var min = t / 60, vo2 = 0.2 * (d / min) + 3.5, kcal = vo2 * kg * min * 5 / 1000;
    var perDist = kcal / (d / U());
    kOut.innerHTML =
      '<span class="k">gasto estimado</span>' +
      '<div class="big">' + dec(Math.round(kcal / 10) * 10, 0) + '<small>kcal</small></div>' +
      '<div class="facts">' +
      '<div><span class="k">por ' + lbl("dist") + '</span><div class="mid">' + dec(Math.round(perDist), 0) + '<small>kcal</small></div></div>' +
      '<div><span class="k">pace</span><div class="mid">' + paceStr(t / d) + '<small>' + lbl("pace") + '</small></div></div>' +
      '</div>' +
      '<p class="hint">é uma estimativa. o gasto real muda com terreno, clima, subidas e condicionamento.</p>';
  }
  [kW, kDist, $("k-h"), $("k-m"), $("k-s")].forEach(function (el) { el.addEventListener("input", kRender); });

  /* ---------- / 04 previsão de prova ---------- */
  var rDist = $("r-dist"), rOut = $("r-out");
  var races = [
    { km: 5, name: "5 km" },
    { km: 10, name: "10 km" },
    { km: 21.0975, name: "meia maratona" },
    { km: 42.195, name: "maratona" }
  ];
  function rRender() {
    var d = readDist(rDist), t = readTime("r");
    if (!(ok(d) && ok(t))) { rOut.innerHTML = '<span class="k">previsão</span><p class="empty">coloque a distância e o tempo de uma corrida recente.</p>'; return; }
    var rows = races.map(function (r) {
      var dm = r.km * KM, tp = t * Math.pow(dm / d, 1.06);
      var same = Math.abs(dm - d) < 60;
      var sub = unit === "mi" ? dec(dm / MI, 1) + " mi" : dec(r.km, 1) + " km";
      return '<tr' + (same ? ' class="same"' : '') + '><td>' + r.name + '<small>' + sub + '</small></td><td class="t">' + hms(tp) + '</td><td class="p">' + paceStr(tp / dm) + ' ' + lbl("pace") + '</td></tr>';
    }).join("");
    rOut.innerHTML = '<span class="k">previsão</span><div class="table-wrap"><table class="pred"><thead><tr><th>prova</th><th>tempo</th><th>pace</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }
  [rDist, $("r-h"), $("r-m"), $("r-s")].forEach(function (el) { el.addEventListener("input", rRender); });

  /* ---------- quilômetros ou milhas ---------- */
  function relabel() {
    document.querySelectorAll(".u-dist").forEach(function (e) { e.textContent = lbl("dist"); });
    document.querySelectorAll(".u-pace").forEach(function (e) { e.textContent = lbl("pace"); });
    document.querySelectorAll(".u-speed").forEach(function (e) { e.textContent = lbl("speed"); });
    document.querySelectorAll(".u-weight").forEach(function (e) { e.textContent = lbl("weight"); });
    $("unit-km").setAttribute("aria-pressed", unit === "km" ? "true" : "false");
    $("unit-mi").setAttribute("aria-pressed", unit === "mi" ? "true" : "false");
  }
  function renderAll() { cSolve(); eRender(); kRender(); rRender(); }
  function setUnit(next) {
    if (next === unit) return;
    // guarda os valores na medida interna antes de trocar
    var dists = [].map.call(document.querySelectorAll(".js-dist"), function (el) { return [el, readDist(el)]; });
    var paces = [["c-pm", "c-ps"], ["e-pm", "e-ps"]].map(function (p) { return [p, readPace($(p[0]), $(p[1]))]; });
    var speeds = [].map.call(document.querySelectorAll(".js-speed"), function (el) { return [el, readSpeed(el)]; });
    var kg = readWeightKg();
    unit = next;
    try { localStorage.setItem("pacera-unidade", unit); } catch (e) {}
    dists.forEach(function (x) { if (ok(x[1])) writeDist(x[0], x[1]); });
    paces.forEach(function (x) { if (ok(x[1])) writePace($(x[0][0]), $(x[0][1]), x[1]); });
    speeds.forEach(function (x) { if (ok(x[1])) writeSpeed(x[0], x[1]); });
    if (ok(kg)) kW.value = dec(unit === "mi" ? kg / LB : kg, 1);
    relabel(); renderAll();
  }
  $("unit-km").addEventListener("click", function () { setUnit("km"); });
  $("unit-mi").addEventListener("click", function () { setUnit("mi"); });

  /* ---------- exemplos pra calculadora já abrir funcionando ---------- */
  relabel();
  writeDist(cDist, 10 * KM); writeTime("c", 3600); writePace(cPm, cPs, 300 / KM); writeSpeed(cV, KM / 300); setTarget("pace");
  writePace(ePm, ePs, 360 / KM); writeSpeed(eV, KM / 360); eRender();
  kW.value = unit === "mi" ? "132" : "60"; writeDist(kDist, 5 * KM); writeTime("k", 1800); kRender();
  writeDist(rDist, 5 * KM); writeTime("r", 1800); rRender();
})();
