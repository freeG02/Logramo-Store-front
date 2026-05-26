/* ============================================================
   LOGRAMO — v3 SCRIPT
   ============================================================ */

/* ============ GEO CURRENCY ============
   Detects the visitor country via ipapi.co, maps to a local currency,
   fetches a live USD→currency rate, and exposes window.LogramoCurrency.
   Pages call LogramoCurrency.onReady(fn) to re-format prices once detection
   completes. format(usdPrice) returns the localized string ("€26.50", "MXN $549", "$29.99").

   PayPal-supported currencies get full localized checkout. Unsupported markets
   (e.g., AR, CL, CO) fall back to USD throughout so display == charge.        */
window.LogramoCurrency = (function () {
  var COUNTRY_TO_CCY = {
    /* Eurozone */
    ES:'EUR',FR:'EUR',DE:'EUR',IT:'EUR',PT:'EUR',NL:'EUR',BE:'EUR',IE:'EUR',AT:'EUR',FI:'EUR',GR:'EUR',LU:'EUR',SK:'EUR',SI:'EUR',EE:'EUR',LV:'EUR',LT:'EUR',CY:'EUR',MT:'EUR',HR:'EUR',
    /* Anglo + Asia majors — PayPal native */
    US:'USD',CA:'CAD',GB:'GBP',AU:'AUD',NZ:'NZD',CH:'CHF',JP:'JPY',
    SE:'SEK',DK:'DKK',NO:'NOK',PL:'PLN',CZ:'CZK',HU:'HUF',IL:'ILS',TW:'TWD',TH:'THB',SG:'SGD',HK:'HKD',PH:'PHP',
    /* Latin America — full list, even where PayPal can't natively charge.
       Display in local; checkout falls back to USD where unsupported. */
    MX:'MXN',BR:'BRL',
    AR:'ARS',CL:'CLP',CO:'COP',PE:'PEN',UY:'UYU',PY:'PYG',BO:'BOB',
    EC:'USD',SV:'USD',PA:'USD',PR:'USD', /* fully dollarized */
    GT:'GTQ',HN:'HNL',NI:'NIO',CR:'CRC',DO:'DOP',CU:'CUP',JM:'JMD',TT:'TTD',
    VE:'USD', /* VES is highly inflationary — default to USD for stability */
    /* Other notable markets */
    IN:'INR',KR:'KRW',TR:'TRY',ZA:'ZAR',RU:'RUB',CN:'CNY',ID:'IDR',MY:'MYR',VN:'VND',
    SA:'SAR',AE:'AED',EG:'EGP',MA:'MAD',NG:'NGN',KE:'KES',
    RO:'RON',BG:'BGN',UA:'UAH',IS:'ISK'
    /* Everything else → USD fallback */
  };
  var SYMBOLS = {
    USD:'$', EUR:'€', GBP:'£',
    MXN:'MX$', BRL:'R$', CAD:'C$', AUD:'A$', NZD:'NZ$', JPY:'¥',
    CHF:'CHF ', SEK:'kr ', DKK:'kr ', NOK:'kr ', PLN:'zł ', CZK:'Kč ', HUF:'Ft ',
    ILS:'₪', TWD:'NT$', THB:'฿', SGD:'S$', HKD:'HK$', PHP:'₱',
    /* Latin America */
    ARS:'AR$', CLP:'CL$', COP:'COL$', PEN:'S/', UYU:'$U', PYG:'₲', BOB:'Bs',
    GTQ:'Q', HNL:'L', NIO:'C$', CRC:'₡', DOP:'RD$', CUP:'$MN', JMD:'J$', TTD:'TT$',
    /* Other */
    INR:'₹', KRW:'₩', TRY:'₺', ZAR:'R', RUB:'₽', CNY:'¥', IDR:'Rp', MYR:'RM', VND:'₫',
    SAR:'﷼', AED:'AED ', EGP:'E£', MAD:'MAD ', NGN:'₦', KES:'KSh ',
    RON:'lei ', BGN:'лв ', UAH:'₴', ISK:'kr '
  };
  /* PayPal Smart Buttons supported currencies */
  var PAYPAL_OK = ['USD','EUR','GBP','AUD','BRL','CAD','CHF','CZK','DKK','HKD','HUF','ILS','JPY','MXN','NOK','NZD','PHP','PLN','SEK','SGD','THB','TWD'];
  /* Currencies displayed as whole units (no decimals) — most Latam + a few others */
  var WHOLE_UNIT_CCY = ['JPY','HUF','TWD','MXN','BRL','PHP','ARS','CLP','COP','PYG','VND','IDR','KRW','ISK'];

  var state = { ccy: 'USD', rate: 1, country: '', ready: false };
  var subs = [];

  function notify(){ subs.forEach(function(fn){ try{ fn(state); }catch(e){} }); }

  function format(usdAmount, opts) {
    opts = opts || {};
    var n = Number(usdAmount || 0) * (state.rate || 1);
    if (WHOLE_UNIT_CCY.indexOf(state.ccy) > -1) n = Math.round(n);
    else n = Math.round(n * 100) / 100;
    var sym = SYMBOLS[state.ccy] || (state.ccy + ' ');
    var decimals = WHOLE_UNIT_CCY.indexOf(state.ccy) > -1 ? 0 : 2;
    var formatted = n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return (opts.bare ? '' : sym) + formatted;
  }

  function checkoutCurrency() {
    return PAYPAL_OK.indexOf(state.ccy) > -1 ? state.ccy : 'USD';
  }
  function checkoutAmount(usdAmount) {
    /* If PayPal can charge in local, return the localized amount; else USD original */
    if (checkoutCurrency() === 'USD') return Number(usdAmount || 0).toFixed(2);
    var n = Number(usdAmount || 0) * (state.rate || 1);
    var decimals = WHOLE_UNIT_CCY.indexOf(state.ccy) > -1 ? 0 : 2;
    return (WHOLE_UNIT_CCY.indexOf(state.ccy) > -1 ? Math.round(n) : Math.round(n * 100) / 100).toFixed(decimals);
  }
  /* When display currency != checkout currency (e.g., ARS shown, USD charged),
     return a buyer-facing note. Otherwise empty string. */
  function checkoutNote(usdAmount) {
    var co = checkoutCurrency();
    if (co === state.ccy) return '';
    return 'El cobro se realiza en USD ($' + Number(usdAmount || 0).toFixed(2) + ') a través de PayPal.';
  }

  async function init() {
    /* 1) Manual saved preference wins (set via the currency chip) */
    try {
      var saved = localStorage.getItem('logramo_ccy');
      if (saved) state.ccy = saved.toUpperCase();
    } catch (e) {}
    /* 2) Manual URL override (for testing): ?ccy=EUR */
    try {
      var url = new URL(window.location.href);
      var manual = url.searchParams.get('ccy');
      if (manual) {
        state.country = url.searchParams.get('country') || '';
        state.ccy = manual.toUpperCase();
      }
    } catch (e) {}

    /* Country lookup (cached for the session, with multiple fallbacks) */
    if (!state.ccy || state.ccy === 'USD') {
      var cached;
      try { cached = sessionStorage.getItem('logramo_geo'); } catch (e) {}
      if (cached) {
        try { var g = JSON.parse(cached); state.country = g.country_code || ''; } catch (e) {}
      } else {
        var sources = [
          { url: 'https://ipapi.co/json/', key: 'country_code' },
          { url: 'https://ipwho.is/', key: 'country_code' },
          { url: 'https://get.geojs.io/v1/ip/country.json', key: 'country' }
        ];
        for (var i = 0; i < sources.length; i++) {
          try {
            var rr = await fetch(sources[i].url, { cache: 'no-store' });
            if (!rr.ok) continue;
            var gg = await rr.json();
            var code = (gg && gg[sources[i].key]) || '';
            if (code && code.length === 2) {
              state.country = code.toUpperCase();
              try { sessionStorage.setItem('logramo_geo', JSON.stringify({ country_code: state.country })); } catch (e) {}
              break;
            }
          } catch (e) { /* try next */ }
        }
      }
      state.ccy = COUNTRY_TO_CCY[state.country] || 'USD';
    }

    /* Exchange rate (USD → state.ccy), cached for the session.
       open.er-api.com covers ~160 currencies (incl. DOP, ARS, CLP, COP, PEN).
       frankfurter.app is the fallback. */
    if (state.ccy === 'USD') {
      state.rate = 1;
    } else {
      var rk = 'logramo_rate_' + state.ccy;
      var rc = null;
      try { rc = sessionStorage.getItem(rk); } catch (e) {}
      if (rc) {
        state.rate = parseFloat(rc) || 1;
      } else {
        var rate = 0;
        try {
          var r1 = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store' });
          if (r1.ok) {
            var d1 = await r1.json();
            rate = (d1 && d1.rates && d1.rates[state.ccy]) || 0;
          }
        } catch (e) {}
        if (!rate) {
          try {
            var r2 = await fetch('https://api.frankfurter.app/latest?from=USD&to=' + state.ccy, { cache: 'no-store' });
            if (r2.ok) {
              var d2 = await r2.json();
              rate = (d2 && d2.rates && d2.rates[state.ccy]) || 0;
            }
          } catch (e) {}
        }
        state.rate = rate || 1;
        try { if (rate) sessionStorage.setItem(rk, String(rate)); } catch (e) {}
      }
    }

    state.ready = true;
    notify();
  }

  function onReady(fn) {
    if (state.ready) { try { fn(state); } catch (e) {} return; }
    subs.push(fn);
  }

  /* Currencies the user can pick. PayPal-supported get full local checkout;
     others display in local and charge in USD with a "charged in USD" note. */
  var OPTIONS = [
    { code:'AUTO', label:'Auto-detect',         flag:'🌐' },
    /* Most relevant for our Spanish-language audience first */
    { code:'USD',  label:'US Dollar',           flag:'🇺🇸' },
    { code:'EUR',  label:'Euro',                flag:'🇪🇺' },
    { code:'MXN',  label:'Mexican Peso',        flag:'🇲🇽' },
    { code:'BRL',  label:'Brazilian Real',      flag:'🇧🇷' },
    { code:'ARS',  label:'Argentine Peso',      flag:'🇦🇷' },
    { code:'CLP',  label:'Chilean Peso',        flag:'🇨🇱' },
    { code:'COP',  label:'Colombian Peso',      flag:'🇨🇴' },
    { code:'PEN',  label:'Peruvian Sol',        flag:'🇵🇪' },
    { code:'UYU',  label:'Uruguayan Peso',      flag:'🇺🇾' },
    { code:'BOB',  label:'Bolivian Boliviano',  flag:'🇧🇴' },
    { code:'DOP',  label:'Dominican Peso',      flag:'🇩🇴' },
    { code:'GTQ',  label:'Guatemalan Quetzal',  flag:'🇬🇹' },
    { code:'CRC',  label:'Costa Rican Colón',   flag:'🇨🇷' },
    /* Other major markets */
    { code:'GBP',  label:'British Pound',       flag:'🇬🇧' },
    { code:'CAD',  label:'Canadian Dollar',     flag:'🇨🇦' },
    { code:'AUD',  label:'Australian Dollar',   flag:'🇦🇺' },
    { code:'CHF',  label:'Swiss Franc',         flag:'🇨🇭' },
    { code:'JPY',  label:'Japanese Yen',        flag:'🇯🇵' },
    { code:'INR',  label:'Indian Rupee',        flag:'🇮🇳' }
  ];
  function options() { return OPTIONS.slice(); }
  function flagFor(ccy) {
    for (var i = 0; i < OPTIONS.length; i++) if (OPTIONS[i].code === ccy) return OPTIONS[i].flag;
    return '';
  }
  function countryFlag(code) {
    if (!code || code.length !== 2) return '🌐';
    try { return code.toUpperCase().replace(/./g, function (c) { return String.fromCodePoint(127397 + c.charCodeAt(0)); }); }
    catch (e) { return '🌐'; }
  }

  async function setCurrency(code) {
    if (code === 'AUTO' || !code) {
      try { localStorage.removeItem('logramo_ccy'); } catch (e) {}
    } else {
      try { localStorage.setItem('logramo_ccy', code.toUpperCase()); } catch (e) {}
    }
    /* Clear caches so we re-detect / refetch rate */
    try { sessionStorage.removeItem('logramo_geo'); } catch (e) {}
    try {
      Object.keys(sessionStorage).filter(function (k) { return k.indexOf('logramo_rate_') === 0; })
        .forEach(function (k) { sessionStorage.removeItem(k); });
    } catch (e) {}
    state = { ccy: 'USD', rate: 1, country: '', ready: false };
    await init();
  }

  init();
  return {
    init: init,
    get: function () { return state; },
    format: format,
    checkoutCurrency: checkoutCurrency,
    checkoutAmount: checkoutAmount,
    checkoutNote: checkoutNote,
    onReady: onReady,
    options: options,
    setCurrency: setCurrency,
    countryFlag: countryFlag,
    flagFor: flagFor
  };
})();

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
function trackPageview(opts) {
  opts = opts || {};
  var base = { path: location.pathname || '/', referrer: document.referrer || '' };
  if (opts.article_id) base.article_id = opts.article_id;
  fetch('https://ipapi.co/json/').then(function (r) { return r.json(); }).catch(function () { return {}; }).then(function (geo) {
    var country = (geo && (geo.country_code || geo.country)) || '';
    var payload = Object.assign({}, base, { country: country });
    var p = sbInsert('pageviews', payload);
    // If the country column doesn't exist yet, fall back to a plain pageview
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

/* Currency chip — shows detected country/currency in the navbar, click to switch */
(function () {
  function setupCcyChip() {
    var chip = document.getElementById('ccyChip');
    var pop = document.getElementById('ccyPopover');
    if (!chip || !pop || !window.LogramoCurrency) return;

    function refreshChip() {
      var s = LogramoCurrency.get();
      var manualSaved = false;
      try { manualSaved = !!localStorage.getItem('logramo_ccy'); } catch (e) {}
      var flagEl = document.getElementById('ccyChipFlag');
      var codeEl = document.getElementById('ccyChipCode');
      /* Prefer the currency's own flag (from OPTIONS) — it's the same flag
         the user sees in the picker, so the chip stays consistent.
         Fall back to the detected country flag when there's no OPTIONS entry. */
      var flag = LogramoCurrency.flagFor(s.ccy) || LogramoCurrency.countryFlag(s.country) || '🌐';
      if (flagEl) flagEl.textContent = flag;
      if (codeEl) codeEl.textContent = s.ccy || 'USD';
      chip.title = manualSaved
        ? 'Currency: ' + s.ccy + ' (manual)'
        : 'Currency: ' + s.ccy + ' (auto from ' + (s.country || 'browser') + ')';
    }

    function renderPopover() {
      var saved = '';
      try { saved = (localStorage.getItem('logramo_ccy') || '').toUpperCase(); } catch (e) {}
      var current = LogramoCurrency.get().ccy;
      var opts = LogramoCurrency.options();
      pop.innerHTML = opts.map(function (o) {
        var isActive;
        if (o.code === 'AUTO') isActive = !saved;
        else isActive = saved === o.code;
        return '<button type="button" class="ccy-popover__item' + (isActive ? ' is-active' : '') + '" data-ccy="' + o.code + '">'
          + '<span class="ccy-popover__flag">' + o.flag + '</span>'
          + '<span>' + o.label + '</span>'
          + '<span class="ccy-popover__code">' + (o.code === 'AUTO' ? '' : o.code) + '</span>'
          + '</button>';
      }).join('');
    }

    chip.addEventListener('click', function (e) {
      e.stopPropagation();
      renderPopover();
      pop.hidden = !pop.hidden;
    });
    document.addEventListener('click', function (e) {
      if (!pop.hidden && !pop.contains(e.target) && e.target !== chip && !chip.contains(e.target)) pop.hidden = true;
    });
    pop.addEventListener('click', async function (e) {
      var btn = e.target.closest('[data-ccy]');
      if (!btn) return;
      pop.hidden = true;
      await LogramoCurrency.setCurrency(btn.dataset.ccy);
      refreshChip();
      /* Force any open page-level re-render hooks to fire by reloading.
         Cleaner than chasing every render callback across pages. */
      window.location.reload();
    });

    /* First render of the chip when LogramoCurrency settles */
    LogramoCurrency.onReady(refreshChip);
    refreshChip();
  }

  /* partials.js inserts the chip after this script loads, so we wait a tick */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setupCcyChip, 50); });
  else setTimeout(setupCcyChip, 50);
})();

/* Mobile menu */
const menuBtn = document.getElementById('menuBtn');
const menuClose = document.getElementById('menuClose');
const mobileNav = document.getElementById('mobileNav');
/* Keep body scroll locked only while something is actually open */
function syncScrollLock() {
  const anyOpen = document.querySelector('.popup-overlay.open')
    || document.getElementById('cartSidebar')?.classList.contains('open')
    || document.getElementById('mobileNav')?.classList.contains('open');
  document.body.style.overflow = anyOpen ? 'hidden' : '';
}
function openMenu() { mobileNav?.classList.add('open'); syncScrollLock(); }
function closeMenu() { mobileNav?.classList.remove('open'); syncScrollLock(); }
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
  overlay.addEventListener('click', e => { if (e.target === overlay) { overlay.classList.remove('open'); syncScrollLock(); } });
  overlay.querySelectorAll('[data-close-popup], .popup__close').forEach(b => {
    b.addEventListener('click', () => { overlay.classList.remove('open'); syncScrollLock(); });
  });
});
function openPopup(id) {
  const p = document.getElementById(id);
  if (p) { p.classList.add('open'); syncScrollLock(); }
}
function closePopup(id) {
  const p = document.getElementById(id);
  if (p) p.classList.remove('open');
  syncScrollLock();
}
function closeAllPopups() {
  document.querySelectorAll('.popup-overlay.open').forEach(p => p.classList.remove('open'));
  syncScrollLock();
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
  syncScrollLock();
}
function closeCart() {
  document.getElementById('cartSidebar')?.classList.remove('open');
  document.getElementById('cartOverlay')?.classList.remove('open');
  syncScrollLock();
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

/* Chat — real contact form. Saves to public.messages and triggers an
   email notification via the DB webhook → send-message-notify edge fn. */
const chatToggle = document.getElementById('chatToggle');
const chatPanel = document.getElementById('chatPanel');
chatToggle?.addEventListener('click', () => {
  const open = chatPanel?.classList.toggle('open');
  chatToggle.innerHTML = open ? '<svg class="icon"><use href="#i-close"/></svg>' : '<svg class="icon"><use href="#i-chat"/></svg>';
});

(function setupChat() {
  const form = document.getElementById('chatForm');
  if (!form) return;
  const body = document.getElementById('chatBody');
  const hint = document.getElementById('chatHint');
  const send = document.getElementById('chatSend');
  const nameEl = document.getElementById('chatName');
  const emailEl = document.getElementById('chatEmail');
  const msgEl = document.getElementById('chatMessage');
  const quickWrap = document.getElementById('chatQuick');

  // Quick-fill buttons drop a starter phrase into the textarea + focus it
  if (quickWrap) {
    quickWrap.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-quick]'); if (!btn) return;
      const seed = btn.getAttribute('data-quick') || '';
      if (msgEl.value.trim()) msgEl.value = msgEl.value + '\n\n' + seed;
      else msgEl.value = seed;
      msgEl.focus();
      // Place cursor at the end
      try { msgEl.setSelectionRange(msgEl.value.length, msgEl.value.length); } catch (_) {}
    });
  }

  function setHint(text, kind) {
    if (!hint) return;
    hint.textContent = text;
    hint.style.color = kind === 'err' ? 'var(--c-terracotta)' : (kind === 'ok' ? 'var(--c-forest)' : '');
  }

  function showSuccessState(name) {
    if (!body) return;
    body.innerHTML =
      '<div class="chat-msg chat-msg--bot">¡Recibido, ' + (name || 'gracias') + '! Te respondemos por email lo antes posible — normalmente en menos de 24 h.</div>' +
      '<div class="chat-msg chat-msg--bot">Mientras tanto, puedes echar un vistazo a <a href="biblioteca.html" style="color:var(--c-terracotta);font-weight:700">la biblioteca</a> o al <a href="blog.html" style="color:var(--c-terracotta);font-weight:700">blog</a>.</div>';
    form.remove();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = (nameEl.value || '').trim();
    const email = (emailEl.value || '').trim();
    const message = (msgEl.value || '').trim();
    if (!name) { setHint('Ponle un nombre para saber cómo llamarte.', 'err'); nameEl.focus(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setHint('Necesitamos un correo válido para responderte.', 'err'); emailEl.focus(); return; }
    if (message.length < 5) { setHint('Cuéntanos un poco más para poder ayudarte.', 'err'); msgEl.focus(); return; }

    send.disabled = true;
    const originalSend = send.innerHTML;
    send.innerHTML = 'Enviando…';
    setHint('Enviando tu mensaje…');

    try {
      const r = await fetch(LOGRAMO_SB_URL + '/rest/v1/messages', {
        method: 'POST',
        headers: {
          'apikey': LOGRAMO_SB_KEY,
          'Authorization': 'Bearer ' + LOGRAMO_SB_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          name: name.slice(0, 60),
          email: email.slice(0, 120),
          body: message.slice(0, 1500),
          source: 'chat:' + (location.pathname || '/')
        })
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      showSuccessState(name.split(/\s+/)[0]);
    } catch (err) {
      send.disabled = false;
      send.innerHTML = originalSend;
      setHint('Algo falló al enviar. Intenta de nuevo o escríbenos a ayuda@logramo.com.', 'err');
    }
  });
})();

/* Video modal */
function ytEmbedId(url) {
  const m = String(url || '').match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : '';
}
function openVideo(card) {
  const yt = ytEmbedId(card && card.dataset ? card.dataset.youtube : '');
  const inner = yt
    ? `<iframe src="https://www.youtube.com/embed/${yt}?autoplay=1&rel=0" title="Video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width:100%;height:100%;border:0;display:block"></iframe>`
    : `<p style="color:#fff;text-align:center;padding:32px;font-family:var(--font-display);font-weight:600;text-transform:uppercase;letter-spacing:.08em;font-size:.85rem;opacity:.7">Video embed listo para conectar</p>`;
  const overlay = document.createElement('div');
  overlay.style.cssText = `position:fixed;inset:0;background:rgba(30,40,32,.85);backdrop-filter:blur(8px);z-index:400;display:flex;align-items:center;justify-content:center;animation:fadeIn .25s ease`;
  overlay.innerHTML = `<div style="position:relative;width:90%;max-width:880px"><button class="video-modal__close" type="button" style="position:absolute;top:-52px;right:0;background:var(--c-cream);border:2px solid var(--c-ink);color:var(--c-ink);font-family:var(--font-display);font-weight:700;cursor:pointer;padding:10px 18px;border-radius:9999px;text-transform:uppercase;letter-spacing:.08em;font-size:.75rem;box-shadow:4px 4px 0 var(--c-ink)">Cerrar</button><div style="background:#111;border:2px solid var(--c-ink);border-radius:24px;overflow:hidden;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;box-shadow:8px 8px 0 var(--c-ink)">${inner}</div></div>`;
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
  // On blog-post pages we wait for the dynamic loader to call trackPageview
  // itself with the resolved article_id; on every other page, fire now.
  if (location.pathname.indexOf('blog-post') === -1) trackPageview();
});
