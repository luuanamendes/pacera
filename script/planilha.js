(function () {
  // link do app da web do google apps script (termina em /exec). cole aqui depois de implantar o script.
  var SCRIPT_URL = "COLE_AQUI_O_LINK_DO_APPS_SCRIPT";

  // link do clube no strava (igual ao script.js)
  var STRAVA_URL = "https://www.strava.com/clubs/1765318";
  document.querySelectorAll(".js-strava").forEach(function (a) { a.href = STRAVA_URL; });

  /* ---------- e-mail do rodapé ---------- */
  var mail = document.getElementById("mail"), toast = document.getElementById("toast"), tt;
  function show(msg) { toast.textContent = msg; toast.classList.add("show"); clearTimeout(tt); tt = setTimeout(function () { toast.classList.remove("show"); }, 1400); }
  mail.addEventListener("click", function () {
    function fallback() { var r = document.createRange(); r.selectNodeContents(mail); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); show("e-mail selecionado, é só copiar"); }
    try { navigator.clipboard.writeText(mail.textContent).then(function () { show("e-mail copiado"); }, fallback); } catch (e) { fallback(); }
  });

  /* ---------- grupo vindo do link (ex.: planilha.html?grupo=vibe) ---------- */
  try {
    var g = new URLSearchParams(location.search).get("grupo");
    if (g) {
      document.querySelectorAll('input[name="grupo"]').forEach(function (r) {
        if (r.value.toLowerCase() === g.toLowerCase()) r.checked = true;
      });
    }
  } catch (e) {}

  /* ---------- formulário ---------- */
  var form = document.getElementById("form");
  var erro = document.getElementById("erro");
  var botao = document.getElementById("botao");
  var ok = document.getElementById("ok");
  var labelBotao = botao.innerHTML;
  var aceite = document.getElementById("consentimento");

  // o botão só libera quando a pessoa aceita receber novidades
  function liberaBotao() { botao.disabled = !aceite.checked; }
  aceite.addEventListener("change", liberaBotao);
  liberaBotao();

  function marca(id, ruim) { document.getElementById(id).setAttribute("aria-invalid", ruim ? "true" : "false"); }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    erro.textContent = "";

    var d = new FormData(form);
    var nome = String(d.get("nome") || "").trim();
    var insta = String(d.get("instagram") || "").trim().replace(/^@+/, "").replace(/\s+/g, "");
    var email = String(d.get("email") || "").trim();
    var grupo = d.get("grupo");
    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    marca("nome", !nome); marca("instagram", !insta); marca("email", !emailOk);

    if (!grupo) { erro.textContent = "escolha o seu grupo pra gente saber qual planilha mandar."; return; }
    if (!nome || !insta || !email) { erro.textContent = "preencha nome, @ e e-mail."; return; }
    if (!emailOk) { erro.textContent = "confere o e-mail? parece que tem algo errado."; return; }
    if (!aceite.checked) return;
    if (d.get("site")) return; // robô

    botao.disabled = true;
    botao.classList.add("enviando");
    botao.textContent = "enviando...";

    fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      body: new URLSearchParams({
        nome: nome,
        instagram: "@" + insta,
        email: email,
        grupo: grupo,
        consentimento: "sim"
      })
    }).then(function () {
      document.getElementById("ok-grupo").textContent = grupo;
      document.getElementById("ok-email").textContent = email;
      form.hidden = true;
      ok.hidden = false;
      ok.focus();
      ok.scrollIntoView({ behavior: "smooth", block: "start" });
    }).catch(function () {
      erro.textContent = "não deu certo agora. tenta de novo em instantes?";
      botao.classList.remove("enviando");
      botao.innerHTML = labelBotao;
      liberaBotao();
    });
  });
})();
