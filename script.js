// ===== Lightbox (minden .tile elemre) =====
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxClose = document.getElementById("lightboxClose");

function openLightbox(src){
  if (!lightbox || !lightboxImg) return;
  lightboxImg.src = src;
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeLightbox(){
  if (!lightbox) return;
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

document.querySelectorAll(".tile").forEach(tile => {
  tile.addEventListener("click", () => {
    const src = tile.getAttribute("data-src");
    if (src) openLightbox(src);
  });
});

lightboxClose?.addEventListener("click", closeLightbox);
lightbox?.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
});

// ===== Slider (auto + prev/next + drag) =====
const slider = document.getElementById("workSlider");
const track = document.getElementById("sliderTrack");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const dotsWrap = document.getElementById("dots");

if (track) {
  const slides = Array.from(track.querySelectorAll(".slide"));
  const AUTO_MS = 6500;

  // Dots (one per slide)
  if (dotsWrap) {
    dotsWrap.innerHTML = slides.map((_, i) => `<span class="dot" data-i="${i}"></span>`).join("");
  }
  const dots = dotsWrap ? Array.from(dotsWrap.querySelectorAll(".dot")) : [];

  function getSlideLeft(i){
    // slide offsetLeft relative to track padding
    return slides[i].offsetLeft - 12; // track padding
  }

  function nearestSlideIndex(){
    const x = track.scrollLeft + 1; // bias
    let bestI = 0;
    let bestD = Infinity;
    slides.forEach((s, i) => {
      const d = Math.abs((s.offsetLeft - 12) - x);
      if (d < bestD) { bestD = d; bestI = i; }
    });
    return bestI;
  }

  function updateDots(){
    const i = nearestSlideIndex();
    dots.forEach(d => d.classList.remove("active"));
    if (dots[i]) dots[i].classList.add("active");
  }

  function scrollToIndex(i){
    const idx = (i + slides.length) % slides.length;
    track.scrollTo({ left: getSlideLeft(idx), behavior: "smooth" });
    setTimeout(updateDots, 250);
  }

  function next(){
    const i = nearestSlideIndex();
    scrollToIndex(i + 1);
  }
  function prev(){
    const i = nearestSlideIndex();
    scrollToIndex(i - 1);
  }

  prevBtn?.addEventListener("click", () => { stopAuto(); prev(); startAuto(); });
  nextBtn?.addEventListener("click", () => { stopAuto(); next(); startAuto(); });

  // Dots click
  dots.forEach(d => {
    d.addEventListener("click", () => {
      stopAuto();
      scrollToIndex(Number(d.getAttribute("data-i")));
      startAuto();
    });
  });

  // Auto
  let timer = null;
  function startAuto(){
    if (timer) return;
    timer = setInterval(next, AUTO_MS);
  }
  function stopAuto(){
    if (!timer) return;
    clearInterval(timer);
    timer = null;
  }

  // Pause on hover (desktop)
  slider?.addEventListener("mouseenter", stopAuto);
  slider?.addEventListener("mouseleave", startAuto);

  // Drag to scroll
  let isDown = false;
  let startX = 0;
  let startScroll = 0;

  function onDown(e){
    isDown = true;
    track.classList.add("grabbing");
    stopAuto();
    startX = (e.touches ? e.touches[0].pageX : e.pageX);
    startScroll = track.scrollLeft;
  }
  function onMove(e){
    if (!isDown) return;
    const x = (e.touches ? e.touches[0].pageX : e.pageX);
    const dx = x - startX;
    track.scrollLeft = startScroll - dx;
  }
  function onUp(){
    if (!isDown) return;
    isDown = false;
    track.classList.remove("grabbing");
    // Snap to nearest
    scrollToIndex(nearestSlideIndex());
    startAuto();
  }

  track.addEventListener("mousedown", onDown);
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);

  track.addEventListener("touchstart", onDown, { passive: true });
  track.addEventListener("touchmove", onMove, { passive: true });
  track.addEventListener("touchend", onUp);

  track.addEventListener("scroll", () => {
    // keep dots in sync
    updateDots();
  });

  // Init
  updateDots();
  startAuto();
}

// ===== Formspree AJAX submit (no redirect) =====
const orderForm = document.getElementById("orderForm");
const formStatus = document.getElementById("formStatus");

if (orderForm) {
  orderForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (formStatus) {
      formStatus.className = "formStatus";
      formStatus.textContent = "Küldés folyamatban…";
    }

    try {
      const data = new FormData(orderForm);

      const res = await fetch(orderForm.action, {
        method: "POST",
        body: data,
        headers: { "Accept": "application/json" }
      });

      if (res.ok) {
        orderForm.reset();
        if (formStatus) {
          formStatus.className = "formStatus ok";
          formStatus.textContent = "Köszönöm! Megkaptam az üzenetet, hamarosan jelentkezem.";
        }
      } else {
        const j = await res.json().catch(() => null);
        if (formStatus) {
          formStatus.className = "formStatus err";
          formStatus.textContent = j?.errors?.[0]?.message
            ? `Hiba: ${j.errors[0].message}`
            : "Hiba történt a küldésnél. Próbáld meg később.";
        }
      }
    } catch (err) {
      if (formStatus) {
        formStatus.className = "formStatus err";
        formStatus.textContent = "Nem sikerült elküldeni (hálózati hiba). Próbáld újra.";
      }
    }
  });
}

