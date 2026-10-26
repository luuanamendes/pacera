(function () {
    // link do clube no strava: troque aqui quando tiver o endereço final
    var STRAVA_URL = "https://www.strava.com/clubs/1765318";
    document.querySelectorAll(".js-strava").forEach(function (a) {a.href = STRAVA_URL;});

    var top = document.getElementById("top");
    function onScroll() {top.classList.toggle("solid", window.scrollY > 40);}
    window.addEventListener("scroll", onScroll, {passive: true}); onScroll();

    // menu do celular: abre e fecha pelo botão, fecha ao escolher uma seção
    var menuBtn = document.getElementById("menu-btn");
    function setMenu(open) {
        top.classList.toggle("open", open);
        menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
        menuBtn.setAttribute("aria-label", open ? "fechar menu" : "abrir menu");
    }
    menuBtn.addEventListener("click", function () {setMenu(!top.classList.contains("open"));});
    document.querySelectorAll("#menu a").forEach(function (a) {
        a.addEventListener("click", function () {setMenu(false);});
    });
    document.addEventListener("keydown", function (e) {if (e.key === "Escape") setMenu(false);});

    var groups = [
        {id: "brisa", name: "Brisa", min: 420},
        {id: "vibe", name: "Vibe", min: 375},
        {id: "embalo", name: "Embalo", min: 345},
        {id: "impulso", name: "Impulso", min: 315},
        {id: "voo", name: "Voo", min: 0}
    ];
    var input = document.getElementById("pace-input");
    var out = document.getElementById("pace-result");
    var cards = document.querySelectorAll(".group");

    function parse(v) {
        var m = String(v).trim().match(/^(\d{1,2})(?::|\.|,)?(\d{2})?$/);
        if (!m) return null;
        var min = parseInt(m[1], 10), sec = m[2] ? parseInt(m[2], 10) : 0;
        if (sec > 59 || min < 2 || min > 15) return null;
        return min * 60 + sec;
    }
    function update() {
        var s = parse(input.value);
        cards.forEach(function (c) {c.classList.remove("on");});
        if (s === null) {out.textContent = "escreva assim: 6:30"; return;}
        var g = groups.find(function (x) {return s >= x.min;});
        document.querySelector('.group[data-g="' + g.id + '"]').classList.add("on");
        out.style.setProperty("--gc", "var(--" + g.id + ")");
        out.innerHTML = "seu grupo é <strong>" + g.name + "</strong>";
    }
    input.addEventListener("input", update);
    update();

    var mail = document.getElementById("mail");
    var toast = document.getElementById("toast");
    var t;
    function show(msg) {
        toast.textContent = msg; toast.classList.add("show");
        clearTimeout(t); t = setTimeout(function () {toast.classList.remove("show");}, 1400);
    }
    mail.addEventListener("click", function () {
    var text = mail.textContent;

    function fallback() {
        var r = document.createRange(); r.selectNodeContents(mail);
        var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
        show("e-mail selecionado, é só copiar");
    }
    try {navigator.clipboard.writeText(text).then(function () {show("e-mail copiado");}, fallback);} catch (e) {fallback();}
    });
      // revela o conteúdo conforme a página desce
    (function () {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduce || !("IntersectionObserver" in window)) return;
        function mark(sel, cls, step) {
            document.querySelectorAll(sel).forEach(function (el) {
            el.classList.add(cls);
            if (step) {
                var sibs = Array.prototype.filter.call(el.parentNode.children, function (c) {return c.matches(sel);});
                el.style.setProperty("--d", (sibs.indexOf(el) * step).toFixed(2) + "s");
            }
        });
        }
        mark(".hero-meta, .hero h1 > span, .hero-foot", "rv", 0.12);
        mark(".sec-num", "rv-line", 0);
        mark(".sec-top h2, .sec-top .lead, .finder, .note, .band-title, .chat > div, .women-copy > div, .final h2, .final .lead, .final .btn, .final-star, .foot-row", "rv", 0.1);
        mark(".lane", "rv", 0.08);
        mark(".group", "rv", 0.07);
        mark(".step", "rv", 0.1);
        mark(".where > div", "rv", 0.1);
        mark(".msg", "rv", 0.15);
        mark(".band figure, .women figure, .foot-mark", "rv-img", 0.12);
        document.documentElement.classList.add("rv-on");
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {if (e.isIntersecting) {e.target.classList.add("in"); io.unobserve(e.target);} });
        }, {rootMargin: "0px 0px -8% 0px", threshold: 0.12});
        document.querySelectorAll(".rv, .rv-img, .rv-line").forEach(function (el) {io.observe(el);});
        // a capa aparece assim que a página carrega
        window.addEventListener("load", function () {
          document.querySelectorAll(".hero .rv").forEach(function (el) {el.classList.add("in");});
        });
    })();
})();