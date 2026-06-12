/* ============================================================
   LOGRAMO — SHARED PARTIALS (icons, nav, footer, cart, chat, popups)
   Auto-injected into every page. Set <body data-page="home|biblioteca|blog|sobre">
   ============================================================ */

const PAGE = document.body.dataset.page || '';

/* ============ ICONS SPRITE ============ */
const ICONS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true"><defs>
  <symbol id="i-arrow-right" viewBox="0 0 24 24"><path d="M4 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-arrow-down" viewBox="0 0 24 24"><path d="M12 4v14M6 13l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-arrow-left" viewBox="0 0 24 24"><path d="M20 12H6M11 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-cart" viewBox="0 0 24 24"><path d="M3 4h2.4l2.2 11.2a2 2 0 002 1.6h8.8a2 2 0 002-1.5L21.6 8H6.4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="20.5" r="1.6" fill="currentColor"/><circle cx="18" cy="20.5" r="1.6" fill="currentColor"/></symbol>
  <symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></symbol>
  <symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></symbol>
  <symbol id="i-close" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></symbol>
  <symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-check-circle" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M7.5 12.5L11 16l6-7.5" stroke="#FEFAE8" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></symbol>
  <symbol id="i-star" viewBox="0 0 24 24"><path d="M12 2.6l2.9 6 6.6.95-4.78 4.66L17.85 21 12 17.9 6.15 21l1.13-6.79L2.5 9.55l6.6-.95z" fill="currentColor"/></symbol>
  <symbol id="i-play" viewBox="0 0 24 24"><path d="M7 4.5v15a1 1 0 001.55.83l11-7.5a1 1 0 000-1.66l-11-7.5A1 1 0 007 4.5z" fill="currentColor"/></symbol>
  <symbol id="i-heart" viewBox="0 0 24 24"><path d="M12 20.5l-1.45-1.32C5.4 14.6 2 11.6 2 7.9 2 5 4.3 2.7 7.2 2.7c1.66 0 3.24.77 4.3 2.04 1.06-1.27 2.64-2.04 4.3-2.04 2.9 0 5.2 2.3 5.2 5.2 0 3.7-3.4 6.7-8.55 11.28z" fill="currentColor"/></symbol>
  <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M16.5 16.5L21 21" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></symbol>
  <symbol id="i-mail" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-pdf" viewBox="0 0 24 24"><path d="M7 2h8l5 5v13a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2z" fill="currentColor"/><path d="M15 2v5h5" fill="none" stroke="#FEFAE8" stroke-width="1.4"/><text x="12" y="17.5" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="5.4" font-weight="900" fill="#FEFAE8" letter-spacing="-.2">PDF</text></symbol>
  <symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 2.5l-8 3v6.2c0 4.8 3.4 9.2 8 10.3 4.6-1.1 8-5.5 8-10.3V5.5z" fill="currentColor"/><path d="M8.5 12.5l2.5 2.5 4.5-5" fill="none" stroke="#FEFAE8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 6.5V12l4 2.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-bell" viewBox="0 0 24 24"><path d="M6 16V10a6 6 0 1112 0v6l1.5 2H4.5z" fill="currentColor"/><path d="M10 20a2 2 0 004 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>
  <symbol id="i-bookmark" viewBox="0 0 24 24"><path d="M6 3h12a1 1 0 011 1v17l-7-4.5L5 21V4a1 1 0 011-1z" fill="currentColor"/></symbol>
  <symbol id="i-chat" viewBox="0 0 24 24"><path d="M4 4h16a2 2 0 012 2v10a2 2 0 01-2 2H9l-5 4v-4a2 2 0 01-2-2V6a2 2 0 012-2z" fill="currentColor"/><circle cx="8.5" cy="11" r="1.2" fill="#FEFAE8"/><circle cx="12" cy="11" r="1.2" fill="#FEFAE8"/><circle cx="15.5" cy="11" r="1.2" fill="#FEFAE8"/></symbol>
  <symbol id="i-grid" viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor"/><rect x="13" y="3" width="8" height="8" rx="2" fill="currentColor"/><rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor"/><rect x="13" y="13" width="8" height="8" rx="2" fill="currentColor"/></symbol>
  <symbol id="i-image" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2.5" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="8.3" cy="9" r="1.8" fill="currentColor"/><path d="M4 18l5-5.5 3.5 3.5 3.5-4L21 17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-paw" viewBox="0 0 24 24"><ellipse cx="12" cy="17" rx="5.5" ry="4.5" fill="currentColor"/><ellipse cx="5.5" cy="11" rx="2.4" ry="3" fill="currentColor"/><ellipse cx="18.5" cy="11" rx="2.4" ry="3" fill="currentColor"/><ellipse cx="9" cy="5.5" rx="2.2" ry="2.8" fill="currentColor"/><ellipse cx="15" cy="5.5" rx="2.2" ry="2.8" fill="currentColor"/></symbol>
  <symbol id="i-book" viewBox="0 0 24 24"><path d="M4 19.5v-15A2.5 2.5 0 016.5 2H20v17H6.5a2.5 2.5 0 00-2.5 2.5z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 19.5A2.5 2.5 0 006.5 22H20v-3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 7h7M9 11h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
  <symbol id="i-leaf" viewBox="0 0 24 24"><path d="M5 19c-1-7 4-15 16-15-1 8-5 14-12 14a4 4 0 01-4-4z" fill="currentColor"/><path d="M5 21c2-5 5-8 9-10" fill="none" stroke="#FEFAE8" stroke-width="1.6" stroke-linecap="round"/></symbol>
  <symbol id="i-target" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12" r="5.5" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12" r="2" fill="currentColor"/></symbol>
  <symbol id="i-flame" viewBox="0 0 24 24"><path d="M12 2c0 4-5 5-5 11a5 5 0 0010 0c0-2-1-3-2-4 .5 2-1 3-2 3-1.5 0-2-2-1-4 1-2 1-4 0-6z" fill="currentColor"/></symbol>
  <symbol id="i-bone" viewBox="0 0 24 24"><path d="M6.5 4a2.5 2.5 0 012.5 2.5c0 .4-.1.8-.3 1.1l1.4 1.4 3-3-1.4-1.4c.3-.2.7-.3 1.1-.3a2.5 2.5 0 110 5c-.4 0-.8-.1-1.1-.3L8.7 12l3 3c.3-.2.7-.3 1.1-.3a2.5 2.5 0 110 5c-.4 0-.8-.1-1.1-.3l-1.4-1.4-3 3 1.4 1.4c-.3.2-.7.3-1.1.3a2.5 2.5 0 110-5c.4 0 .8.1 1.1.3L12 15l-3-3c-.3.2-.7.3-1.1.3a2.5 2.5 0 110-5z" fill="currentColor" transform="rotate(45 12 12)"/></symbol>
  <symbol id="i-instagram" viewBox="0 0 24 24"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1.3" fill="currentColor"/></symbol>
  <symbol id="i-facebook" viewBox="0 0 24 24"><path d="M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.9c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.45 2.9H13.5v7A10 10 0 0022 12z" fill="currentColor"/></symbol>
  <symbol id="i-tiktok" viewBox="0 0 24 24"><path d="M16.5 2h-3v14a3 3 0 11-3-3v-3a6 6 0 106 6V8.5a8 8 0 004.5 1.4V6.9a5 5 0 01-4.5-4.9z" fill="currentColor"/></symbol>
  <symbol id="i-youtube" viewBox="0 0 24 24"><path d="M21.6 7.2a2.6 2.6 0 00-1.8-1.85C18.2 5 12 5 12 5s-6.2 0-7.8.35A2.6 2.6 0 002.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.6 2.6 0 001.8 1.85C5.8 19 12 19 12 19s6.2 0 7.8-.35a2.6 2.6 0 001.8-1.85c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15.2V8.8l5.4 3.2z" fill="currentColor"/></symbol>
  <symbol id="i-whatsapp" viewBox="0 0 24 24"><path d="M12 2a10 10 0 00-8.5 15.2L2 22l4.9-1.5A10 10 0 1012 2zm5.6 13.7c-.2.6-1.2 1.2-1.7 1.3-.5.1-1 .1-1.6-.1-.4-.1-.8-.2-1.5-.5-2.5-1.1-4.2-3.7-4.3-3.9-.1-.2-1-1.4-1-2.7s.7-1.9.9-2.2c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2c.1.2 0 .4-.1.5l-.3.3c-.1.1-.2.3-.1.5.1.2.5.9 1.2 1.5.8.8 1.5 1 1.7 1.1.2.1.3 0 .4-.1l.6-.7c.1-.2.3-.2.5-.1l1.9.9c.2.1.4.2.4.4z" fill="currentColor"/></symbol>
  <symbol id="i-twitter" viewBox="0 0 24 24"><path d="M18.2 2.3h3.3l-7.2 8.3 8.5 11.2H16.2l-5.2-6.8-6 6.8H1.7l7.7-8.8L1.3 2.3h6.8l4.7 6.2z" fill="currentColor"/></symbol>
  <symbol id="i-pinterest" viewBox="0 0 24 24"><path d="M12 2a10 10 0 00-3.7 19.3c-.1-.8-.2-2.2.1-3.1.2-.8 1.4-5.9 1.4-5.9s-.4-.7-.4-1.8c0-1.7 1-2.9 2.2-2.9 1 0 1.5.8 1.5 1.7 0 1-.7 2.6-1 3.9-.3 1.2.6 2.1 1.8 2.1 2.1 0 3.8-2.2 3.8-5.5 0-2.9-2.1-4.9-5.1-4.9-3.4 0-5.4 2.6-5.4 5.2 0 1 .4 2.1.9 2.7.1.1.1.2.1.3l-.3 1.4c-.1.2-.2.3-.4.2-1.5-.7-2.4-2.9-2.4-4.6 0-3.8 2.8-7.3 7.9-7.3 4.2 0 7.4 3 7.4 6.9 0 4.1-2.6 7.4-6.2 7.4-1.2 0-2.4-.6-2.8-1.3l-.7 2.8c-.3 1-.9 2.2-1.4 3A10 10 0 0022 12 10 10 0 0012 2z" fill="currentColor"/></symbol>

  <symbol id="logo-logramo" viewBox="0 0 193.55 28.54">
    <path d="M16.05,24.13c-2.59.2-5.16.38-7.71.55-2.56.17-5.13.34-7.71.49-.11-4.15-.2-8.28-.26-12.38C.29,8.7.17,4.57,0,.39c1.46-.02,2.89-.06,4.31-.13,1.41-.07,2.84-.15,4.27-.26-.24,1.61-.46,3.22-.67,4.84-.21,1.62-.36,3.25-.47,4.88-.09,1.37-.16,2.73-.21,4.09-.05,1.36-.1,2.72-.15,4.09,1.44.04,2.85.06,4.26.06s2.81.02,4.22.07l.49,6.1Z"/>
    <path d="M41.94,12.03v.51c0,.16-.01.33-.03.51-.02.3-.08.8-.16,1.5-.09.7-.21,1.42-.36,2.17-.15.75-.34,1.44-.55,2.07-.22.63-.46,1.03-.72,1.21-.13.09-.57.16-1.32.23s-1.66.13-2.74.2c-1.08.06-2.25.12-3.51.16-1.26.04-2.46.08-3.6.11-1.14.03-2.14.06-3,.08-.86.02-1.43.03-1.71.03h-.67c-.32,0-.65,0-.99-.02-.35-.01-.67-.03-.98-.05-.3-.02-.52-.05-.65-.1-.3-.11-.61-.29-.91-.54-.3-.25-.59-.53-.85-.85-.26-.31-.49-.64-.7-.98-.21-.34-.35-.66-.44-.96-.06-.24-.12-.6-.16-1.09s-.08-1-.1-1.53c-.02-.53-.04-1.05-.05-1.55-.01-.5-.02-.88-.02-1.14,0-.41.01-.98.03-1.71.02-.73.09-1.47.2-2.23.11-.76.27-1.47.47-2.14.21-.66.51-1.13.9-1.39.17-.11.5-.21.98-.29.48-.09,1.04-.16,1.7-.23.65-.06,1.35-.11,2.09-.15.74-.03,1.46-.05,2.17-.07.71-.01,1.36-.02,1.97-.02s1.1.01,1.47.03c.33.02.79.04,1.4.05.61.01,1.29.03,2.04.05.75.02,1.53.06,2.33.11.8.05,1.55.12,2.25.21s1.31.2,1.84.34c.53.14.89.31,1.06.51.28.3.51.76.69,1.37.17.61.31,1.26.41,1.94.1.68.16,1.36.2,2.02.03.66.05,1.2.05,1.61ZM35.03,12.72c0-.26-.01-.57-.03-.91-.02-.35-.05-.7-.1-1.06-.04-.36-.11-.71-.2-1.04-.09-.34-.2-.61-.33-.83-.17-.28-.51-.5-1.01-.65-.5-.15-1.05-.27-1.65-.34-.6-.08-1.19-.12-1.76-.15-.58-.02-1.01-.03-1.29-.03-.15,0-.42,0-.82.02-.39.01-.8.03-1.22.05-.42.02-.82.06-1.19.11-.37.05-.61.11-.72.18-.2.13-.35.33-.46.6-.11.27-.19.57-.24.9-.05.33-.09.65-.1.96-.01.32-.02.57-.02.77s.02.55.05,1.06.08,1.05.13,1.63c.05.58.12,1.1.21,1.58.09.48.2.78.33.91.15.17.44.32.86.42.42.11.88.2,1.37.28.49.08.96.13,1.42.16s.78.05.98.05c.35,0,.76-.01,1.24-.03.48-.02.96-.08,1.45-.16.49-.09.95-.21,1.39-.36.43-.15.78-.36,1.04-.62.15-.15.27-.38.36-.69.09-.3.15-.63.2-.98.04-.35.07-.69.08-1.03.01-.34.02-.6.02-.8Z"/>
    <path d="M66.73,13.4c0,.91,0,1.82-.02,2.72-.01.9-.02,1.81-.02,2.72-.02.48-.03.97-.02,1.47.01.5,0,1-.05,1.5-.07.48-.13.98-.2,1.52s-.17,1.06-.33,1.58c-.15.52-.35,1.01-.6,1.47s-.58.85-.99,1.17c-.11.09-.33.16-.65.23s-.71.13-1.14.2c-.44.06-.9.12-1.4.16-.5.04-.98.08-1.44.11-.46.03-.87.07-1.24.1-.37.03-.63.05-.78.05-1.37.04-2.72.08-4.06.1-1.34.02-2.69.03-4.06.03h-2.09c-.04-.37-.09-.75-.13-1.14-.04-.39-.06-.78-.06-1.17,0-.44-.04-.89-.13-1.35-.09-.47-.19-.93-.29-1.39l2.15.03c.13,0,.49,0,1.09-.02.6-.01,1.3-.02,2.1-.03.8-.01,1.67-.03,2.59-.07.92-.03,1.78-.08,2.56-.15.78-.07,1.45-.14,2.01-.23.55-.09.86-.18.93-.29.17-.28.28-.6.33-.96.04-.36.06-.7.06-1.03,0-.17,0-.35-.02-.54-.01-.18-.03-.36-.05-.54-1.22.09-2.42.16-3.62.23-1.2.07-2.41.1-3.65.1h-1.06c-.42,0-.86-.01-1.3-.03-.45-.02-.88-.05-1.3-.1-.42-.04-.77-.11-1.03-.2-.44-.13-.88-.28-1.32-.44-.45-.16-.86-.36-1.26-.6-.39-.24-.73-.53-1.03-.86-.29-.34-.49-.74-.6-1.22-.07-.24-.1-.5-.11-.78-.01-.28-.02-.54-.02-.78,0-.61.03-1.38.1-2.32.07-.93.18-1.89.34-2.85.16-.97.38-1.88.65-2.74.27-.86.61-1.51,1.03-1.94.24-.26.62-.49,1.16-.69.53-.2,1.14-.36,1.81-.49.67-.13,1.39-.24,2.14-.34.75-.1,1.48-.17,2.2-.21.72-.04,1.37-.08,1.97-.1.6-.02,1.07-.03,1.42-.03,1.22,0,2.44.03,3.65.1l.23-2.09,5.48.81c.02,1.89.04,3.77.05,5.64.01,1.87.02,3.76.02,5.67ZM60.96,12.78c0-.7-.01-1.37-.03-2.04-.02-.66-.05-1.34-.1-2.04-.96-.22-1.91-.39-2.87-.52-.96-.13-1.94-.2-2.94-.2-.17,0-.44.01-.78.03-.35.02-.71.06-1.09.11-.38.05-.73.13-1.06.23s-.55.21-.68.34c-.2.22-.32.47-.36.75-.04.28-.07.57-.07.85,0,.24.03.6.08,1.09s.12.99.21,1.52c.09.52.2,1.01.33,1.47.13.46.26.77.39.95.13.17.29.3.49.39s.41.15.64.18c.23.03.46.05.69.07.23.01.43.02.6.02.43,0,.96-.02,1.58-.05s1.24-.09,1.86-.18,1.2-.21,1.75-.38c.54-.16.96-.39,1.24-.67.04-.02.08-.13.1-.33.02-.2.03-.4.03-.62v-.98Z"/>
    <path d="M89.26,11.19v.75l-6.29.29c.07-.28.1-.61.1-.98,0-.54-.08-.9-.23-1.06-.15-.16-.49-.24-1.01-.24-.74,0-1.56.13-2.45.39-.89.26-1.67.51-2.35.75-.11.96-.2,1.91-.26,2.87-.07.96-.1,1.91-.1,2.87,0,1.07,0,2.13.02,3.18.01,1.05.03,2.11.05,3.18l-5.61.36c-.11-1.39-.22-2.78-.33-4.16-.11-1.38-.21-2.77-.29-4.16-.11-1.85-.25-3.69-.42-5.53-.17-1.84-.35-3.69-.52-5.56,1.24.09,2.47.21,3.7.38,1.23.16,2.46.36,3.7.6l-.16,2.74c.65-.52,1.28-.97,1.88-1.35.6-.38,1.21-.7,1.83-.96.62-.26,1.28-.45,1.97-.57s1.47-.18,2.32-.18c.56,0,1.15.06,1.76.18.61.12,1.13.4,1.57.83.22.24.4.6.55,1.08.15.48.27.98.36,1.52.09.53.15,1.05.18,1.57.03.51.05.92.05,1.22Z"/>
    <path d="M114.05,10.24c0,1.83-.06,3.64-.2,5.45-.13,1.8-.26,3.61-.39,5.41-2.44.22-4.86.4-7.27.55-2.41.15-4.84.23-7.27.23-.22,0-.62,0-1.21-.02-.59-.01-1.21-.03-1.86-.06-.65-.03-1.27-.08-1.86-.13-.59-.05-.98-.14-1.17-.24-.72-.39-1.22-.89-1.5-1.48-.28-.6-.42-1.28-.42-2.04,0-.26.01-.61.03-1.04.02-.43.07-.89.13-1.37.06-.48.15-.92.26-1.34.11-.41.24-.72.39-.91.2-.26.64-.48,1.34-.67.7-.18,1.53-.33,2.5-.44.97-.11,2.01-.2,3.13-.26,1.12-.06,2.19-.11,3.21-.15,1.02-.03,1.93-.05,2.74-.05h1.73c.07-.48.1-.95.1-1.4v-.34c0-.18-.01-.3-.03-.34-.07-.13-.27-.24-.62-.33-.35-.09-.78-.15-1.29-.2-.51-.04-1.07-.08-1.66-.11-.6-.03-1.18-.05-1.74-.05h-2.45c-1.37,0-2.74.03-4.11.08-1.37.05-2.74.1-4.11.15.09-.83.16-1.66.21-2.51.05-.85.06-1.69.02-2.51,1.59-.28,3.18-.48,4.78-.6,1.6-.12,3.21-.18,4.84-.18.59,0,1.23,0,1.92.02.7.01,1.39.03,2.09.07.7.03,1.39.08,2.07.15.68.07,1.32.15,1.91.26.61.11,1.21.31,1.81.59.6.28,1.16.63,1.68,1.04.52.41.98.89,1.37,1.42.39.53.67,1.1.85,1.71.02.07.04.17.05.33.01.15.02.32.02.51v.83ZM106.78,17.9v-4.17c-.63-.02-1.26-.04-1.89-.05-.63-.01-1.26-.02-1.89-.02-.13,0-.5,0-1.09.02-.6.01-1.24.04-1.92.08-.68.04-1.31.1-1.88.16-.57.07-.89.16-.98.29-.11.17-.18.35-.21.54-.03.19-.05.38-.05.57,0,.15.01.36.03.62.02.26.06.53.11.82.05.28.11.54.18.78.06.24.15.41.26.52.09.11.23.19.44.24.21.05.43.1.67.13.24.03.48.05.72.06.24.01.42.02.55.02.52,0,1.08-.02,1.68-.07.6-.04,1.21-.09,1.83-.15s1.22-.12,1.81-.2c.59-.08,1.13-.15,1.63-.21Z"/>
    <path d="M148.36,16.7c0,.91-.02,1.81-.05,2.69-.03.88-.09,1.77-.18,2.66-.91.04-1.79.09-2.63.15-.84.05-1.71.17-2.63.34.26-1.57.39-3.14.39-4.73,0-.28-.02-.77-.07-1.45-.04-.68-.1-1.4-.18-2.15-.08-.75-.17-1.44-.29-2.07-.12-.63-.26-1.04-.41-1.24-.11-.13-.27-.23-.49-.29-.22-.06-.45-.11-.69-.15s-.48-.05-.72-.07c-.24-.01-.44-.02-.59-.02-.26,0-.57.01-.93.03s-.72.06-1.09.11c-.37.05-.72.14-1.06.24-.34.11-.61.24-.83.39-.11.09-.2.32-.28.68-.08.37-.14.82-.18,1.34s-.08,1.09-.11,1.7c-.03.61-.06,1.18-.08,1.71-.02.53-.03,1-.03,1.4v.77c0,1.44.03,2.87.1,4.31-.63.02-1.24.04-1.84.07s-1.21.03-1.84.03h-.26c-.11,0-.22-.01-.33-.03-.13,0-.26-.01-.39-.03v-2.38c0-.67-.01-1.37-.03-2.09-.02-.72-.04-1.35-.07-1.89-.02-.37-.05-.85-.1-1.44-.04-.59-.14-1.16-.29-1.71-.15-.55-.38-1.03-.67-1.44s-.7-.6-1.22-.6c-.24,0-.56.04-.96.11-.4.08-.82.17-1.24.29-.42.12-.81.26-1.17.42-.36.16-.61.33-.77.51-.04.04-.09.29-.15.73-.05.45-.1.99-.15,1.63-.04.64-.09,1.34-.15,2.09-.05.75-.1,1.45-.13,2.1-.03.65-.06,1.21-.1,1.68-.03.47-.05.75-.05.83-.44.04-.88.08-1.32.11-.45.03-.89.05-1.32.05s-.83-.01-1.24-.03c-.41-.02-.82-.05-1.21-.1-.11-2.76-.27-5.49-.47-8.19-.21-2.7-.43-5.42-.67-8.19.61-.07,1.21-.12,1.81-.18s1.2-.08,1.81-.08,1.17.01,1.76.03c.59.02,1.19.04,1.79.07l-.42,2.8c1-.8,1.96-1.4,2.89-1.79.92-.39,2.03-.59,3.31-.59.5,0,.94.06,1.32.18.38.12.73.28,1.04.49.31.21.62.45.93.73.3.28.63.59.98.91.39-.61.84-1.09,1.35-1.45.51-.36,1.06-.64,1.65-.83s1.21-.32,1.86-.38c.65-.05,1.3-.08,1.96-.08.52,0,1.07.02,1.65.05.58.03,1.13.13,1.66.28.53.15,1.02.38,1.45.69.44.3.77.72,1.01,1.24.28.63.51,1.33.69,2.09.17.76.31,1.54.41,2.35.1.8.16,1.6.2,2.38s.05,1.51.05,2.19Z"/>
    <path d="M175.95,12.03v.51c0,.16-.01.33-.03.51-.02.3-.08.8-.16,1.5-.09.7-.21,1.42-.36,2.17-.15.75-.34,1.44-.55,2.07-.22.63-.46,1.03-.72,1.21-.13.09-.57.16-1.32.23s-1.66.13-2.74.2c-1.08.06-2.25.12-3.51.16-1.26.04-2.46.08-3.6.11-1.14.03-2.14.06-3,.08-.86.02-1.43.03-1.71.03h-.67c-.32,0-.65,0-.99-.02-.35-.01-.67-.03-.98-.05-.3-.02-.52-.05-.65-.1-.3-.11-.61-.29-.91-.54-.3-.25-.59-.53-.85-.85-.26-.31-.49-.64-.7-.98-.21-.34-.35-.66-.44-.96-.06-.24-.12-.6-.16-1.09s-.08-1-.1-1.53c-.02-.53-.04-1.05-.05-1.55-.01-.5-.02-.88-.02-1.14,0-.41.01-.98.03-1.71.02-.73.09-1.47.2-2.23.11-.76.27-1.47.47-2.14.21-.66.51-1.13.9-1.39.17-.11.5-.21.98-.29.48-.09,1.04-.16,1.7-.23.65-.06,1.35-.11,2.09-.15.74-.03,1.46-.05,2.17-.07.71-.01,1.36-.02,1.97-.02s1.1.01,1.47.03c.33.02.79.04,1.4.05.61.01,1.29.03,2.04.05.75.02,1.53.06,2.33.11.8.05,1.55.12,2.25.21s1.31.2,1.84.34c.53.14.89.31,1.06.51.28.3.51.76.69,1.37.17.61.31,1.26.41,1.94.1.68.16,1.36.2,2.02.03.66.05,1.2.05,1.61ZM169.04,12.72c0-.26-.01-.57-.03-.91-.02-.35-.05-.7-.1-1.06-.04-.36-.11-.71-.2-1.04-.09-.34-.2-.61-.33-.83-.17-.28-.51-.5-1.01-.65-.5-.15-1.05-.27-1.65-.34-.6-.08-1.19-.12-1.76-.15-.58-.02-1.01-.03-1.29-.03-.15,0-.42,0-.82.02-.39.01-.8.03-1.22.05-.42.02-.82.06-1.19.11-.37.05-.61.11-.72.18-.2.13-.35.33-.46.6-.11.27-.19.57-.24.9-.05.33-.09.65-.1.96-.01.32-.02.57-.02.77s.02.55.05,1.06.08,1.05.13,1.63c.05.58.12,1.1.21,1.58.09.48.2.78.33.91.15.17.44.32.86.42.42.11.88.2,1.37.28.49.08.96.13,1.42.16s.78.05.98.05c.35,0,.76-.01,1.24-.03.48-.02.96-.08,1.45-.16.49-.09.95-.21,1.39-.36.43-.15.78-.36,1.04-.62.15-.15.27-.38.36-.69.09-.3.15-.63.2-.98.04-.35.07-.69.08-1.03.01-.34.02-.6.02-.8Z"/>
    <path d="M185.52,5.61v.58l-1.61.08c-.02.32-.04.64-.05.96-.01.32-.02.63-.02.95,0,.39,0,.78-.03,1.16-.02.39-.04.77-.07,1.16-.2.01-.4.02-.6.03s-.4.01-.6.01c-.07,0-.14,0-.21,0s-.14,0-.2,0c.01-.34.02-.68.03-1.01,0-.34.01-.67.01-1.01s0-.67-.02-1.01c-.02-.34-.04-.67-.06-1.01-.16,0-.32.01-.49.02-.16,0-.33,0-.5,0h-.28c-.09,0-.18,0-.28,0-.02-.41-.03-.82-.03-1.23,0-.41-.01-.81-.02-1.22.84.02,1.66.04,2.49.07s1.65.06,2.48.08c.02.24.04.47.05.7.01.23.02.45.02.69Z"/>
    <path d="M193.55,10.61c-.11,0-.21-.01-.31-.02-.08-.01-.17-.02-.25-.02s-.14,0-.18,0c-.22,0-.43,0-.65.01-.22,0-.43.02-.64.05,0-.23,0-.46.01-.69,0-.23,0-.45,0-.69,0-.42,0-.83-.02-1.24-.01-.41-.03-.82-.04-1.24l-1.75,3.96c-.26-.7-.53-1.38-.82-2.05-.29-.67-.6-1.34-.91-2.01l.13,4.12c-.06,0-.12,0-.19,0-.06,0-.13,0-.2,0-.21,0-.42,0-.62.02s-.41.03-.61.05c.03-.52.06-1.03.08-1.54s.04-1.03.04-1.54c0-.61,0-1.21-.01-1.81s-.02-1.2-.02-1.81c.4,0,.79-.01,1.17-.03.38-.02.77-.05,1.17-.09.13.45.27.89.41,1.32s.29.87.45,1.31c.17-.41.37-.82.59-1.21s.44-.79.67-1.18c.38-.01.75-.02,1.12-.03.37-.01.74-.02,1.12-.02.02.5.04,1,.06,1.49s.05.98.07,1.49c.02.4.03.79.05,1.19s.03.79.04,1.18l.02.7v.38Z"/>
  </symbol>

  <symbol id="illo-paw" viewBox="0 0 80 80"><circle cx="40" cy="52" r="20" fill="#C55932"/><ellipse cx="20" cy="28" rx="9" ry="11" fill="#F6D055"/><ellipse cx="32" cy="18" rx="8" ry="10" fill="#FFCDB8"/><ellipse cx="48" cy="18" rx="8" ry="10" fill="#B5C1AB"/><ellipse cx="60" cy="28" rx="9" ry="11" fill="#ADCBEF"/></symbol>
  <symbol id="illo-book" viewBox="0 0 80 80"><rect x="12" y="12" width="56" height="56" rx="6" fill="#3C4824" stroke="#1E2820" stroke-width="2"/><rect x="18" y="18" width="44" height="44" rx="3" fill="#FEFAE8"/><rect x="24" y="28" width="32" height="4" rx="2" fill="#3C4824"/><rect x="24" y="38" width="24" height="4" rx="2" fill="#C55932"/><rect x="24" y="46" width="28" height="4" rx="2" fill="#3C4824" opacity=".3"/></symbol>
  <symbol id="illo-heart" viewBox="0 0 80 80"><path d="M40 68 L14 40 C8 32 8 22 16 16 C24 10 32 14 40 22 C48 14 56 10 64 16 C72 22 72 32 66 40 Z" fill="#C65768" stroke="#1E2820" stroke-width="2"/></symbol>
  <symbol id="illo-star" viewBox="0 0 80 80"><path d="M40 8 L48 30 L72 30 L52 44 L60 68 L40 54 L20 68 L28 44 L8 30 L32 30 Z" fill="#F6D055" stroke="#1E2820" stroke-width="2"/></symbol>
</defs></svg>`;

/* ============ NAV ============
   Note: "Inicio" links use "./" instead of "index.html" so the URL bar
   stays clean (logramo.com/ instead of logramo.com/index.html). */
const NAV_HTML = `
<nav class="nav" id="mainNav">
  <div class="container nav__inner">
    <a href="./" class="nav__logo" aria-label="Logramo">
      <svg width="130" height="22" viewBox="0 0 193.55 28.54"><use href="#logo-logramo"/></svg>
    </a>
    <ul class="nav__links">
      <li><a href="./" data-link="home">Inicio</a></li>
      <li><a href="biblioteca.html" data-link="biblioteca">Biblioteca</a></li>
      <li><a href="blog.html" data-link="blog">Blog</a></li>
      <li><a href="sobre-nosotros.html" data-link="sobre">Nosotros</a></li>
    </ul>
    <div class="nav__actions">
      <a href="cuenta.html" class="nav__btn nav__btn--user" aria-label="Mi cuenta" title="Mi cuenta" data-link="cuenta" id="navUserBtn">
        <span class="emoji-icon">👤</span>
        <span class="nav__initials" id="navUserInitials" hidden></span>
      </a>
      <button class="nav__btn" id="cartBtn" aria-label="Carrito">
        <svg class="icon"><use href="#i-cart"/></svg>
        <span class="cart-count" id="cartCount">0</span>
      </button>
      <button class="nav__btn nav__hamburger" id="menuBtn" aria-label="Menú">
        <svg class="icon"><use href="#i-menu"/></svg>
      </button>
    </div>
  </div>
</nav>
<div class="mobile-nav" id="mobileNav" role="dialog" aria-label="Menú">
  <div class="mobile-nav__head">
    <a href="./" class="nav__logo">
      <svg width="120" height="20" viewBox="0 0 193.55 28.54"><use href="#logo-logramo"/></svg>
    </a>
    <button class="mobile-nav__close" id="menuClose" aria-label="Cerrar"><svg class="icon"><use href="#i-close"/></svg></button>
  </div>
  <ul class="mobile-nav__links">
    <li><a href="./">Inicio</a></li>
    <li><a href="biblioteca.html">Biblioteca</a></li>
    <li><a href="blog.html">Blog</a></li>
    <li><a href="sobre-nosotros.html">Nosotros</a></li>
    <li><a href="cuenta.html">Mi cuenta</a></li>
  </ul>
</div>`;

/* ============ FOOTER ============ */
const FOOTER_HTML = `
<div class="footer-wrap">
  <footer class="footer">
    <div class="footer__inner">
      <div>
        <div class="footer__brand-logo"><svg width="150" height="24" viewBox="0 0 193.55 28.54"><use href="#logo-logramo"/></svg></div>
        <p class="footer__brand-desc">El sitio que ojalá hubiéramos encontrado nosotros cuando empezamos. Guías claras, sin tecnicismos y escritas para dueños como tú.</p>
        <div class="footer__social">
          <a href="https://www.facebook.com/profile.php?id=61590239832119" target="_blank" rel="noopener" class="footer__social-link footer__social-link--fb" aria-label="Facebook"><svg class="icon"><use href="#i-facebook"/></svg></a>
          <a href="https://youtube.com/@megusta_logramo" target="_blank" rel="noopener" class="footer__social-link footer__social-link--yt" aria-label="YouTube"><svg class="icon"><use href="#i-youtube"/></svg></a>
          <a href="https://pin.it/4WgVTqM4j" target="_blank" rel="noopener" class="footer__social-link footer__social-link--pin" aria-label="Pinterest"><svg class="icon"><use href="#i-pinterest"/></svg></a>
        </div>
      </div>
      <div class="footer__col">
        <h4>Explorar</h4>
        <ul>
          <li><a href="./">Inicio</a></li>
          <li><a href="biblioteca.html">Biblioteca</a></li>
          <li><a href="blog.html">Blog</a></li>
          <li><a href="sobre-nosotros.html">Nosotros</a></li>
        </ul>
      </div>
      <div class="footer__col">
        <h4>Temas</h4>
        <ul>
          <li><a href="biblioteca.html?filter=educacion">Educación</a></li>
          <li><a href="biblioteca.html?filter=salud">Salud</a></li>
          <li><a href="biblioteca.html?filter=conducta">Conducta</a></li>
          <li><a href="biblioteca.html?filter=cachorros">Cachorros</a></li>
        </ul>
      </div>
      <div class="footer__col">
        <h4>Legal</h4>
        <ul>
          <li><a href="politica-privacidad.html">Privacidad</a></li>
          <li><a href="terminos.html">Términos</a></li>
          <li><a href="politica-cookies.html">Cookies</a></li>
          <li><a href="reembolsos.html">Reembolsos</a></li>
          <li><a href="mailto:ayuda@logramo.com">Contacto</a></li>
        </ul>
      </div>
    </div>
    <div class="footer__bottom">
      <span>© 2026 Logramo · Todos los derechos reservados</span>
      <span>Hecho con <svg class="heart" viewBox="0 0 24 24" fill="currentColor" aria-label="amor"><path d="M12 20.5l-1.45-1.32C5.4 14.6 2 11.6 2 7.9 2 5 4.3 2.7 7.2 2.7c1.66 0 3.24.77 4.3 2.04 1.06-1.27 2.64-2.04 4.3-2.04 2.9 0 5.2 2.3 5.2 5.2 0 3.7-3.4 6.7-8.55 11.28z"/></svg> para perros y los humanos que los adoran</span>
    </div>
  </footer>
</div>`;

/* ============ CART + CHAT + POPUPS ============ */
const CART_HTML = `
<div class="cart-overlay" id="cartOverlay" onclick="closeCart()"></div>
<div class="cart-sidebar" id="cartSidebar">
  <div class="cart-sidebar__header">
    <h3 class="cart-sidebar__title">Tu carrito</h3>
    <button class="cart-item__remove" onclick="closeCart()" aria-label="Cerrar"><svg class="icon icon--sm"><use href="#i-close"/></svg></button>
  </div>
  <div class="cart-sidebar__items" id="cartItems"></div>
  <div class="cart-sidebar__footer">
    <div class="cart-total"><span>Total</span><span id="cartTotal">$0.00</span></div>
    <button class="btn btn--primary btn--lg full-w" onclick="checkout()">Ir al pago <svg class="icon"><use href="#i-arrow-right"/></svg></button>
  </div>
</div>`;

const CHAT_HTML = `
<div class="chat-btn">
  <div class="chat-btn__bubble" id="chatBubble">¿En qué te ayudamos? 🐾</div>
  <button class="chat-btn__trigger" id="chatToggle" aria-label="Abrir chat"><span class="emoji-icon">💬</span></button>
</div>
<div class="chat-panel" id="chatPanel">
  <div class="chat-panel__header">
    <div class="chat-panel__avatar"><span class="emoji-icon">🐾</span></div>
    <div><div class="chat-panel__name">Logramo</div><div class="chat-panel__status" id="chatStatus">● Online</div></div>
  </div>
  <div class="chat-panel__body" id="chatBody">
    <div class="chat-msg chat-msg--bot">¡Hola! Cuéntanos qué pasa con tu perro y te respondemos por email lo antes posible.</div>
    <div class="chat-panel__quick" id="chatQuick">
      <button type="button" class="chat-panel__option" data-quick="Tengo un cachorro nuevo y no sé por dónde empezar.">Cachorro nuevo</button>
      <button type="button" class="chat-panel__option" data-quick="Mi perro tiene un problema de conducta. Os cuento: ">Problema de conducta</button>
      <button type="button" class="chat-panel__option" data-quick="Tengo una duda sobre uno de los libros: ">Sobre los libros</button>
    </div>
  </div>
  <div class="chat-panel__closed" id="chatClosed" hidden>
    <p>Esta conversación se cerró por inactividad.</p>
    <button type="button" class="chat-panel__newconv" id="chatNewConvBtn">Empezar una nueva &nbsp;→</button>
  </div>
  <form class="chat-panel__form" id="chatForm" novalidate>
    <div class="chat-panel__identity" id="chatIdentity" hidden>
      <div class="chat-panel__identity-text">
        Te escribimos como <strong id="chatIdName">—</strong>
        <span id="chatIdEmail" class="chat-panel__identity-email"></span>
      </div>
      <button type="button" class="chat-panel__identity-change" id="chatIdChange">No soy yo</button>
    </div>
    <div class="chat-panel__row" id="chatNameRow">
      <input type="text" id="chatName" class="chat-panel__input" placeholder="Tu nombre" maxlength="60" required>
      <input type="email" id="chatEmail" class="chat-panel__input" placeholder="Tu correo" maxlength="120" required>
    </div>
    <textarea id="chatMessage" class="chat-panel__textarea" placeholder="¿En qué te podemos ayudar?" maxlength="1500" rows="3" required></textarea>
    <div class="chat-panel__foot">
      <span class="chat-panel__hint" id="chatHint">Te respondemos al correo que dejes.</span>
      <button type="submit" class="chat-panel__send" id="chatSend">Enviar <svg class="icon icon--xs"><use href="#i-arrow-right"/></svg></button>
    </div>
  </form>
</div>`;

/* ============ FREEBIE DOWNLOAD MODAL ============
   Opens when a visitor clicks Descargar on a free product card. Shows the
   product's cover + title + pages + description + a single big download
   button. If the visitor isn't logged in, the button redirects to
   cuenta.html?next=... which returns here with the modal re-opened and
   the download triggered automatically. */
const FREEBIE_HTML = `
<div class="popup-overlay" id="popup-freebie-dl">
  <div class="popup popup--freebie">
    <button class="popup__close" data-close-popup aria-label="Cerrar"><svg class="icon icon--sm"><use href="#i-close"/></svg></button>
    <div class="freebie-modal__grid">
      <div class="freebie-modal__cover" id="freebieCover"></div>
      <div class="freebie-modal__body">
        <span class="eyebrow" id="freebieEyebrow">Gratis</span>
        <h2 class="freebie-modal__title" id="freebieTitle">—</h2>
        <p class="freebie-modal__meta" id="freebieMeta"></p>
        <p class="freebie-modal__desc" id="freebieDesc">—</p>
        <div class="freebie-modal__details" id="freebieDetails" style="display:none"></div>
        <hr class="freebie-modal__sep" />
        <div class="freebie-modal__price" id="freebiePrice" style="display:none"></div>
        <div class="freebie-modal__badges">
          <div class="trust-item"><span class="emoji-icon">✅</span> Acceso inmediato</div>
          <div class="trust-item"><span class="emoji-icon">⏰</span> Acceso de por vida</div>
        </div>
        <div class="freebie-modal__actions">
          <button type="button" class="btn btn--primary btn--lg full-w" id="freebieDownloadBtn" style="display:none">
            <svg class="icon"><use href="#i-pdf"/></svg> <span id="freebieDownloadLabel">Descargar ahora</span>
          </button>
          <div id="freebiePaypalWrap" style="display:none">
            <div class="paypal-wrap">
              <div class="paypal-wrap__head"><span class="emoji-icon">🛡️</span> <span>Pago seguro · Tarjeta o PayPal</span></div>
              <div id="paypal-button-container"></div>
              <p class="paypal-wrap__note" id="freebiePaypalNote" style="display:none"></p>
            </div>
          </div>
          <p class="freebie-modal__hint" id="freebieHint">El PDF se descarga al instante.</p>
        </div>
        <div class="freebie-modal__related" id="freebieRelated" style="display:none"></div>
      </div>
    </div>
  </div>
</div>
<div class="lightbox" id="imgLightbox" aria-hidden="true">
  <button type="button" class="lightbox__close" id="lbClose" aria-label="Cerrar">✕</button>
  <button type="button" class="lightbox__nav lightbox__nav--prev" id="lbPrev" aria-label="Anterior">‹</button>
  <button type="button" class="lightbox__nav lightbox__nav--next" id="lbNext" aria-label="Siguiente">›</button>
  <img id="lbImg" alt="">
  <div class="lightbox__dots" id="lbDots" aria-hidden="true"></div>
  <div class="lightbox__count" id="lbCount"></div>
</div>`;

/* ============ STANDARD POPUPS ============ */
const POPUPS_HTML = `
<div class="popup-overlay" id="popup-freebie">
  <div class="popup">
    <button class="popup__close" data-close-popup aria-label="Cerrar"><svg class="icon icon--sm"><use href="#i-close"/></svg></button>
    <div class="popup__illo"><svg width="64" height="64"><use href="#illo-book"/></svg></div>
    <h3>Tu guía gratuita</h3>
    <p>Déjanos tu correo y te mandamos "Los primeros 30 días con tu perro" al instante. Gratis. Sin trampas.</p>
    <form class="popup__form" onsubmit="handleFreebie(event)">
      <input type="text" class="popup__input" placeholder="Tu nombre" required />
      <input type="email" class="popup__input" placeholder="Tu correo" required />
      <button type="submit" class="btn btn--primary btn--lg full-w"><svg class="icon"><use href="#i-pdf"/></svg> Enviarme la guía</button>
    </form>
    <p class="popup__note">Sin spam · nunca</p>
  </div>
</div>

<div class="popup-overlay" id="popup-newsletter">
  <div class="popup popup--peach">
    <button class="popup__close" data-close-popup aria-label="Cerrar"><svg class="icon icon--sm"><use href="#i-close"/></svg></button>
    <div class="popup__illo"><svg width="64" height="64" style="color:var(--c-terracotta)"><use href="#i-mail"/></svg></div>
    <h3>Únete a la comunidad</h3>
    <p>Recibe consejos sobre perros, artículos nuevos y guías exclusivas. Una vez por semana. Sin spam.</p>
    <form class="popup__form" onsubmit="handleNewsletter(event)">
      <input type="email" class="popup__input" placeholder="Tu correo electrónico" required />
      <button type="submit" class="btn btn--primary btn--lg full-w">Suscribirme <svg class="icon"><use href="#i-arrow-right"/></svg></button>
    </form>
    <p class="popup__note">+2,400 suscriptores</p>
  </div>
</div>`;

/* ============ INJECT ============ */
function injectPartial(elId, html) {
  const el = document.getElementById(elId);
  if (el) el.outerHTML = html;
}

document.body.insertAdjacentHTML('afterbegin', ICONS_SVG);
injectPartial('partial-nav', NAV_HTML);
injectPartial('partial-footer', FOOTER_HTML);
injectPartial('partial-cart', CART_HTML);
injectPartial('partial-chat', CHAT_HTML);
injectPartial('partial-popups', POPUPS_HTML);
document.body.insertAdjacentHTML('beforeend', FREEBIE_HTML);

/* Mark active nav link */
const linkMap = { home: 'home', biblioteca: 'biblioteca', blog: 'blog', sobre: 'sobre' };
const currentLink = linkMap[PAGE];
if (currentLink) {
  document.querySelectorAll(`[data-link="${currentLink}"]`).forEach(a => a.classList.add('active'));
}

/* ============ NAV USER BUTTON — swap icon for 2-letter initials when known ============
   Identity source is the same `logramo_user` localStorage key that the
   chat panel + cuenta.html read/write. Re-runs on `storage` events so an
   identity change in another tab updates the nav live. */
(function () {
  function initialsFor(u) {
    if (!u) return '';
    const raw = (u.username || u.name || u.email || '').trim();
    if (!raw) return '';
    const parts = raw.replace(/@.*$/, '').split(/[\s._\-+]+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    const one = parts[0] || '';
    return one.slice(0, 2).toUpperCase() || (raw.charAt(0).toUpperCase() + (raw.charAt(1) || '').toUpperCase());
  }
  function applyNavUser() {
    const icon = document.getElementById('navUserIcon');
    const ini = document.getElementById('navUserInitials');
    const btn = document.getElementById('navUserBtn');
    if (!icon || !ini || !btn) return;
    let u = null;
    try { u = JSON.parse(localStorage.getItem('logramo_user')) || null; } catch (_) {}
    const code = initialsFor(u);
    if (code) {
      ini.textContent = code;
      ini.hidden = false;
      icon.style.display = 'none';
      const name = (u && (u.username || u.name)) || (u && u.email) || '';
      btn.setAttribute('aria-label', 'Mi cuenta · ' + name);
      btn.setAttribute('title', name);
    } else {
      ini.hidden = true;
      icon.style.display = '';
      btn.setAttribute('aria-label', 'Mi cuenta');
      btn.setAttribute('title', 'Mi cuenta');
    }
  }
  applyNavUser();
  // Update live when identity changes (chat send, cuenta login, other tab)
  window.addEventListener('storage', function (e) {
    if (e.key === 'logramo_user') applyNavUser();
  });
  // Expose so the chat code can call it without waiting for next page load
  window.refreshNavUser = applyNavUser;
})();

/* ============ FREEBIE DOWNLOAD MODAL — logic ============
   - openFreebieModal(product) fills the modal and shows it.
   - Click "Descargar ahora" → if logged-in, downloads the PDF. If not,
     redirects to cuenta.html?next=...&download=<productId>. On return,
     the freebie auto-opens and the download fires automatically.
   - To trigger the open from elsewhere, use:
       window.openFreebieFor(productId)   // fetches the product first
       window.openFreebieModal(product)   // pass a product row directly
*/
(function () {
  const SB_URL = 'https://eopobchvkfvkkrtrzeyu.supabase.co';
  const SB_KEY = 'sb_publishable_6GZ1L30_DktAPRbsPs-6Lg_PSqJ5c-D';

  const COVER_BG = {
    sky:'#ADCBEF', sage:'#B5C1AB', lavender:'#F2DCFF', golden:'#F6D055',
    pink:'#FCD1D8', peach:'#FFCDB8', terra:'#C55932', forest:'#3C4824',
  };

  function isLoggedIn() {
    try {
      const u = JSON.parse(localStorage.getItem('logramo_user') || 'null');
      if (u && u.id) return true;
    } catch (_) {}
    return !!localStorage.getItem('logramo_supa_auth');
  }

  function showModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('open');
    document.body.classList.add('popup-open');
  }
  function hideModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('open');
    document.body.classList.remove('popup-open');
  }

  /* ----- Cover image carousel inside the modal (auto-advances every 6s) ----- */
  let _coverCarouselTimer = null;
  function stopCoverCarousel() {
    if (_coverCarouselTimer) { clearInterval(_coverCarouselTimer); _coverCarouselTimer = null; }
  }
  function buildCoverCarousel(images) {
    // Dedupe + drop empties
    const list = []; const seen = {};
    (images || []).forEach(function (u) { if (u && !seen[u]) { seen[u] = 1; list.push(u); } });
    if (!list.length) return '';
    const imgs = list.map(function (u, i) {
      return '<img class="cover-carousel__img' + (i === 0 ? ' is-active' : '') + '" src="' + u + '" alt="" />';
    }).join('');
    // Controls row (arrows + dots) BELOW the image — only when >1 image
    let controls = '';
    if (list.length > 1) {
      const dots = list.map(function (_, i) {
        return '<button type="button" class="cover-carousel__dot' + (i === 0 ? ' is-active' : '') + '" data-cc-dot="' + i + '" aria-label="Ir a imagen ' + (i + 1) + '"></button>';
      }).join('');
      controls = '<div class="cover-carousel__controls">'
        + '<button type="button" class="cover-carousel__arrow cover-carousel__arrow--prev" data-cc-prev aria-label="Anterior">‹</button>'
        + '<div class="cover-carousel__dots">' + dots + '</div>'
        + '<button type="button" class="cover-carousel__arrow cover-carousel__arrow--next" data-cc-next aria-label="Siguiente">›</button>'
        + '</div>';
    }
    return '<div class="cover-carousel" data-cover-carousel>'
      + '<div class="cover-image-slot cover-carousel__viewport">' + imgs + '</div>'
      + controls
      + '</div>';
  }
  function startCoverCarousel(root) {
    const car = root.querySelector('[data-cover-carousel]'); if (!car) return;
    const flow = car.querySelector('[data-cover-flow]');
    const items = Array.prototype.slice.call(car.querySelectorAll('.cover-flow__item'));
    const dots = Array.prototype.slice.call(car.querySelectorAll('.cover-carousel__dot'));
    const n = items.length;
    if (!flow || n < 2) return;
    let idx = 0;
    function go(to) {
      idx = (to % n + n) % n;
      const p = (idx - 1 + n) % n, nx = (idx + 1) % n;
      items.forEach(function (it, i) {
        it.classList.remove('is-active', 'is-prev', 'is-next');
        if (i === idx) it.classList.add('is-active');
        else if (i === p) it.classList.add('is-prev');
        else if (i === nx) it.classList.add('is-next');
      });
      dots.forEach(function (d, i) { d.classList.toggle('is-active', i === idx); });
    }
    // Tap a side book -> bring it to centre. Dots -> jump directly.
    items.forEach(function (it) {
      it.addEventListener('click', function () {
        if (moved) { moved = false; return; }
        if (it.classList.contains('is-prev')) go(idx - 1);
        else if (it.classList.contains('is-next')) go(idx + 1);
        else { // centre image -> open it full screen
          var srcs = items.map(function (x) { var im = x.querySelector('img'); return im ? im.src : ''; }).filter(Boolean);
          if (srcs.length) openLightbox(srcs, idx);
        }
      });
    });
    dots.forEach(function (d, i) { d.addEventListener('click', function () { go(i); }); });
    // Swipe / drag (manual only — no auto-advance).
    let startX = null, moved = false;
    function down(x) { startX = x; moved = false; }
    function move(x) { if (startX !== null && Math.abs(x - startX) > 8) moved = true; }
    function up(x) { if (startX === null) return; const dx = x - startX; startX = null; if (Math.abs(dx) > 30) go(dx < 0 ? idx + 1 : idx - 1); }
    flow.addEventListener('touchstart', function (e) { down(e.touches[0].clientX); }, { passive: true });
    flow.addEventListener('touchmove', function (e) { move(e.touches[0].clientX); }, { passive: true });
    flow.addEventListener('touchend', function (e) { up(e.changedTouches[0].clientX); });
    flow.addEventListener('mousedown', function (e) { down(e.clientX); });
    flow.addEventListener('mousemove', function (e) { move(e.clientX); });
    flow.addEventListener('mouseup', function (e) { up(e.clientX); });
    flow.addEventListener('mouseleave', function () { startX = null; });
    go(0);
  }

  /* ----- Full-screen image lightbox (opens from the modal cover) ----- */
  var LB_IMGS = [], LB_IDX = 0;
  function lbRender() {
    var img = document.getElementById('lbImg'); var count = document.getElementById('lbCount');
    if (!LB_IMGS.length || !img) return;
    LB_IDX = ((LB_IDX % LB_IMGS.length) + LB_IMGS.length) % LB_IMGS.length;
    img.src = LB_IMGS[LB_IDX]; img.alt = '';
    if (count) count.textContent = (LB_IDX + 1) + ' / ' + LB_IMGS.length;
    var prev = document.getElementById('lbPrev'), next = document.getElementById('lbNext');
    if (prev) prev.style.display = LB_IMGS.length > 1 ? 'flex' : 'none';
    if (next) next.style.display = LB_IMGS.length > 1 ? 'flex' : 'none';
    var dots = document.getElementById('lbDots');
    if (dots) { var ds = dots.children; for (var i = 0; i < ds.length; i++) ds[i].classList.toggle('is-active', i === LB_IDX); }
  }
  function openLightbox(imgs, idx) {
    LB_IMGS = (imgs || []).slice(); LB_IDX = idx || 0;
    var box = document.getElementById('imgLightbox'); if (!box) return;
    var dots = document.getElementById('lbDots');
    if (dots) {
      dots.innerHTML = '';
      if (LB_IMGS.length > 1) {
        for (var i = 0; i < LB_IMGS.length; i++) {
          var b = document.createElement('button');
          b.type = 'button'; b.setAttribute('data-lb-dot', i); b.setAttribute('aria-label', 'Imagen ' + (i + 1));
          dots.appendChild(b);
        }
      }
    }
    lbRender(); box.classList.add('is-open'); box.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    var box = document.getElementById('imgLightbox'); if (!box) return;
    box.classList.remove('is-open'); box.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  function setupLightbox() {
    var box = document.getElementById('imgLightbox'); if (!box) return;
    var c = document.getElementById('lbClose'); if (c) c.addEventListener('click', closeLightbox);
    var pv = document.getElementById('lbPrev'); if (pv) pv.addEventListener('click', function () { LB_IDX--; lbRender(); });
    var nx = document.getElementById('lbNext'); if (nx) nx.addEventListener('click', function () { LB_IDX++; lbRender(); });
    var dots = document.getElementById('lbDots');
    if (dots) dots.addEventListener('click', function (e) { var d = e.target.closest('[data-lb-dot]'); if (d) { LB_IDX = parseInt(d.getAttribute('data-lb-dot'), 10) || 0; lbRender(); } });
    // Swipe to change image (mobile).
    var lbX = null;
    box.addEventListener('touchstart', function (e) { lbX = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) { if (lbX === null) return; var dx = e.changedTouches[0].clientX - lbX; lbX = null; if (Math.abs(dx) > 40) { LB_IDX += (dx < 0 ? 1 : -1); lbRender(); } });
    box.addEventListener('click', function (e) { if (e.target === box) closeLightbox(); });
    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') { LB_IDX--; lbRender(); }
      else if (e.key === 'ArrowRight') { LB_IDX++; lbRender(); }
    });
  }

  /* ----- PayPal Smart Buttons (ported from producto.html, mounted in the modal) ----- */
  async function fetchSiteSetting(key) {
    try {
      const r = await fetch(SB_URL + '/rest/v1/site_settings?key=eq.' + encodeURIComponent(key) + '&select=value', {
        headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY }
      });
      if (!r.ok) return '';
      const arr = await r.json();
      return (Array.isArray(arr) && arr[0] && arr[0].value) || '';
    } catch (_) { return ''; }
  }
  async function paypalConfig() {
    return { client_id: await fetchSiteSetting('paypal_client_id'), env: (await fetchSiteSetting('paypal_env')) || 'sandbox' };
  }
  function loadPayPalSDK(client_id) {
    return new Promise(function (resolve, reject) {
      if (window.paypal) { resolve(); return; }
      const s = document.createElement('script');
      const ccy = (window.LogramoCurrency ? LogramoCurrency.checkoutCurrency() : 'USD');
      s.src = 'https://www.paypal.com/sdk/js?client-id=' + encodeURIComponent(client_id) + '&currency=' + encodeURIComponent(ccy) + '&intent=capture&enable-funding=card&disable-funding=paylater&components=buttons';
      s.onload = resolve; s.onerror = function () { reject(new Error('sdk load failed')); };
      document.head.appendChild(s);
    });
  }
  async function renderPayPalButtons(p) {
    const mount = document.getElementById('paypal-button-container'); if (!mount) return;
    mount.innerHTML = '<p class="muted" style="text-align:center;padding:10px">Cargando pago seguro…</p>';
    const cfg = await paypalConfig();
    if (!cfg.client_id) { mount.innerHTML = '<p class="muted" style="text-align:center;padding:14px 16px;background:var(--c-cream-alt);border:var(--bw-1) solid var(--c-ink);border-radius:var(--radius-md)">El checkout estará disponible pronto.</p>'; return; }
    try { await loadPayPalSDK(cfg.client_id); } catch (e) { mount.innerHTML = '<p class="muted">No se pudo cargar PayPal.</p>'; return; }
    if (!window.paypal || !window.paypal.Buttons) { mount.innerHTML = '<p class="muted">PayPal SDK error.</p>'; return; }
    mount.innerHTML = '';
    const commonHandlers = {
      createOrder: function (data, actions) {
        const ccy = (window.LogramoCurrency ? LogramoCurrency.checkoutCurrency() : 'USD');
        const amount = (window.LogramoCurrency ? LogramoCurrency.checkoutAmount(p.price) : Number(p.price || 0).toFixed(2));
        return actions.order.create({
          purchase_units: [{ amount: { value: amount, currency_code: ccy }, description: (p.title || 'Producto Logramo').slice(0, 127), custom_id: String(p.id || '') }]
        });
      },
      onApprove: function (data, actions) {
        mount.insertAdjacentHTML('beforeend', '<p class="muted" style="text-align:center;margin-top:10px">Procesando…</p>');
        return actions.order.capture().then(async function (details) {
          const orderId = (details && details.id) || (data && data.orderID) || null;
          const channel = (typeof getChannel === 'function' ? getChannel() : null);
          const country = (typeof getBuyerCountry === 'function' ? getBuyerCountry() : null);
          let recorded = false;
          // Preferred: the server verifies the PayPal order, then records it (service role).
          try {
            const rr = await fetch(SB_URL + '/functions/v1/record-purchase', {
              method: 'POST', headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' },
              body: JSON.stringify({ order_id: orderId, channel: channel, country: country })
            });
            recorded = !!(rr && rr.ok);
          } catch (e) {}
          // Fallback: direct insert (works while the open insert policy still exists).
          if (!recorded) {
            try {
              const payer = (details && details.payer) || {};
              const unit = (details && details.purchase_units && details.purchase_units[0]) || {};
              const amt = (unit && unit.amount) || {};
              const name = [(payer.name && payer.name.given_name) || '', (payer.name && payer.name.surname) || ''].filter(Boolean).join(' ').trim();
              const purchase = {
                email: payer.email_address || '', payer_name: name || null, product_id: p.id,
                amount: Number(amt.value || p.price || 0), currency: amt.currency_code || 'USD',
                paypal_order_id: orderId, status: 'completed', channel: channel, country: country
              };
              const postPurchase = function (row) {
                return fetch(SB_URL + '/rest/v1/purchases', {
                  method: 'POST', headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
                  body: JSON.stringify(row)
                });
              };
              const resp = await postPurchase(purchase);
              if (resp && !resp.ok) { const fb = Object.assign({}, purchase); delete fb.channel; delete fb.country; await postPurchase(fb); }
            } catch (e) {}
          }
          window.location.href = 'gracias.html?id=' + encodeURIComponent(p.id) + '&order=' + encodeURIComponent(details.id || '');
        });
      },
      onError: function (err) { alert('Error en el pago: ' + (err && err.message ? err.message : err)); }
    };
    const FUNDING = window.paypal.FUNDING || {};
    if (FUNDING.CARD) {
      window.paypal.Buttons(Object.assign({}, commonHandlers, { fundingSource: FUNDING.CARD, style: { shape: 'rect', color: 'black', label: 'pay', height: 48 } })).render(mount);
    }
    if (FUNDING.PAYPAL) {
      window.paypal.Buttons(Object.assign({}, commonHandlers, { fundingSource: FUNDING.PAYPAL, style: { shape: 'rect', color: 'gold', label: 'paypal', height: 48 } })).render(mount);
    }
  }

  /* ----- Modal "more details" + recommended (same-category) books ----- */
  var FB_CCOLOR = {sky:['#ADCBEF','#111A17'],peach:['#FFCDB8','#111A17'],sage:['#B5C1AB','#111A17'],golden:['#F6D055','#111A17'],lavender:['#C9C2EC','#111A17'],pink:['#F3C7D6','#111A17'],cream:['#FEFAE8','#111A17'],terracotta:['#C55932','#fff'],terra:['#C55932','#fff'],forest:['#3C4824','#FEFAE8'],ink:['#111A17','#FEFAE8']};
  function fbEsc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fbAsList(v) { if (Array.isArray(v)) return v; if (typeof v === 'string') { try { var j = JSON.parse(v); return Array.isArray(j) ? j : []; } catch (e) { return []; } } return []; }
  function renderModalDetails(p) {
    var el = document.getElementById('freebieDetails'); if (!el) return;
    var mods = fbAsList(p.modules), aud = fbAsList(p.audience);
    var block = function (title, items) {
      if (!items.length) return '';
      return '<div class="fb-detail"><h4 class="fb-detail__h">' + title + '</h4><ul class="fb-detail__list">'
        + items.map(function (m) {
            var d = m.desc || m.description || '';
            return '<li><strong>' + fbEsc(m.title || '') + '</strong>' + (d ? '<span>' + fbEsc(d) + '</span>' : '') + '</li>';
          }).join('')
        + '</ul></div>';
    };
    var html = block('Lo que aprenderás', mods) + block('Para ti si…', aud);
    el.innerHTML = html;
    el.style.display = html ? '' : 'none';
  }
  function relMiniCard(rp) {
    var cc = FB_CCOLOR[String(rp.cover_color || 'sky').toLowerCase()] || FB_CCOLOR.sky;
    var inner = rp.cover_image
      ? '<span class="cover"><img src="' + fbEsc(rp.cover_image) + '" alt="" loading="lazy"></span>'
      : '<span class="cover gcover" style="background:' + cc[0] + ';color:' + cc[1] + '"><span class="gcover__top"><span class="gsub">' + fbEsc(rp.cover_sub || 'Guía') + '</span></span><span class="gtitle">' + fbEsc(rp.cover_title || rp.title || '').replace(/\n/g, '<br>') + '</span></span>';
    return '<a href="#" class="fb-related__item" data-freebie="' + fbEsc(rp.id) + '" aria-label="' + fbEsc(rp.title || '') + '"><span class="book3d book3d--shadow book3d--fill">' + inner + '</span></a>';
  }
  async function renderRelated(p) {
    var el = document.getElementById('freebieRelated'); if (!el) return;
    el.style.display = 'none'; el.innerHTML = '';
    var sel = 'select=id,title,category,cover_color,cover_sub,cover_title,cover_image,is_free';
    var hdr = { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY };
    var rows = [];
    try {
      if (p.category) {
        var r = await fetch(SB_URL + '/rest/v1/products?' + sel + '&published=eq.true&category=eq.' + encodeURIComponent(p.category) + '&id=neq.' + encodeURIComponent(p.id) + '&limit=8', { headers: hdr });
        if (r.ok) rows = await r.json();
      }
      if (rows.length < 4) {
        var r2 = await fetch(SB_URL + '/rest/v1/products?' + sel + '&published=eq.true&id=neq.' + encodeURIComponent(p.id) + '&order=created_at.desc&limit=8', { headers: hdr });
        if (r2.ok) {
          var more = await r2.json(); var seen = {};
          rows.forEach(function (x) { seen[x.id] = 1; });
          more.forEach(function (x) { if (!seen[x.id]) { seen[x.id] = 1; rows.push(x); } });
        }
      }
    } catch (e) { return; }
    rows = (rows || []).slice(0, 4);
    if (!rows.length) return;
    el.innerHTML = '<h4 class="fb-detail__h fb-related__h">También te puede servir</h4><div class="fb-related__row">' + rows.map(relMiniCard).join('') + '</div>';
    el.style.display = '';
  }

  function openFreebieModal(p) {
    if (!p) return;
    stopCoverCarousel();
    // Sync the address bar to producto.html?id=… so the visitor can copy it.
    // Skipped when we're already on that URL (e.g. producto.html shell auto-opened the modal).
    try {
      var currentPath = location.pathname.split('/').pop() || 'index.html';
      var currentId = new URLSearchParams(location.search).get('id');
      if (currentPath !== 'producto.html' || currentId !== p.id) {
        history.pushState({ logramoModal: true, productId: p.id }, '', 'producto.html?id=' + encodeURIComponent(p.id));
      }
    } catch (_) {}
    // ---------- Cover side (new 3D book frame) ----------
    const MODAL_CCOLOR = {sky:['#ADCBEF','#111A17'],peach:['#FFCDB8','#111A17'],sage:['#B5C1AB','#111A17'],golden:['#F6D055','#111A17'],lavender:['#C9C2EC','#111A17'],pink:['#F3C7D6','#111A17'],cream:['#FEFAE8','#111A17'],terracotta:['#C55932','#fff'],terra:['#C55932','#fff'],forest:['#3C4824','#FEFAE8'],ink:['#111A17','#FEFAE8']};
    const cover = document.getElementById('freebieCover');
    if (cover) {
      cover.style.background = 'var(--c-cream-alt)';
      // Tag + banner so the modal cover matches the library card (NUEVO / OFERTA, etc.)
      var _esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
      var _TAG_PRIORITY = ['bestseller', 'caliente', 'nuevo', 'popular', 'recomendado', 'gratis'];
      var _TAGLABELS = { gratis: 'Gratis', nuevo: 'Nuevo', recomendado: 'Recomendado', popular: 'Popular', caliente: 'Caliente', bestseller: 'Más vendido' };
      var _ptags = Array.isArray(p.tags) ? p.tags.slice() : (typeof p.tags === 'string' ? (function () { try { return JSON.parse(p.tags); } catch (e) { return String(p.tags).split(/[,\s]+/).filter(Boolean); } })() : []);
      if (p.created_at && (Date.now() - new Date(p.created_at).getTime()) < 30 * 864e5 && _ptags.indexOf('nuevo') === -1) _ptags.unshift('nuevo');
      var _top = null; for (var _i = 0; _i < _TAG_PRIORITY.length; _i++) { if (_ptags.indexOf(_TAG_PRIORITY[_i]) > -1) { _top = _TAG_PRIORITY[_i]; break; } } if (!_top) _top = _ptags[0] || null;
      var _k = String(_top || '').toLowerCase();
      var _trLabel = _top ? (_TAGLABELS[_k] || (_k.charAt(0).toUpperCase() + _k.slice(1))) : '';
      var _trClass = (_k === 'nuevo' || _k === 'caliente') ? 'gtag gtag--terra gtag--tr' : 'gtag gtag--tr';
      var topTagHtml = _trLabel ? ('<span class="' + _trClass + '">' + _esc(_trLabel) + '</span>') : '';
      var bannerHtml = (p.original_price && Number(p.original_price) > Number(p.price)) ? '<span class="gbanner gbanner--terra">Oferta</span>' : '';
      // Build the image list: cover_image first, then gallery (deduped)
      const imgList = []; if (p.cover_image) imgList.push(p.cover_image);
      const gallery = Array.isArray(p.images) ? p.images : (typeof p.images === 'string' ? (function(){ try { return JSON.parse(p.images); } catch(e){ return []; } })() : []);
      (gallery || []).forEach(function (u) { if (u) imgList.push(u); });
      const seen = {}; const list = []; imgList.forEach(function(u){ if(u && !seen[u]){ seen[u]=1; list.push(u); } });
      if (list.length) {
        cover.classList.add('freebie-modal__cover--image');
        if (list.length === 1) {
          // Single image: just the book, no carousel. Tap to open full screen.
          cover.innerHTML = '<span class="book3d book3d--shadow book3d--fill" style="cursor:zoom-in"><span class="cover"><img src="' + list[0] + '" alt="" />' + topTagHtml + bannerHtml + '</span></span>';
          var _sb = cover.querySelector('.book3d'); if (_sb) _sb.addEventListener('click', function () { openLightbox(list, 0); });
        } else {
          // Multiple images: coverflow — active book centered, neighbors peeking on each
          // side, dots below. Each image is its own book frame; tags show on the centre one.
          const items = list.map(function(u,i){
            if (i === 0) {
              // Cover image → book frame (carries the product tag + banner).
              return '<span class="cover-flow__item cover-flow__item--cover book3d book3d--fill" data-cf-item="0"><span class="cover"><img src="' + u + '" alt="" />' + topTagHtml + bannerHtml + '</span></span>';
            }
            // Other images → paper "page" look.
            return '<span class="cover-flow__item cover-flow__item--page" data-cf-item="' + i + '"><span class="page"><img src="' + u + '" alt="" /></span></span>';
          }).join('');
          const dots = list.map(function(_,i){ return '<button type="button" class="cover-carousel__dot' + (i===0?' is-active':'') + '" data-cc-dot="' + i + '" aria-label="Ir a imagen ' + (i+1) + '"></button>'; }).join('');
          cover.innerHTML = '<div class="cover-carousel cover-carousel--flow" data-cover-carousel><div class="cover-flow" data-cover-flow>' + items + '</div><div class="cover-carousel__dots">' + dots + '</div></div>';
          startCoverCarousel(cover);
        }
      } else {
        cover.classList.remove('freebie-modal__cover--image');
        const cc = MODAL_CCOLOR[String(p.cover_color||'sky').toLowerCase()] || MODAL_CCOLOR.sky;
        const sizeStyle = p.cover_title_size ? ('font-size:' + p.cover_title_size + 'cqw;') : '';
        cover.innerHTML =
          '<span class="book3d book3d--shadow book3d--fill"><span class="cover gcover" style="background:' + cc[0] + ';color:' + cc[1] + '">'
            + topTagHtml
            + '<span class="gcover__top"><span class="gsub">' + (p.cover_sub || 'Guía PDF') + '</span></span>'
            + '<span class="gtitle" style="' + sizeStyle + '">' + ((p.cover_title || p.title || 'Guía').replace(/\n/g, '<br>')) + '</span>'
            + bannerHtml
          + '</span></span>';
      }
    }
    // ---------- Body side ----------
    const tEl = document.getElementById('freebieTitle');
    const dEl = document.getElementById('freebieDesc');
    const mEl = document.getElementById('freebieMeta');
    const eyebrow = document.getElementById('freebieEyebrow');
    if (tEl) tEl.textContent = p.title || (p.is_free ? 'Tu guía gratuita' : 'Tu guía');
    if (dEl) dEl.textContent = p.description || '';
    // After the description: "Lo que aprenderás" + "Para ti si…", then same-category recommendations.
    renderModalDetails(p);
    renderRelated(p);
    // Eyebrow: "Gratis" for free; hidden for paid (price now shown below description, in bold)
    if (eyebrow) {
      if (p.is_free) { eyebrow.textContent = 'Gratis'; eyebrow.style.display = ''; }
      else { eyebrow.textContent = ''; eyebrow.style.display = 'none'; }
    }
    // Price under the description separator — bold for paid; hidden for free
    const priceEl = document.getElementById('freebiePrice');
    if (priceEl) {
      if (p.is_free) { priceEl.textContent = ''; priceEl.style.display = 'none'; }
      else { priceEl.textContent = (window.LogramoCurrency ? LogramoCurrency.format(p.price) : '$' + Number(p.price || 0).toFixed(2)); priceEl.style.display = ''; }
    }
    if (mEl) mEl.textContent = p.is_free ? 'PDF · Descarga inmediata' : 'PDF · Acceso al instante';
    // ---------- Actions: free → download; paid → PayPal ----------
    const btn = document.getElementById('freebieDownloadBtn');
    const lbl = document.getElementById('freebieDownloadLabel');
    const hint = document.getElementById('freebieHint');
    const paypalWrap = document.getElementById('freebiePaypalWrap');
    const paypalNote = document.getElementById('freebiePaypalNote');
    if (p.is_free) {
      if (paypalWrap) paypalWrap.style.display = 'none';
      if (btn) btn.style.display = '';
      const loggedIn = isLoggedIn();
      if (lbl) lbl.textContent = loggedIn ? 'Descargar ahora' : 'Crear cuenta para descargar';
      if (hint) { hint.style.display = ''; hint.textContent = loggedIn
        ? (p.pdf_url ? 'El PDF se descarga al instante.' : 'Aún no hay PDF cargado. Avísanos por chat.')
        : 'Creamos tu cuenta en 30 segundos y descargas al volver. No spam.'; }
      if (btn) {
        btn.onclick = function (e) {
          e.preventDefault();
          if (!isLoggedIn()) {
            const next = encodeURIComponent(location.pathname + location.search);
            location.href = 'cuenta.html?next=' + next + '&download=' + encodeURIComponent(p.id);
            return;
          }
          if (!p.pdf_url) return;
          triggerDownload(p.pdf_url, suggestedFilename(p));
        };
      }
    } else {
      if (btn) btn.style.display = 'none';
      if (hint) hint.style.display = 'none';
      if (paypalWrap) paypalWrap.style.display = '';
      // Currency-conversion note (when display ccy differs from charge ccy)
      const note = (window.LogramoCurrency && LogramoCurrency.checkoutNote) ? LogramoCurrency.checkoutNote(p.price) : '';
      if (paypalNote) {
        if (note) { paypalNote.textContent = note; paypalNote.style.display = ''; }
        else { paypalNote.style.display = 'none'; }
      }
      // Render PayPal buttons (handles its own loading state)
      renderPayPalButtons(p);
    }
    showModal('popup-freebie-dl');
  }

  function suggestedFilename(p) {
    const base = (p.title || 'guia-logramo').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 80);
    return base + '.pdf';
  }
  function triggerDownload(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'guia.pdf';
    a.rel = 'noopener';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { a.remove(); }, 200);
  }

  async function fetchProduct(productId) {
    try {
      const r = await fetch(SB_URL + '/rest/v1/products?id=eq.' + encodeURIComponent(productId) + '&select=*', {
        headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY }
      });
      if (!r.ok) return null;
      const arr = await r.json();
      return (Array.isArray(arr) && arr[0]) || null;
    } catch (_) { return null; }
  }

  async function openFreebieFor(productId) {
    const p = await fetchProduct(productId);
    if (p) openFreebieModal(p);
  }

  // Wire the full-screen image lightbox (modal cover images open it).
  setupLightbox();

  // Intercept clicks on any element marked data-freebie="<productId>"
  document.addEventListener('click', function (e) {
    const trigger = e.target.closest('[data-freebie]');
    if (!trigger) return;
    const id = trigger.getAttribute('data-freebie');
    if (!id) return;
    e.preventDefault();
    openFreebieFor(id);
  });

  // Closes the modal AND pops the URL back to where the visitor came from
  // (only if we pushed a history entry when opening it).
  function closeProductModal() {
    stopCoverCarousel();
    hideModal('popup-freebie-dl');
    try {
      if (history.state && history.state.logramoModal) history.back();
    } catch (_) {}
  }
  // X button closes — backdrop & Escape do nothing (avoid accidental dismissal).
  // We don't check the .open class here because the global handler in script.js
  // strips it first; we just check that the click is on a close-button inside
  // THIS overlay specifically.
  document.addEventListener('click', function (e) {
    const closeBtn = e.target.closest('[data-close-popup]');
    if (!closeBtn) return;
    if (!closeBtn.closest('#popup-freebie-dl')) return;
    closeProductModal();
  });
  // Browser back button closes the modal too — feels natural since the URL changed when it opened.
  window.addEventListener('popstate', function () {
    const overlay = document.getElementById('popup-freebie-dl');
    if (overlay && overlay.classList.contains('open')) {
      stopCoverCarousel();
      hideModal('popup-freebie-dl');
    }
  });

  // If we just came back from cuenta.html with ?download=<id>, auto-open + download
  (function autoResume() {
    const params = new URLSearchParams(location.search);
    const wantId = params.get('download');
    if (!wantId || !isLoggedIn()) return;
    openFreebieFor(wantId).then(function () {
      // Give the modal a beat to render, then click the download button
      setTimeout(function () {
        const btn = document.getElementById('freebieDownloadBtn');
        if (btn) btn.click();
        // Clean the URL so reloads don't re-trigger
        params.delete('download');
        const clean = location.pathname + (params.toString() ? '?' + params.toString() : '') + location.hash;
        history.replaceState(null, '', clean);
      }, 400);
    });
  })();

  window.openFreebieModal = openFreebieModal;
  window.openFreebieFor = openFreebieFor;
})();

/* ============ CHAT BUBBLE — randomized messages ============
   The bubble sits to the LEFT of the chat icon. Desktop users see it on
   hover (CSS). On mobile / touch (no hover), JS pulses the bubble in for a
   few seconds every ~25s with a fresh message each time. */
(function () {
  const bubble = document.getElementById('chatBubble');
  if (!bubble) return;

  const MESSAGES = [
    '¿Tu perro otra vez en el sofá? 😅',
    '¿Otra noche sin dormir? Cuéntanos',
    '¿En qué te ayudamos hoy? 🐾',
    '¿Te ladra a todo? Tranqui, estamos aquí',
    '¿Tu perrito haciendo de las suyas? 🙈',
    '¿Necesitas un consejo rápido?',
    '¿Cómo va con tu peludo? 🐶',
    '¿Pregunta canina? Aquí estamos',
    '¿Te muerde los zapatos? Pasa 😉',
    '¿Te tira de la correa? Hablemos 🐕',
    '¿Comida, paseo, sueño? Pregunta',
    '¿Algo que no entiendes? Cuéntanos',
  ];

  // Initial random message
  let i = Math.floor(Math.random() * MESSAGES.length);
  bubble.textContent = MESSAGES[i];

  // Rotate to a different random message — never repeats the current one
  function rotateMessage() {
    if (MESSAGES.length < 2) return;
    let next;
    do { next = Math.floor(Math.random() * MESSAGES.length); } while (next === i);
    i = next;
    bubble.textContent = MESSAGES[i];
  }

  // Rotate while bubble is hidden so the next reveal shows a fresh one too
  setInterval(rotateMessage, 18000);

  // Touch / no-hover devices: pulse the bubble in periodically.
  // We use matchMedia('(hover: none)') so desktops keep purely-on-hover behavior.
  const noHover = window.matchMedia && window.matchMedia('(hover: none)').matches;
  if (noHover) {
    function pulse() {
      // Only show if the chat panel isn't open
      const panel = document.getElementById('chatPanel');
      const panelOpen = panel && panel.classList && panel.classList.contains('open');
      if (panelOpen) return;
      rotateMessage();
      bubble.classList.add('is-visible');
      setTimeout(() => bubble.classList.remove('is-visible'), 4200);
    }
    // First pulse a bit after the page settles
    setTimeout(pulse, 6000);
    // Then every ~25s
    setInterval(pulse, 25000);
  }
})();
