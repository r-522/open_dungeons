// Open Dungeons landing — scroll reveals, stat count-up, drifting embers.

(() => {
  // ---- IntersectionObserver reveal ----
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  // ---- stat count-up ----
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const animateStat = (el) => {
    const target = parseInt(el.dataset.target || "0", 10);
    const dur = 1400, start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      el.textContent = Math.floor(easeOut(t) * target).toString();
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = target.toString();
    };
    requestAnimationFrame(tick);
  };
  const statIo = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { animateStat(e.target); statIo.unobserve(e.target); }
    }
  }, { threshold: 0.6 });
  document.querySelectorAll(".stat-num").forEach((el) => statIo.observe(el));

  // ---- drifting embers (torchlight) ----
  const host = document.getElementById("embers");
  if (host && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    for (let i = 0; i < 28; i++) {
      const e = document.createElement("span");
      e.className = "ember";
      e.style.left = `${Math.random() * 100}%`;
      const dur = 9 + Math.random() * 12;
      const delay = -Math.random() * dur;
      e.style.animationDuration = `${dur}s`;
      e.style.animationDelay = `${delay}s`;
      const size = 2 + Math.random() * 3;
      e.style.width = e.style.height = `${size}px`;
      e.style.opacity = "1";
      host.appendChild(e);
    }
  }

  // ---- nav active-link ----
  const navLinks = document.querySelectorAll(".nav-links a");
  const targets = [...navLinks].map((a) => document.querySelector(a.getAttribute("href")));
  const setActive = () => {
    const y = window.scrollY + 120;
    let idx = 0;
    targets.forEach((t, i) => { if (t && t.offsetTop <= y) idx = i; });
    navLinks.forEach((a, i) => a.style.color = i === idx ? "var(--gold-soft)" : "");
  };
  window.addEventListener("scroll", setActive, { passive: true });
  setActive();
})();
