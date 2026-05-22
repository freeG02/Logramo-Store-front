/* ============================================================
   LOGRAMO — v3 SCRIPT
   ============================================================ */

/* ============ SUPABASE (lightweight REST — no SDK needed here) ============ */
var LOGRAMO_SB_URL = 'https://eopobchvkfvkkrtrzeyu.supabase.co';
var LOGRAMO_SB_KEY = 'sb_publishable_6GZ1L30_DktAPRbsPs-6Lg_PSqJ5c-D';
function sbInsert(table, row) {
  try {
    return fetch(LOGRAMO_SB_URL + '/rest/v1/' + table, {
      method: 'POST',
      headers: {
        'apikey': LOGRAMO_SB_KEY,
        'Authorization': 'Bearer ' + LOGRAMO_SB_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(row)
    }).catch(function () {});
  } catch (e) {}
}
function trackSubscriber(email, source) {
  if (email && /\S+@\S+\.\S+/.test(email)) sbInsert('subscribers', { email: email.trim(), source: source || '' });
}
function trackPageview() {
  var base = { path: location.pathname || '/', referrer: document.referrer || '' };
  fetch('https://ipapi.co/json/').then(function (r) { return r.json(); }).catch(function () { return {}; }).then(function (geo) {
    var country = (geo && (geo.country_code || geo.country)) || '';
    var p = sbInsert('pageviews', { path: base.path, referrer: base.referrer, country: country });
    // If the 'country' column doesn't exist yet, fall back to a plain pageview
    if (p && p.then) p.then(function (res) { if (res && !res.ok) sbInsert('pageviews', base); }).catch(function () {});
  });
}

/* Scroll Reveal */
const reveals = document.querySelectorAll('[data-reveal], [data-stagger]');
if ('IntersectionObserver' in window && reveals.length) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  reveals.forEach(el => io.observe(el));
} else { reveals.forEach(el => el.classList.add('in')); }

/* Number Counter */
const counters = document.querySelectorAll('[data-count]');
if (counters.length && 'IntersectionObserver' in window) {
  const cio = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const el = e.target;
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const prefix = el.dataset.prefix || '';
        const duration = 1400;
        const startTime = performance.now();
        const easeOut = t => 1 - Math.pow(1 - t, 3);
        const tick = (now) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const value = target * easeOut(progress);
          el.textContent = prefix + (Number.isInteger(target) ? Math.floor(value).toLocaleString('es-ES') : value.toFixed(1)) + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        cio.unobserve(el);
      }
    });
  }, { threshold: 0.3 });
  counters.forEach(el => cio.observe(el));
}

/* Hero image crossfade loop */
(function () {
  var heroImgs = document.querySelectorAll('.hero__img-wrap .hero__img');
  if (heroImgs.length < 2) return;
  var i = 0;
  setInterval(function () {
    heroImgs[i].classList.remove('is-active');
    i = (i + 1) % heroImgs.length;
    heroImgs[i].classList.add('is-active');
  }, 4500);
})();

/* Hero Parallax */
const heroImg = document.querySelector('.hero__img-wrap img');
if (heroImg && window.matchMedia('(min-width: 880px)').matches) {
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    if (scrolled < 800) heroImg.style.transform = `translateY(${scrolled * 0.06}px) scale(1.02)`;
  }, { passive: true });
}

/* Nav scroll state */
const mainNav = document.getElementById('mainNav');
if (mainNav) {
  window.addEventListener('scroll', () => {
    mainNav.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

/* Mobile menu */
const menuBtn = document.getElementById('menuBtn');
const menuClose = document.getElementById('menuClose');
const mobileNav = document.getElementById('mobileNav');
function openMenu() { mobileNav?.classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeMenu() { mobileNav?.classList.remove('open'); document.body.style.overflow = ''; }
menuBtn?.addEventListener('click', openMenu);
menuClose?.addEventListener('click', closeMenu);
mobileNav?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeMenu(); closeCart(); closeAllPopups(); } });

/* ============ POPUP SYSTEM ============ */
/* Trigger any popup with: <button data-popup="popup-id">…</button> */
/* Each popup lives in DOM as: <div class="popup-overlay" id="popup-id">…</div> */
document.querySelectorAll('[data-popup]').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();
    const id = btn.dataset.popup;
    openPopup(id);
  });
});
document.querySelectorAll('.popup-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });
  overlay.querySelectorAll('[data-close-popup], .popup__close').forEach(b => {
    b.addEventListener('click', () => overlay.classList.remove('open'));
  });
});
function openPopup(id) {
  const p = document.getElementById(id);
  if (p) { p.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function closePopup(id) {
  const p = document.getElementById(id);
  if (p) p.classList.remove('open');
  document.body.style.overflow = '';
}
function closeAllPopups() {
  document.querySelectorAll('.popup-overlay.open').forEach(p => p.classList.remove('open'));
  document.body.style.overflow = '';
}

/* Form handlers — generic, all popups */
function emailFromForm(form) { var i = form && form.querySelector('input[type="email"]'); return i ? i.value : ''; }
function handlePopupForm(e, popupId, msg, source) {
  e.preventDefault();
  trackSubscriber(emailFromForm(e.target), source || 'popup');
  closePopup(popupId);
  showToast(msg || '¡Listo! Revisa tu correo');
  e.target.reset();
}
function handleFreebie(e) { handlePopupForm(e, 'popup-freebie', '¡Guía enviada! Revisa tu correo', 'freebie'); }
function handleNewsletter(e) { handlePopupForm(e, 'popup-newsletter', '¡Suscripción confirmada!', 'newsletter-popup'); }
function handleSimpleNewsletter(e) { e.preventDefault(); trackSubscriber(emailFromForm(e.target), 'newsletter'); e.target.reset(); showToast('¡Suscripción confirmada! Bienvenido'); }

/* Auto-trigger subscribe popup on blog after delay */
function maybeAutoSubscribe() {
  const isBlog = /blog\.html/i.test(window.location.pathname);
  const dismissed = sessionStorage.getItem('logramo_sub_seen');
  if (isBlog && !dismissed && document.getElementById('popup-newsletter')) {
    setTimeout(() => {
      if (!document.querySelector('.popup-overlay.open')) {
        openPopup('popup-newsletter');
        sessionStorage.setItem('logramo_sub_seen', '1');
      }
    }, 12000); // 12 seconds
  }
}

/* ============ CART ============ */
let cartItems = JSON.parse(localStorage.getItem('logramo_cart') || '[]');
function saveCart() { localStorage.setItem('logramo_cart', JSON.stringify(cartItems)); }
function addToCart(product) {
  const existing = cartItems.find(i => i.id === product.id);
  if (existing) existing.qty = (existing.qty || 1) + 1;
  else cartItems.push({ ...product, qty: 1 });
  saveCart(); renderCart(); openCart();
  showToast(`"${product.name}" añadido al carrito`);
}
function removeFromCart(id) { cartItems = cartItems.filter(i => i.id !== id); saveCart(); renderCart(); }
function renderCart() {
  const container = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');
  const countEl = document.getElementById('cartCount');
  if (!container) return;
  const total = cartItems.reduce((s, i) => s + i.price * (i.qty || 1), 0);
  const count = cartItems.reduce((s, i) => s + (i.qty || 1), 0);
  if (countEl) { countEl.textContent = count; countEl.classList.toggle('visible', count > 0); }
  if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
  if (cartItems.length === 0) {
    container.innerHTML = `<div class="cart-empty"><svg class="icon icon--xl"><use href="#i-cart"/></svg><p>Tu carrito está vacío</p><a href="biblioteca.html" class="btn btn--primary btn--sm" onclick="closeCart()">Ver biblioteca</a></div>`;
    return;
  }
  container.innerHTML = cartItems.map(item => `
    <div class="cart-item">
      <div style="flex:1">
        <div class="cart-item__name">${item.name}</div>
        <div class="cart-item__price">$${(item.price * (item.qty || 1)).toFixed(2)}</div>
      </div>
      <button class="cart-item__remove" onclick="removeFromCart('${item.id}')" aria-label="Eliminar"><svg class="icon icon--sm"><use href="#i-close"/></svg></button>
    </div>`).join('');
}
function openCart() {
  document.getElementById('cartSidebar')?.classList.add('open');
  document.getElementById('cartOverlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  document.getElementById('cartSidebar')?.classList.remove('open');
  document.getElementById('cartOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
}
function checkout() {
  if (cartItems.length === 0) return;
  alert('¡Gracias por tu compra!\n\nEn un proyecto real esto abriría el checkout de pago seguro.');
}
document.getElementById('cartBtn')?.addEventListener('click', openCart);
renderCart();

/* Toast */
let toastTimer;
function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
      position:fixed; bottom:110px; left:50%; transform:translateX(-50%) translateY(20px);
      background:var(--c-ink); color:var(--c-cream); padding:14px 24px;
      border-radius:9999px; font-family:var(--font-display); font-size:.78rem; font-weight:800;
      text-transform:uppercase; letter-spacing:.08em;
      border:2px solid var(--c-ink);
      box-shadow:6px 6px 0 var(--c-terracotta);
      z-index:500; opacity:0;
      transition:all .25s cubic-bezier(.34,1.56,.64,1);
      white-space:nowrap; pointer-events:none;
    `;
    document.body.appendChild(toast);
  }
  clearTimeout(toastTimer);
  toast.textContent = message;
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });
  toastTimer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
  }, 3200);
}

/* Chat */
const chatToggle = document.getElementById('chatToggle');
const chatPanel = document.getElementById('chatPanel');
chatToggle?.addEventListener('click', () => {
  const open = chatPanel?.classList.toggle('open');
  chatToggle.innerHTML = open ? '<svg class="icon"><use href="#i-close"/></svg>' : '<svg class="icon"><use href="#i-chat"/></svg>';
});
function chatOption(text) {
  const body = document.getElementById('chatBody'); if (!body) return;
  const u = document.createElement('div'); u.className = 'chat-msg chat-msg--user'; u.textContent = text; body.appendChild(u);
  setTimeout(() => {
    const b = document.createElement('div'); b.className = 'chat-msg chat-msg--bot';
    const responses = {
      'Tengo un cachorro nuevo': 'Te recomendamos empezar con nuestra guía gratuita "Los primeros 30 días". ¡Es perfecta para ti!',
      'Mi perro tiene un problema de conducta': 'Cuéntanos más. Puedes ver nuestra biblioteca de guías de conducta.',
      'Quiero saber más sobre los libros': 'Visita la biblioteca: <a href="biblioteca.html" style="color:var(--c-terracotta);font-weight:700">Ver biblioteca →</a>',
    };
    b.innerHTML = responses[text] || '¡Gracias! Te responderemos pronto.';
    body.appendChild(b); body.scrollTop = body.scrollHeight;
  }, 700);
  document.querySelector('.chat-panel__options')?.remove();
  body.scrollTop = body.scrollHeight;
}

/* Video modal */
function openVideo(card) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `position:fixed;inset:0;background:rgba(30,40,32,.85);backdrop-filter:blur(8px);z-index:400;display:flex;align-items:center;justify-content:center;animation:fadeIn .25s ease`;
  overlay.innerHTML = `<div style="position:relative;width:90%;max-width:880px"><button class="video-modal__close" type="button" style="position:absolute;top:-52px;right:0;background:var(--c-cream);border:2px solid var(--c-ink);color:var(--c-ink);font-family:var(--font-display);font-weight:700;cursor:pointer;padding:10px 18px;border-radius:9999px;text-transform:uppercase;letter-spacing:.08em;font-size:.75rem;box-shadow:4px 4px 0 var(--c-ink)">Cerrar</button><div style="background:#111;border:2px solid var(--c-ink);border-radius:24px;overflow:hidden;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;box-shadow:8px 8px 0 var(--c-ink)"><p style="color:#fff;text-align:center;padding:32px;font-family:var(--font-display);font-weight:600;text-transform:uppercase;letter-spacing:.08em;font-size:.85rem;opacity:.7">Video embed listo para conectar</p></div></div>`;
  const closeOverlay = () => { overlay.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') closeOverlay(); };
  overlay.addEventListener('click', e => { if (e.target === overlay) closeOverlay(); });
  overlay.querySelector('.video-modal__close').addEventListener('click', closeOverlay);
  document.addEventListener('keydown', onKey);
  document.body.appendChild(overlay);
}

/* Sticky product CTA */
const productHero = document.querySelector('.product-hero');
const stickyCta = document.querySelector('.product-cta-sticky');
if (productHero && stickyCta && 'IntersectionObserver' in window) {
  const obs = new IntersectionObserver(([e]) => stickyCta.classList.toggle('visible', !e.isIntersecting), { threshold: 0 });
  obs.observe(productHero);
}

/* Filters — multi-toggle when row has [data-multi-filter] */
document.querySelectorAll('.filter-row').forEach(row => {
  const multi = row.hasAttribute('data-multi-filter');
  const buttons = row.querySelectorAll('.filter-btn');

  const applyFilter = () => {
    if (!multi) return;
    const active = [...buttons].filter(b => b.classList.contains('active') && b.dataset.filter && b.dataset.filter !== 'all').map(b => b.dataset.filter);
    const cards = document.querySelectorAll('[data-cat]');
    const allMode = active.length === 0;
    let visible = 0;
    cards.forEach(card => {
      // data-cat may hold several space-separated tags (e.g. "cachorros caliente")
      const cardCats = (card.dataset.cat || '').split(/\s+/).filter(Boolean);
      const match = allMode || active.some(a => cardCats.includes(a));
      card.style.display = match ? '' : 'none';
      if (match) visible++;
    });
    let empty = document.getElementById('filterEmpty');
    if (!empty && cards.length) {
      const grid = cards[0].parentElement;
      empty = document.createElement('div');
      empty.id = 'filterEmpty';
      empty.style.cssText = 'grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--c-text-muted);font-weight:600';
      empty.textContent = 'No hay artículos con esos filtros. Prueba con otra combinación.';
      grid.appendChild(empty);
    }
    if (empty) empty.style.display = visible === 0 ? 'block' : 'none';
  };

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (!multi) {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        return;
      }
      const isAll = btn.dataset.filter === 'all';
      if (isAll) {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      } else {
        btn.classList.toggle('active');
        const allBtn = row.querySelector('[data-filter="all"]');
        const anyActive = [...buttons].some(b => b.dataset.filter !== 'all' && b.classList.contains('active'));
        if (allBtn) allBtn.classList.toggle('active', !anyActive);
      }
      applyFilter();
    });
  });

  const clearBtn = document.getElementById('filterClear');
  if (multi && clearBtn) {
    clearBtn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      const allBtn = row.querySelector('[data-filter="all"]');
      if (allBtn) allBtn.classList.add('active');
      applyFilter();
    });
  }
});

/* Comments */
function initComments() {
  const form = document.getElementById('commentForm'); if (!form) return;
  const key = `logramo_comments_${window.location.pathname}`;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = form.querySelector('[name="name"]')?.value.trim();
    const text = form.querySelector('[name="comment"]')?.value.trim();
    if (!name || !text) return;
    const nc = { name, text, date: new Date().toLocaleDateString('es-ES', { day:'numeric', month:'long', year:'numeric' }) };
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    stored.unshift(nc); localStorage.setItem(key, JSON.stringify(stored));
    const list = document.getElementById('commentList');
    if (list) {
      const div = document.createElement('div'); div.className = 'comment';
      div.innerHTML = `<div class="comment__avatar">${escapeHtml(nc.name.slice(0,2).toUpperCase())}</div><div class="comment__body"><div class="comment__header"><span class="comment__name">${escapeHtml(nc.name)}</span><span class="comment__date">${nc.date}</span></div><p class="comment__text">${escapeHtml(nc.text)}</p></div>`;
      list.prepend(div);
    }
    form.reset();
    showToast('¡Comentario publicado!');
  });
}
function replyTo(name) {
  const t = document.querySelector('[name="comment"]'); if (t) { t.value = `@${name} `; t.focus(); }
}
function escapeHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

/* Share */
function initShare() {
  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(document.title);
  document.querySelectorAll('.share-btn').forEach(btn => {
    const p = btn.dataset.platform;
    const links = {
      whatsapp: `https://api.whatsapp.com/send?text=${title}%20${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?text=${title}&url=${url}`,
    };
    if (links[p]) btn.addEventListener('click', () => window.open(links[p], '_blank', 'width=600,height=400'));
  });
}

/* Add to cart */
document.querySelectorAll('[data-add-to-cart]').forEach(btn => {
  btn.addEventListener('click', () => {
    addToCart({
      id: btn.dataset.id || 'guia',
      name: btn.dataset.name || 'Guía',
      price: parseFloat(btn.dataset.price || '0'),
    });
  });
});

/* Reading progress */
const readBar = document.getElementById('readProgress');
const article = document.getElementById('postContent');
if (readBar && article) {
  window.addEventListener('scroll', () => {
    const rect = article.getBoundingClientRect();
    const total = article.offsetHeight - window.innerHeight;
    const pct = Math.min(100, Math.max(0, (-rect.top / total) * 100));
    readBar.style.width = pct + '%';
  }, { passive: true });
}

document.addEventListener('DOMContentLoaded', () => {
  initComments();
  initShare();
  maybeAutoSubscribe();
  trackPageview();
});
