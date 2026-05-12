// ===== Loading screen =====
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  if (!loader) return;
  setTimeout(() => loader.classList.add('hidden'), 2700);
});

// ===== Pontos anchor scroll minden linkre =====
function preciseScrollTo(href) {
  if (!href || href === "#") return;
  if (href === "#top") { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
  const target = document.querySelector(href);
  if (!target) return;
  const headerH = document.querySelector(".header").getBoundingClientRect().height;
  const isSection = target.tagName === "SECTION";
  const extra = isSection ? 48 : -16;
  const top = target.getBoundingClientRect().top + window.scrollY - headerH + extra;
  window.scrollTo({ top, behavior: "smooth" });
}

document.querySelectorAll('a[href^="#"]').forEach(a => {
  if (a.closest("#mainNav")) return;
  a.addEventListener("click", (e) => {
    e.preventDefault();
    preciseScrollTo(a.getAttribute("href"));
  });
});

// ===== Lightbox navigációval =====
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxClose = document.getElementById("lightboxClose");
const lightboxPrev = document.getElementById("lightboxPrev");
const lightboxNext = document.getElementById("lightboxNext");

let currentGallery = [];
let currentIndex = 0;

function openLightbox(tiles, index) {
  currentGallery = tiles;
  currentIndex = index;
  showLightboxImage();
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function showLightboxImage() {
  if (!lightboxImg || !currentGallery.length) return;
  lightboxImg.src = currentGallery[currentIndex].getAttribute("data-src");
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function lightboxNavigate(dir) {
  currentIndex = (currentIndex + dir + currentGallery.length) % currentGallery.length;
  showLightboxImage();
}

document.querySelectorAll(".slider").forEach(slider => {
  const tiles = Array.from(slider.querySelectorAll(".tile"));
  tiles.forEach((tile, i) => {
    tile.addEventListener("click", () => openLightbox(tiles, i));
  });
});

lightboxClose?.addEventListener("click", closeLightbox);
lightboxPrev?.addEventListener("click", () => lightboxNavigate(-1));
lightboxNext?.addEventListener("click", () => lightboxNavigate(1));
lightbox?.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") lightboxNavigate(-1);
  if (e.key === "ArrowRight") lightboxNavigate(1);
});

// ===== Slider factory =====
function initSlider(sliderEl, trackEl, prevBtnEl, nextBtnEl, dotsEl) {
  if (!trackEl) return;
  const slides = Array.from(trackEl.querySelectorAll(".slide"));
  const AUTO_MS = 6500;

  if (dotsEl) {
    dotsEl.innerHTML = slides.map((_, i) => `<span class="dot" data-i="${i}"></span>`).join("");
  }
  const dots = dotsEl ? Array.from(dotsEl.querySelectorAll(".dot")) : [];

  function getSlideLeft(i) { return slides[i].offsetLeft - 12; }

  function nearestSlideIndex() {
    const x = trackEl.scrollLeft + 1;
    let bestI = 0, bestD = Infinity;
    slides.forEach((s, i) => {
      const d = Math.abs((s.offsetLeft - 12) - x);
      if (d < bestD) { bestD = d; bestI = i; }
    });
    return bestI;
  }

  const MAX_DOTS = 5;
  function updateDots() {
    const current = nearestSlideIndex();
    const total = slides.length;
    let winStart = Math.max(0, current - Math.floor(MAX_DOTS / 2));
    let winEnd = winStart + MAX_DOTS - 1;
    if (winEnd >= total) { winEnd = total - 1; winStart = Math.max(0, winEnd - MAX_DOTS + 1); }
    dots.forEach((d, i) => {
      d.classList.toggle("active", i === current);
      d.classList.toggle("dot--visible", i >= winStart && i <= winEnd);
    });
  }

  function scrollToIndex(i) {
    const idx = (i + slides.length) % slides.length;
    trackEl.scrollTo({ left: getSlideLeft(idx), behavior: "smooth" });
    setTimeout(updateDots, 250);
  }

  function next() { scrollToIndex(nearestSlideIndex() + 1); }
  function prev() { scrollToIndex(nearestSlideIndex() - 1); }

  let timer = null;
  function startAuto() { if (!timer) timer = setInterval(next, AUTO_MS); }
  function stopAuto() { if (timer) { clearInterval(timer); timer = null; } }

  prevBtnEl?.addEventListener("click", () => { stopAuto(); prev(); startAuto(); });
  nextBtnEl?.addEventListener("click", () => { stopAuto(); next(); startAuto(); });

  dots.forEach(d => {
    d.addEventListener("click", () => {
      stopAuto();
      scrollToIndex(Number(d.getAttribute("data-i")));
      startAuto();
    });
  });

  sliderEl?.addEventListener("mouseenter", stopAuto);
  sliderEl?.addEventListener("mouseleave", startAuto);

  // Desktop drag only — touch uses native CSS scroll-snap
  let isDown = false, startX = 0, startScroll = 0, rafId = null;
  function onDown(e) {
    isDown = true; trackEl.classList.add("grabbing"); stopAuto();
    startX = e.pageX;
    startScroll = trackEl.scrollLeft;
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }
  function onMove(e) {
    if (!isDown) return;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      trackEl.scrollLeft = startScroll - (e.pageX - startX);
    });
  }
  function onUp() {
    if (!isDown) return;
    isDown = false; trackEl.classList.remove("grabbing");
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
    scrollToIndex(nearestSlideIndex()); startAuto();
  }

  trackEl.addEventListener("mousedown", onDown);
  trackEl.addEventListener("scroll", updateDots);

  updateDots();
  startAuto();
}

initSlider(
  document.getElementById("workSlider"),
  document.getElementById("sliderTrack"),
  document.getElementById("prevBtn"),
  document.getElementById("nextBtn"),
  document.getElementById("dots")
);

initSlider(
  document.getElementById("dekorSlider"),
  document.getElementById("dekorTrack"),
  document.getElementById("dekorPrev"),
  document.getElementById("dekorNext"),
  document.getElementById("dekorDots")
);

initSlider(
  document.getElementById("eletrekelSlider"),
  document.getElementById("eletrekelTrack"),
  document.getElementById("eletrekelPrev"),
  document.getElementById("eletrekelNext"),
  document.getElementById("eletrekelDots")
);

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

// ===== File input feedback =====
const fileInput = document.querySelector('input[type="file"][name="fajlok"]');
const fileInfo = document.getElementById("fileInfo");

if (fileInput && fileInfo) {
  fileInput.addEventListener("change", () => {
    const files = Array.from(fileInput.files || []);
    if (!files.length) {
      fileInfo.textContent = "Nincs kiválasztott fájl";
      return;
    }
    const names = files.slice(0, 3).map(f => f.name);
    const more = files.length > 3 ? ` +${files.length - 3} további` : "";
    fileInfo.textContent = `${files.length} fájl kiválasztva: ${names.join(", ")}${more}`;
  });
}

// ===== File upload: list + remove + clear =====
(() => {
  const input = document.getElementById("fajlok");
  const pane = document.getElementById("filePane");
  const list = document.getElementById("fileList");
  const summary = document.getElementById("fileSummary");
  const clearBtn = document.getElementById("clearFiles");

  if (!input || !pane || !list || !summary || !clearBtn) return;

  let dt = new DataTransfer();

  const keyOf = (f) => `${f.name}|${f.size}|${f.lastModified}`;

  function formatSize(bytes){
    const kb = bytes / 1024;
    if (kb < 1024) return `${Math.round(kb)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  }

  function syncInput(){
    input.files = dt.files;
  }

  function render(){
    const files = Array.from(dt.files);

    if (!files.length) {
      pane.hidden = true;
      list.innerHTML = "";
      summary.textContent = "";
      return;
    }

    pane.hidden = false;
    summary.textContent = `${files.length} fájl kiválasztva`;

    list.innerHTML = files.map((f) => {
      const safeName = f.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return `
        <li class="fileItem" data-key="${keyOf(f)}">
          <div class="fileLeft">
            <span class="fileName" title="${safeName}">${safeName}</span>
            <span class="fileMeta">${formatSize(f.size)}</span>
          </div>
          <button type="button" class="removeBtn" aria-label="Fájl törlése">×</button>
        </li>
      `;
    }).join("");
  }

  function addFiles(newFiles){
    const existing = new Set(Array.from(dt.files).map(keyOf));

    for (const f of newFiles) {
      const k = keyOf(f);
      if (!existing.has(k)) {
        dt.items.add(f);
        existing.add(k);
      }
    }
    syncInput();
    render();
  }

  function removeByKey(key){
    const files = Array.from(dt.files);
    dt = new DataTransfer();
    files.forEach(f => {
      if (keyOf(f) !== key) dt.items.add(f);
    });
    syncInput();
    render();
  }

  // when user selects files
  input.addEventListener("change", () => {
    const picked = Array.from(input.files || []);
    if (!picked.length) return;
    addFiles(picked);
    // reset native picker so selecting same file again works
    input.value = "";
  });

  // remove single
  list.addEventListener("click", (e) => {
    const btn = e.target.closest(".removeBtn");
    if (!btn) return;
    const li = btn.closest(".fileItem");
    if (!li) return;
    removeByKey(li.getAttribute("data-key"));
  });

  // clear all
  clearBtn.addEventListener("click", () => {
    dt = new DataTransfer();
    syncInput();
    render();
  });

  render();
})();

// ===== Logo click: go to top =====
(() => {
  const logo = document.getElementById("logoTop");
  if (!logo) return;

  logo.addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();

// ===== Hamburger menu =====
(() => {
  const toggle = document.getElementById("menuToggle");
  const nav = document.getElementById("mainNav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    toggle.classList.toggle("open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const href = a.getAttribute("href");
      nav.classList.remove("open");
      toggle.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      setTimeout(() => preciseScrollTo(href), 320);
    });
  });

  document.addEventListener("click", (e) => {
    if (!toggle.contains(e.target) && !nav.contains(e.target)) {
      nav.classList.remove("open");
      toggle.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
})();

// ===== Gallery tabs =====
(() => {
  const tabDescriptions = {
    festmeny: "önálló alkotások, amelyek karaktert és hangulatot visznek az enteriőrbe",
    dekorfal: "egyedi, térre hangolt felületek, ahol a fal a tér részévé válik"
  };

  function switchTab(targetId) {
    document.querySelectorAll(".tab").forEach(t => {
      const active = t.getAttribute("data-tab") === targetId;
      t.classList.toggle("tab--active", active);
      t.setAttribute("aria-selected", String(active));
    });
    document.querySelectorAll(".tab-panel").forEach(p => {
      p.classList.toggle("tab-panel--active", p.id === "panel-" + targetId);
    });
    const desc = document.getElementById("tabDesc");
    if (desc) desc.textContent = tabDescriptions[targetId] || "";
  }

  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => switchTab(tab.getAttribute("data-tab")));
  });

  // Nav links with data-tab-target switch the tab
  document.querySelectorAll("[data-tab-target]").forEach(link => {
    link.addEventListener("click", () => {
      const target = link.getAttribute("data-tab-target");
      if (target) switchTab(target);
    });
  });
})();
