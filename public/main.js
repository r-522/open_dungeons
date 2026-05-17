// Open Dungeons landing — scroll reveals, stat count-up, cursor glow on feature cards.

(() => {
  // ---- IntersectionObserver reveal ----
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    }
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  // ---- stat count-up ----
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const animateStat = (el) => {
    const target = parseInt(el.dataset.target || "0", 10);
    const dur = 1400;
    const start = performance.now();
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
      if (e.isIntersecting) {
        animateStat(e.target);
        statIo.unobserve(e.target);
      }
    }
  }, { threshold: 0.6 });
  document.querySelectorAll(".stat-num").forEach((el) => statIo.observe(el));

  // ---- cursor-following glow on feature cards ----
  document.querySelectorAll(".feature").forEach((card) => {
    card.addEventListener("pointermove", (ev) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${ev.clientX - r.left}px`);
      card.style.setProperty("--my", `${ev.clientY - r.top}px`);
    });
  });

  // ---- subtle parallax on hero orbs ----
  const orbs = document.querySelectorAll(".bg-orb");
  let raf = 0;
  window.addEventListener("scroll", () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      const y = window.scrollY;
      orbs.forEach((o, i) => {
        const k = (i + 1) * 0.05;
        o.style.transform = `translate3d(0, ${y * k}px, 0)`;
      });
      raf = 0;
    });
  }, { passive: true });

  // ---- smooth-scroll nav active state ----
  const navLinks = document.querySelectorAll(".nav-links a");
  const targets = [...navLinks].map((a) => document.querySelector(a.getAttribute("href")));
  const setActive = () => {
    const y = window.scrollY + 120;
    let idx = 0;
    targets.forEach((t, i) => { if (t && t.offsetTop <= y) idx = i; });
    navLinks.forEach((a, i) => a.style.color = i === idx ? "var(--ink)" : "");
  };
  window.addEventListener("scroll", setActive, { passive: true });
  setActive();
})();
