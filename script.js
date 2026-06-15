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
/* ---- Acquisition channel ("where did they come from") ----
   First/last-touch capture from utm_source or the referring host. Stored in
   localStorage so a later signup/purchase carries the channel that brought
   them. Persistence is gated on cookie consent like trackPageview; without
   consent we still attribute the current session (just not persisted). */
function lgConsent() { try { return localStorage.getItem('lg_cookie_consent') === 'accepted'; } catch (e) { return false; } }
function lgClassify(s) {
  s = (s || '').toLowerCase();
  if (/face|fb\b|fb\.|^fb$/.test(s) || s.indexOf('facebook') !== -1) return 'facebook';
  if (s.indexOf('insta') !== -1 || s === 'ig') return 'instagram';
  if (s.indexOf('you') !== -1 || s === 'yt' || s.indexOf('youtu') !== -1) return 'youtube';
  if (s.indexOf('pin') !== -1) return 'pinterest';
  if (s.indexOf('tik') !== -1) return 'tiktok';
  if (s.indexOf('goog') !== -1) return 'google';
  if (s.indexOf('bing') !== -1 || s.indexOf('duckduck') !== -1 || s.indexOf('yahoo') !== -1) return 'google';
  if (s.indexOf('twitter') !== -1 || s === 't.co' || s === 'x.com') return 'twitter';
  if (s.indexOf('mail') !== -1 || s.indexOf('newsletter') !== -1 || s === 'email') return 'email';
  return '';
}
function lgCurrentSignal() {
  try {
    var u = (new URLSearchParams(location.search).get('utm_source') || '').trim();
    if (u) return lgClassify(u) || u.toLowerCase().slice(0, 24);
    var ref = document.referrer || '';
    if (!ref) return '';
    var h = new URL(ref).hostname.replace(/^www\./, '');
    if (h === location.hostname) return '';
    return lgClassify(h) || 'other';
  } catch (e) { return ''; }
}
function getChannel() {
  var sig = lgCurrentSignal();
  if (lgConsent()) {
    try {
      if (sig) localStorage.setItem('lg_channel', sig);
      return localStorage.getItem('lg_channel') || sig || 'direct';
    } catch (e) {}
  }
  return sig || 'direct';
}
// Capture channel as early as possible on every load (cheap, no network).
try { getChannel(); } catch (e) {}

// Buyer country (2-letter code) for sales-by-country. Reuses the geo the
// currency module already detected and cached this session ('logramo_geo').
function getBuyerCountry() {
  try {
    var g = JSON.parse(sessionStorage.getItem('logramo_geo') || '{}');
    return (g.country_code || '').toUpperCase();
  } catch (e) { return ''; }
}

/* ---------- Meta Pixel: code-defined standard events ----------
   The Pixel base code (in every page <head>) defines fbq globally, so these are
   always safe to call. We fire events here in code — NOT via Meta's Event Setup
   Tool — so each carries real value/currency and never breaks on a layout change.
   value/currency use the buyer's CHARGE currency so they match what PayPal bills
   and the server-side Conversions API event. */
function fbCcy() { return (window.LogramoCurrency ? LogramoCurrency.checkoutCurrency() : 'USD'); }
function fbAmt(usd) { return window.LogramoCurrency ? Number(LogramoCurrency.checkoutAmount(usd)) : Number(usd || 0); }
function fbTrack(event, params, eventId) {
  try {
    if (typeof fbq !== 'function') return;
    if (eventId) fbq('track', event, params || {}, { eventID: eventId });
    else fbq('track', event, params || {});
  } catch (e) {}
}

function trackSubscriber(email, source) {
  if (!(email && /\S+@\S+\.\S+/.test(email))) return;
  var row = { email: email.trim(), source: source || '', channel: getChannel() };
  var p = sbInsert('subscribers', row);
  // If the channel column isn't there yet, retry without it so the signup still saves.
  if (p && p.then) p.then(function (res) {
    if (res && !res.ok) sbInsert('subscribers', { email: row.email, source: row.source });
  }).catch(function () {});
  // Newsletter signup = a Lead in Meta's standard-event vocabulary.
  fbTrack('Lead', { content_name: source || 'newsletter' });
}
function trackPageview(opts) {
  opts = opts || {};
  // Non-essential analytics: only run if the visitor accepted cookies.
  try { if (localStorage.getItem('lg_cookie_consent') !== 'accepted') return; } catch (e) { return; }
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

/* Scroll Reveal — IntersectionObserver with a safety fallback.
   On very tall elements (long blog posts) the 0.12 threshold can fail to
   trigger because viewport_height / element_height < 0.12. We add a low
   threshold (0) AND a 1.5s safety timer that force-reveals anything still
   hidden, so content is never permanently invisible on slow devices. */
const reveals = document.querySelectorAll('[data-reveal], [data-stagger]');
if ('IntersectionObserver' in window && reveals.length) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: [0, 0.12], rootMargin: '0px 0px -40px 0px' });
  reveals.forEach(el => io.observe(el));
  // Safety: anything still hidden after 1500ms gets revealed anyway
  setTimeout(() => {
    document.querySelectorAll('[data-reveal]:not(.in), [data-stagger]:not(.in)')
      .forEach(el => { el.classList.add('in'); io.unobserve(el); });
  }, 1500);
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

/* Hero image crossfade loop — also swaps each image's own badge set */
(function () {
  var heroImgs = document.querySelectorAll('.hero__img-wrap .hero__img');
  var stickerSets = document.querySelectorAll('.hero__image .hero__stickers');
  if (heroImgs.length < 2) return;
  var i = 0;
  setInterval(function () {
    heroImgs[i].classList.remove('is-active');
    if (stickerSets[i]) stickerSets[i].classList.remove('is-active');
    i = (i + 1) % heroImgs.length;
    heroImgs[i].classList.add('is-active');
    if (stickerSets[i]) stickerSets[i].classList.add('is-active');
  }, 7000);
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
  // The product/freebie modal must NOT close on backdrop click — only the X button.
  if (overlay.id !== 'popup-freebie-dl') {
    overlay.addEventListener('click', e => { if (e.target === overlay) { overlay.classList.remove('open'); syncScrollLock(); } });
  }
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

/* Auto-trigger subscribe popup on blog after delay.
   Skip entirely when the visitor is a REAL signed-in account (Supabase Auth
   session OR a logramo_user with an `id`, which only the cuenta.html signup
   flow sets). A "remembered" visitor who only typed their email into the
   chat is NOT considered signed in and will still see the prompt. */
function isAuthenticated() {
  try {
    const u = JSON.parse(localStorage.getItem('logramo_user') || 'null');
    if (u && u.id) return true;
  } catch (_) {}
  return !!localStorage.getItem('logramo_supa_auth');
}
function maybeAutoSubscribe() {
  const isBlog = /blog\.html/i.test(window.location.pathname);
  const dismissed = sessionStorage.getItem('logramo_sub_seen');
  if (isBlog && !dismissed && !isAuthenticated() && document.getElementById('popup-newsletter')) {
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
  trackCartAdd(product);
  if (product && product.id && String(product.id).indexOf('demo-') !== 0) {
    fbTrack('AddToCart', {
      content_ids: [product.id], content_type: 'product',
      content_name: product.name || '', value: fbAmt(product.price), currency: fbCcy()
    });
  }
  showToast(`"${product.name}" añadido al carrito`);
}
// Log an add-to-cart so the dashboard can rank products by intent. Non-essential
// analytics: only runs if the visitor accepted cookies, same gate as trackPageview.
function trackCartAdd(product) {
  if (!product || !product.id) return;
  if (String(product.id).indexOf('demo-') === 0) return; // ?demo preview books
  try { if (localStorage.getItem('lg_cookie_consent') !== 'accepted') return; } catch (e) { return; }
  var row = { product_id: product.id, product_title: product.name || '', price: Number(product.price || 0), country: getBuyerCountry() || '' };
  var p = sbInsert('cart_events', row);
  // If the country column isn't there yet, retry without it so the log still saves.
  if (p && p.then) p.then(function (res) { if (res && !res.ok) sbInsert('cart_events', { product_id: row.product_id, product_title: row.product_title, price: row.price }); }).catch(function () {});
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
/* ----- Cart checkout: real multi-item PayPal Smart Buttons -----
   One PayPal order with an items[] breakdown (single capture = one PayPal fee).
   Each line item carries sku = product id; record-purchase reads those server-side
   and writes one purchases row per guide, so every guide fires its own
   confirmation email + PDF. Mirrors the single-product flow in partials.js. */
var cartPayRendered = false;
function checkout() {
  if (cartItems.length === 0) return;
  startCartCheckout();
}
function cartPayConfig() {
  function getSetting(key) {
    return fetch(LOGRAMO_SB_URL + '/rest/v1/site_settings?key=eq.' + encodeURIComponent(key) + '&select=value', {
      headers: { apikey: LOGRAMO_SB_KEY, Authorization: 'Bearer ' + LOGRAMO_SB_KEY }
    }).then(function (r) { return r.ok ? r.json() : []; })
      .then(function (a) { return (Array.isArray(a) && a[0] && a[0].value) || ''; })
      .catch(function () { return ''; });
  }
  return Promise.all([getSetting('paypal_client_id'), getSetting('paypal_env')])
    .then(function (v) { return { client_id: v[0], env: v[1] || 'sandbox' }; });
}
function loadCartPayPalSDK(clientId) {
  return new Promise(function (resolve, reject) {
    if (window.paypal) { resolve(); return; }
    var ccy = (window.LogramoCurrency ? LogramoCurrency.checkoutCurrency() : 'USD');
    var s = document.createElement('script');
    s.src = 'https://www.paypal.com/sdk/js?client-id=' + encodeURIComponent(clientId) + '&currency=' + encodeURIComponent(ccy) + '&intent=capture&enable-funding=card&disable-funding=paylater&components=buttons';
    s.onload = resolve; s.onerror = function () { reject(new Error('sdk load failed')); };
    document.head.appendChild(s);
  });
}
// Build PayPal line items + a breakdown total that EXACTLY equals their sum
// (PayPal rejects the order otherwise). Done in integer minor units to dodge
// floating-point drift, using the same per-item rounding as the product page.
function buildCartOrder() {
  var ccy = (window.LogramoCurrency ? LogramoCurrency.checkoutCurrency() : 'USD');
  var unitStr = function (usd) { return window.LogramoCurrency ? LogramoCurrency.checkoutAmount(usd) : Number(usd || 0).toFixed(2); };
  var sample = unitStr(0);
  var decimals = (String(sample).split('.')[1] || '').length; // 0 for whole-unit ccys, else 2
  var factor = Math.pow(10, decimals);
  var totalMinor = 0;
  var items = cartItems.map(function (it) {
    var qty = Math.max(1, parseInt(it.qty || 1, 10));
    var unit = unitStr(it.price);
    totalMinor += Math.round(Number(unit) * factor) * qty;
    return {
      name: String(it.name || 'Guía Logramo').slice(0, 127),
      quantity: String(qty),
      sku: String(it.id || '').slice(0, 127),
      unit_amount: { value: unit, currency_code: ccy }
    };
  });
  var total = (totalMinor / factor).toFixed(decimals);
  return {
    purchase_units: [{
      amount: { value: total, currency_code: ccy, breakdown: { item_total: { value: total, currency_code: ccy } } },
      description: ('Logramo · ' + cartItems.length + (cartItems.length === 1 ? ' guía' : ' guías')).slice(0, 127),
      custom_id: 'cart',
      items: items
    }]
  };
}
function startCartCheckout() {
  var pay = document.getElementById('cartPay');
  var btn = document.getElementById('cartCheckoutBtn');
  if (!pay || !btn) return;
  var sidebar = document.getElementById('cartSidebar');
  // Paying mode: the PayPal form (card fields + billing address) can be taller
  // than the sidebar, so hand the footer the remaining height + scroll.
  if (sidebar) sidebar.classList.add('cart-sidebar--paying');
  btn.style.display = 'none';
  pay.style.display = '';
  var back = document.getElementById('cartPayBack');
  if (back) back.onclick = function () { pay.style.display = 'none'; btn.style.display = ''; if (sidebar) sidebar.classList.remove('cart-sidebar--paying'); };
  // Currency note when display ccy != charge ccy (e.g. ARS shown, USD charged).
  var note = document.getElementById('cartPayNote');
  if (note && window.LogramoCurrency) {
    var totalUsd = cartItems.reduce(function (s, i) { return s + i.price * (i.qty || 1); }, 0);
    var msg = LogramoCurrency.checkoutNote ? LogramoCurrency.checkoutNote(totalUsd) : '';
    if (msg) { note.textContent = msg; note.style.display = ''; } else { note.style.display = 'none'; }
  }
  renderCartPayPalButtons();
}
function renderCartPayPalButtons() {
  var mount = document.getElementById('cartPayButtons');
  if (!mount) return;
  if (cartPayRendered && window.paypal) { return; } // buttons persist across open/close
  mount.innerHTML = '<p class="muted" style="text-align:center;padding:10px">Cargando pago seguro…</p>';
  cartPayConfig().then(function (cfg) {
    if (!cfg.client_id) { mount.innerHTML = '<p class="muted" style="text-align:center;padding:12px">El checkout estará disponible pronto.</p>'; return; }
    loadCartPayPalSDK(cfg.client_id).then(function () {
      if (!window.paypal || !window.paypal.Buttons) { mount.innerHTML = '<p class="muted">PayPal SDK error.</p>'; return; }
      mount.innerHTML = '';
      var handlers = {
        createOrder: function (data, actions) {
          var totalUsd = cartItems.reduce(function (s, i) { return s + i.price * (i.qty || 1); }, 0);
          fbTrack('InitiateCheckout', {
            content_ids: cartItems.map(function (i) { return i.id; }), content_type: 'product',
            num_items: cartItems.reduce(function (s, i) { return s + (i.qty || 1); }, 0),
            value: fbAmt(totalUsd), currency: fbCcy()
          });
          return actions.order.create(buildCartOrder());
        },
        onApprove: function (data, actions) {
          mount.insertAdjacentHTML('beforeend', '<p class="muted" style="text-align:center;margin-top:10px">Procesando…</p>');
          return actions.order.capture().then(function (details) {
            var orderId = (details && details.id) || (data && data.orderID) || '';
            var channel = (typeof getChannel === 'function' ? getChannel() : null);
            var country = (typeof getBuyerCountry === 'function' ? getBuyerCountry() : null);
            var ids = cartItems.map(function (i) { return i.id; });
            // Server verifies the order with PayPal and records one row per item.
            return fetch(LOGRAMO_SB_URL + '/functions/v1/record-purchase', {
              method: 'POST', headers: { apikey: LOGRAMO_SB_KEY, Authorization: 'Bearer ' + LOGRAMO_SB_KEY, 'Content-Type': 'application/json' },
              body: JSON.stringify({ order_id: orderId, channel: channel, country: country })
            }).catch(function () {}).then(function () {
              cartItems = []; saveCart();
              // Pass the real captured total + currency so gracias.html can fire a
              // Purchase event with the exact value PayPal charged.
              var unit = (details && details.purchase_units && details.purchase_units[0]) || {};
              var amt = (unit && unit.amount) || {};
              window.location.href = 'gracias.html?ids=' + encodeURIComponent(ids.join(',')) + '&order=' + encodeURIComponent(orderId)
                + '&val=' + encodeURIComponent(amt.value || '') + '&cur=' + encodeURIComponent(amt.currency_code || '');
            });
          });
        },
        onError: function (err) { alert('Error en el pago: ' + (err && err.message ? err.message : err)); }
      };
      var FUNDING = window.paypal.FUNDING || {};
      if (FUNDING.CARD) window.paypal.Buttons(Object.assign({}, handlers, { fundingSource: FUNDING.CARD, style: { shape: 'rect', color: 'black', label: 'pay', height: 48 } })).render(mount);
      if (FUNDING.PAYPAL) window.paypal.Buttons(Object.assign({}, handlers, { fundingSource: FUNDING.PAYPAL, style: { shape: 'rect', color: 'gold', label: 'paypal', height: 48 } })).render(mount);
      cartPayRendered = true;
    }).catch(function () { mount.innerHTML = '<p class="muted">No se pudo cargar PayPal.</p>'; });
  });
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
  chatToggle.innerHTML = open ? '<svg class="icon"><use href="#i-close"/></svg>' : '<span class="emoji-icon">💬</span>';
});

(function setupChat() {
  const form     = document.getElementById('chatForm');
  if (!form) return;
  const body     = document.getElementById('chatBody');
  const hint     = document.getElementById('chatHint');
  const send     = document.getElementById('chatSend');
  const nameEl   = document.getElementById('chatName');
  const emailEl  = document.getElementById('chatEmail');
  const nameRow  = document.getElementById('chatNameRow');
  const idRow    = document.getElementById('chatIdentity');
  const idName   = document.getElementById('chatIdName');
  const idEmail  = document.getElementById('chatIdEmail');
  const idChange = document.getElementById('chatIdChange');
  const msgEl    = document.getElementById('chatMessage');
  const quickWrap = document.getElementById('chatQuick');
  const statusEl  = document.getElementById('chatStatus');
  const closedBox = document.getElementById('chatClosed');
  const newConvBtn = document.getElementById('chatNewConvBtn');
  const panel    = document.getElementById('chatPanel');

  const FN_BASE  = 'https://eopobchvkfvkkrtrzeyu.supabase.co/functions/v1';
  const POLL_MS  = 8000;
  const ID_KEY   = 'logramo_user';

  // --- Thread state (hoisted so applyIdentity can read CONV/MSGS safely) ---
  let CONV = null;     // current active conversation object (open or closed)
  let MSGS = [];       // messages in CONV
  let pollTimer = null;

  // --- Identity helpers ---
  function readIdentity() { try { return JSON.parse(localStorage.getItem(ID_KEY)) || null; } catch { return null; } }
  function writeIdentity(u) { try { localStorage.setItem(ID_KEY, JSON.stringify(u)); } catch (_) {} }
  function identityName(u) { return (u && (u.username || u.name)) || ''; }
  // True if a Supabase Auth session exists in localStorage. The cuenta page
  // configures supabase-js with storageKey: 'logramo_supa_auth'.
  function hasAuthSession() {
    try {
      const raw = localStorage.getItem('logramo_supa_auth');
      if (!raw) return false;
      const s = JSON.parse(raw);
      return !!(s && (s.access_token || (s.currentSession && s.currentSession.access_token)));
    } catch { return false; }
  }
  // Hides the strip + fields entirely. Used whenever the visitor is "locked
  // in" — either they're auth-logged-in or they already started a thread.
  function applyMinimal(u) {
    nameEl.value = identityName(u);
    emailEl.value = (u && u.email) || '';
    idRow.hidden = true;
    nameRow.hidden = true;
  }
  function applyIdentity(u) {
    const inThread = !!(CONV && (CONV.is_open || (MSGS && MSGS.length)));
    if (u && u.email) {
      nameEl.value = identityName(u);
      emailEl.value = u.email;
      // Auth-logged-in OR mid-thread: no identity surfaces at all
      if (u.id || hasAuthSession() || inThread) {
        idRow.hidden = true;
        nameRow.hidden = true;
      } else {
        // Remembered between visits, no thread yet → strip with "No soy yo"
        idName.textContent = identityName(u) || u.email.split('@')[0];
        idEmail.textContent = ' · ' + u.email;
        idRow.hidden = false;
        nameRow.hidden = true;
      }
    } else if (inThread) {
      // No saved identity but a thread is active (edge case) — also hide fields
      idRow.hidden = true;
      nameRow.hidden = true;
    } else {
      // Brand-new visitor, no thread → ask for name+email
      idRow.hidden = true;
      nameRow.hidden = false;
    }
  }
  applyIdentity(readIdentity());

  idChange.addEventListener('click', () => {
    idRow.hidden = true;
    nameRow.hidden = false;
    nameEl.value = ''; emailEl.value = '';
    nameEl.focus();
  });

  // --- Quick-fill chips drop a starter phrase into the textarea ---
  if (quickWrap) {
    quickWrap.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-quick]'); if (!btn) return;
      const seed = btn.getAttribute('data-quick') || '';
      msgEl.value = (msgEl.value.trim() ? msgEl.value + '\n\n' : '') + seed;
      msgEl.focus();
      try { msgEl.setSelectionRange(msgEl.value.length, msgEl.value.length); } catch (_) {}
    });
  }

  function setHint(text, kind) {
    if (!hint) return;
    hint.textContent = text;
    hint.style.color = kind === 'err' ? 'var(--c-terracotta)' : '';
  }
  function setStatus(text) { if (statusEl) statusEl.textContent = text; }

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // --- Thread state (CONV, MSGS, pollTimer declared at top of setupChat) ---
  let suppressForceNew = false;

  function renderMessages() {
    if (!CONV) {
      // First-time/empty state: keep the welcome + quick-fill chips intact
      return;
    }
    body.innerHTML = MSGS.map(function (m) {
      const cls = m.direction === 'in' ? 'chat-msg--user' : 'chat-msg--bot';
      return '<div class="chat-msg ' + cls + '">' + esc(m.body).replace(/\n/g, '<br>') + '</div>';
    }).join('');
    // Auto-scroll to newest
    body.scrollTop = body.scrollHeight;
  }

  function showClosedState() {
    closedBox.hidden = false;
    form.style.display = 'none';
    setStatus('● Conversación cerrada');
  }
  function showActiveState() {
    closedBox.hidden = true;
    form.style.display = '';
    // Mid-thread → no identity surfaces, just the textarea
    applyIdentity(readIdentity());
    setStatus('● Online');
  }
  function showNoConvState() {
    // Brand-new visitor or "start over" — form is the primary surface
    CONV = null; MSGS = [];
    closedBox.hidden = true;
    form.style.display = '';
    msgEl.value = '';
    msgEl.placeholder = '¿En qué te podemos ayudar?';
    body.innerHTML =
      '<div class="chat-msg chat-msg--bot">¡Hola! Cuéntanos qué pasa con tu perro y te respondemos por email lo antes posible.</div>' +
      '<div class="chat-panel__quick" id="chatQuick">' +
        '<button type="button" class="chat-panel__option" data-quick="Tengo un cachorro nuevo y no sé por dónde empezar.">Cachorro nuevo</button>' +
        '<button type="button" class="chat-panel__option" data-quick="Mi perro tiene un problema de conducta. Os cuento: ">Problema de conducta</button>' +
        '<button type="button" class="chat-panel__option" data-quick="Tengo una duda sobre uno de los libros: ">Sobre los libros</button>' +
      '</div>';
    // Re-wire quick chips after innerHTML swap
    const qw = document.getElementById('chatQuick');
    if (qw) qw.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-quick]'); if (!btn) return;
      const seed = btn.getAttribute('data-quick') || '';
      msgEl.value = (msgEl.value.trim() ? msgEl.value + '\n\n' : '') + seed;
      msgEl.focus();
    });
    setStatus('● Online');
  }

  async function loadHistory() {
    const u = readIdentity();
    if (!u || !u.email) return; // No identity yet → keep welcome state
    try {
      const r = await fetch(FN_BASE + '/chat-load?email=' + encodeURIComponent(u.email));
      const data = await r.json();
      if (!data.ok || !data.conversations.length) return;
      // Latest conversation = current
      CONV = data.conversations[0];
      MSGS = CONV.messages || [];
      renderMessages();
      if (CONV.is_open) showActiveState();
      else showClosedState();
      msgEl.placeholder = CONV.is_open ? 'Sigue la conversación…' : '';
    } catch (_) { /* keep welcome state if load fails */ }
  }

  function startPolling() {
    stopPolling();
    pollTimer = setInterval(refreshFromServer, POLL_MS);
  }
  function stopPolling() { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } }

  async function refreshFromServer() {
    const u = readIdentity();
    if (!u || !u.email) return;
    try {
      const r = await fetch(FN_BASE + '/chat-load?email=' + encodeURIComponent(u.email));
      const data = await r.json();
      if (!data.ok || !data.conversations.length) return;
      const latest = data.conversations[0];
      // If the open conversation switched (closed + new started), refresh fully
      const sameConv = CONV && CONV.id === latest.id;
      const prevCount = MSGS.length;
      CONV = latest;
      MSGS = latest.messages || [];
      if (!sameConv) {
        renderMessages();
        if (CONV.is_open) showActiveState(); else showClosedState();
        return;
      }
      // Same conversation: render only if message count changed
      if (MSGS.length !== prevCount) renderMessages();
      // Auto-close transition
      if (!CONV.is_open && closedBox.hidden) showClosedState();
    } catch (_) {}
  }

  // --- Submit a new message ---
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setHint('Enviando tu mensaje…');
    const name = (nameEl.value || '').trim();
    const email = (emailEl.value || '').trim();
    const message = (msgEl.value || '').trim();
    if (!name)  { setHint('Ponle un nombre para saber cómo llamarte.', 'err'); nameEl.focus(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setHint('Necesitamos un correo válido para responderte.', 'err'); emailEl.focus(); return; }
    if (message.length < 2) { setHint('Cuéntanos un poco más para poder ayudarte.', 'err'); msgEl.focus(); return; }

    const origSend = send.innerHTML;
    send.disabled = true; send.innerHTML = 'Enviando…';

    try {
      const r = await fetch(FN_BASE + '/chat-send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, body: message, source: 'chat:' + (location.pathname || '/') })
      });
      const data = await r.json();
      if (!r.ok || !data.ok) throw new Error(data.reason || ('HTTP ' + r.status));

      // Remember identity for next time (preserves id from real auth if present)
      const existing = readIdentity() || {};
      writeIdentity(Object.assign({}, existing, { username: name, name: name, email: email }));
      // Push the new initials into the navbar immediately
      if (typeof window.refreshNavUser === 'function') window.refreshNavUser();

      CONV = data.conversation;
      MSGS = data.messages || [];
      renderMessages();
      // Re-apply identity now that CONV exists — its inThread branch hides
      // the identity strip + name/email fields cleanly.
      applyIdentity(readIdentity());
      msgEl.value = '';
      msgEl.placeholder = 'Sigue la conversación…';
      setHint('Te avisamos por email cuando respondamos.');
      startPolling();
    } catch (err) {
      setHint('Algo falló al enviar. Intenta de nuevo o escríbenos a ayuda@logramo.com.', 'err');
    } finally {
      send.disabled = false; send.innerHTML = origSend;
    }
  });

  // --- "Empezar una nueva" after a conversation auto-closes ---
  newConvBtn.addEventListener('click', () => {
    showNoConvState();
    applyIdentity(readIdentity());
    msgEl.focus();
  });

  // --- Open / close the panel ---
  // The existing chatToggle handler above just toggles `.open`.
  // We also need to start polling when it opens.
  if (panel) {
    new MutationObserver(() => {
      if (panel.classList.contains('open')) {
        loadHistory().then(startPolling);
      } else {
        stopPolling();
      }
    }).observe(panel, { attributes: true, attributeFilter: ['class'] });
  }
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

/* Filters — multi-toggle when row has [data-multi-filter].
   Skip rows that have their own dedicated filter logic (blog + library)
   to avoid this generic handler clobbering their click state. */
document.querySelectorAll('.filter-row').forEach(row => {
  if (row.hasAttribute('data-blog-filter') || row.hasAttribute('data-library-filter')) return;
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

/* Cookie-consent banner — gates the non-essential analytics above.
   Essential cookies (auth session, this preference) are always allowed. */
(function () {
  if (location.pathname.indexOf('admin') > -1) return; // not needed on the dashboard
  var KEY = 'lg_cookie_consent';
  var choice;
  try { choice = localStorage.getItem(KEY); } catch (e) { return; }
  if (choice === 'accepted' || choice === 'rejected') return; // already chosen
  function show() {
    if (document.querySelector('.cookie-banner')) return;
    var bar = document.createElement('div');
    bar.className = 'cookie-banner';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Aviso de cookies');
    bar.innerHTML =
      '<p class="cookie-banner__text">Usamos cookies esenciales para que el sitio funcione y, si lo aceptas, cookies de analítica para mejorarlo. Más info en nuestra <a href="politica-cookies.html">Política de Cookies</a>.</p>'
      + '<div class="cookie-banner__actions">'
        + '<button type="button" class="btn btn--cream btn--sm" data-cookie="reject">Rechazar</button>'
        + '<button type="button" class="btn btn--primary btn--sm" data-cookie="accept">Aceptar</button>'
      + '</div>';
    document.body.appendChild(bar);
    setTimeout(function () { bar.classList.add('is-in'); }, 40);
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cookie]'); if (!b) return;
      var v = b.getAttribute('data-cookie') === 'accept' ? 'accepted' : 'rejected';
      try { localStorage.setItem(KEY, v); } catch (e) {}
      bar.classList.remove('is-in');
      setTimeout(function () { if (bar.parentNode) bar.parentNode.removeChild(bar); }, 400);
      // If accepted, count this visit now (blog-post tracks itself on next load)
      if (v === 'accepted' && typeof trackPageview === 'function' && location.pathname.indexOf('blog-post') === -1) {
        trackPageview();
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show);
  else show();
})();
