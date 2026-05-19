/* ============================================================
   LOGRAMO — SHARED PARTIALS (icons, nav, footer, cart, chat, popups)
   Auto-injected into every page. Set <body data-page="home|biblioteca|blog|sobre">
   ============================================================ */

const PAGE = document.body.dataset.page || '';

/* ============ ICONS SPRITE ============ */
const ICONS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true"><defs>
  <symbol id="i-arrow-right" viewBox="0 0 24 24"><path d="M13 4l-2 2 4 4H3v4h12l-4 4 2 2 8-8z" fill="currentColor"/></symbol>
  <symbol id="i-arrow-down" viewBox="0 0 24 24"><path d="M20 11l-2-2-4 4V3h-4v10L6 9l-2 2 8 8z" fill="currentColor"/></symbol>
  <symbol id="i-cart" viewBox="0 0 24 24"><path d="M3 4h3l3 11h11l2-8H8" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" fill="none"/><circle cx="9" cy="20" r="2" fill="currentColor"/><circle cx="18" cy="20" r="2" fill="currentColor"/></symbol>
  <symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4.5" fill="currentColor"/><path d="M3 22c0-5 4-8 9-8s9 3 9 8" fill="currentColor"/></symbol>
  <symbol id="i-menu" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="3" rx="1.5" fill="currentColor"/><rect x="3" y="11" width="18" height="3" rx="1.5" fill="currentColor"/><rect x="3" y="17" width="18" height="3" rx="1.5" fill="currentColor"/></symbol>
  <symbol id="i-close" viewBox="0 0 24 24"><path d="M19 5L5 19M5 5l14 14" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></symbol>
  <symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12l5 5 9-11" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></symbol>
  <symbol id="i-check-circle" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M7 12l3.5 3.5L17 9" stroke="#FEFAE8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></symbol>
  <symbol id="i-star" viewBox="0 0 24 24"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21.1 7 14.2 2 9.3l6.9-1z" fill="currentColor"/></symbol>
  <symbol id="i-play" viewBox="0 0 24 24"><path d="M6 4l14 8-14 8z" fill="currentColor"/></symbol>
  <symbol id="i-heart" viewBox="0 0 24 24"><path d="M12 21l-1.5-1.4C4.3 14 1 11 1 7.5 1 4.5 3.5 2 6.5 2c1.7 0 3.4.8 4.5 2 1.1-1.2 2.8-2 4.5-2 3 0 5.5 2.5 5.5 5.5 0 3.5-3.3 6.5-9.5 12.1z" fill="currentColor"/></symbol>
  <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6" stroke="currentColor" stroke-width="3" fill="none"/><path d="M16 16l5 5" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></symbol>
  <symbol id="i-mail" viewBox="0 0 24 24"><path d="M4 5h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2z" fill="currentColor"/><path d="M3 7l9 6 9-6" stroke="#FEFAE8" stroke-width="2" fill="none"/></symbol>
  <symbol id="i-pdf" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="currentColor"/><path d="M14 2v6h6" fill="#FEFAE8" opacity=".5"/></symbol>
  <symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5l-9-4z" fill="currentColor"/></symbol>
  <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M12 6v6l4 2" stroke="#FEFAE8" stroke-width="2.5" stroke-linecap="round" fill="none"/></symbol>
  <symbol id="i-bell" viewBox="0 0 24 24"><path d="M12 2a6 6 0 00-6 6v4l-2 4h16l-2-4V8a6 6 0 00-6-6zm0 20a3 3 0 003-3h-6a3 3 0 003 3z" fill="currentColor"/></symbol>
  <symbol id="i-bookmark" viewBox="0 0 24 24"><path d="M5 3h14v18l-7-4-7 4z" fill="currentColor"/></symbol>
  <symbol id="i-chat" viewBox="0 0 24 24"><path d="M20 2H4a2 2 0 00-2 2v18l5-5h13a2 2 0 002-2V4a2 2 0 00-2-2z" fill="currentColor"/></symbol>
  <symbol id="i-grid" viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor"/><rect x="13" y="3" width="8" height="8" rx="2" fill="currentColor"/><rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor"/><rect x="13" y="13" width="8" height="8" rx="2" fill="currentColor"/></symbol>
  <symbol id="i-paw" viewBox="0 0 24 24"><circle cx="12" cy="15" r="5" fill="currentColor"/><circle cx="6" cy="9" r="2.5" fill="currentColor"/><circle cx="18" cy="9" r="2.5" fill="currentColor"/><circle cx="9" cy="5" r="2" fill="currentColor"/><circle cx="15" cy="5" r="2" fill="currentColor"/></symbol>
  <symbol id="i-book" viewBox="0 0 24 24"><path d="M4 3h7v17l-3-2-4 2zm9 0h7v17l-4-2-3 2z" fill="currentColor"/></symbol>
  <symbol id="i-leaf" viewBox="0 0 24 24"><path d="M19 3c-4 0-10 1-13 7 0 8 8 11 8 11s4-9 12-10c-1-5-4-8-7-8z" fill="currentColor"/></symbol>
  <symbol id="i-target" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><circle cx="12" cy="12" r="6" fill="#FEFAE8"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/></symbol>
  <symbol id="i-flame" viewBox="0 0 24 24"><path d="M12 2C9 5 6 8 6 13a6 6 0 0012 0c0-3-2-5-4-7 1 3-1 5-2 5s-2-3 0-9z" fill="currentColor"/></symbol>
  <symbol id="i-bone" viewBox="0 0 24 24"><path d="M6 7a3 3 0 011-6 3 3 0 013 3v1l4 4-4 4v1a3 3 0 01-3 3 3 3 0 01-1-6 3 3 0 010-4z" fill="currentColor"/></symbol>
  <symbol id="i-instagram" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor"/><circle cx="12" cy="12" r="4" fill="#FEFAE8"/><circle cx="17.5" cy="6.5" r="1.5" fill="#FEFAE8"/></symbol>
  <symbol id="i-facebook" viewBox="0 0 24 24"><path d="M22 12a10 10 0 10-11.5 9.95V15H8v-3h2.5V9.5c0-2.5 1.5-4 4-4H17v3h-2c-.5 0-1 .5-1 1V12h3v3h-3v6.95A10 10 0 0022 12z" fill="currentColor"/></symbol>
  <symbol id="i-tiktok" viewBox="0 0 24 24"><path d="M19.6 6.7a4.8 4.8 0 01-3.8-4.2V2h-3.4v13.7a2.9 2.9 0 11-2.9-2.9c.3 0 .6.1.9.1V9.4a6.3 6.3 0 105.4 6.3V8.8a8 8 0 004.8 1.6V7a4.8 4.8 0 01-1-.3z" fill="currentColor"/></symbol>
  <symbol id="i-youtube" viewBox="0 0 24 24"><path d="M21.6 7.2c-.2-.9-.9-1.5-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4c-.9.3-1.5.9-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.8c.2.9.9 1.5 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4c.9-.3 1.5-.9 1.8-1.8.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3z" fill="currentColor"/></symbol>
  <symbol id="i-whatsapp" viewBox="0 0 24 24"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l4.9-1.4A10 10 0 1012 2zm5.5 12.4c-.3-.2-1.8-.9-2-1-.3-.1-.5-.1-.7.1l-1 1.2c-.1.1-.3.2-.6 0-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.6-2.1-.2-.3 0-.4.1-.6L9.9 9c0-.2.1-.3.2-.4l.3-.5c.1-.2 0-.3 0-.5l-1-2.2c-.2-.5-.5-.4-.7-.5h-.5l-.6.1c-.2 0-.5.1-.8.3-.3.3-1 1-1 2.5s1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5 2.4 1 2.8.9 3.3.8.5-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.5-.4z" fill="currentColor"/></symbol>
  <symbol id="i-twitter" viewBox="0 0 24 24"><path d="M18.2 2.3h3.3l-7.2 8.3 8.5 11.2H16.2l-5.2-6.8-6 6.8H1.7l7.7-8.8L1.3 2.3h6.8l4.7 6.2z" fill="currentColor"/></symbol>

  <symbol id="logo-logramo" viewBox="0 0 193.55 28.54">
    <path d="M16.05,24.13c-2.59.2-5.16.38-7.71.55-2.56.17-5.13.34-7.71.49-.11-4.15-.2-8.28-.26-12.38C.29,8.7.17,4.57,0,.39c1.46-.02,2.89-.06,4.31-.13,1.41-.07,2.84-.15,4.27-.26-.24,1.61-.46,3.22-.67,4.84-.21,1.62-.36,3.25-.47,4.88-.09,1.37-.16,2.73-.21,4.09-.05,1.36-.1,2.72-.15,4.09,1.44.04,2.85.06,4.26.06s2.81.02,4.22.07l.49,6.1Z"/>
    <path d="M41.94,12.03v.51c0,.16-.01.33-.03.51-.02.3-.08.8-.16,1.5-.09.7-.21,1.42-.36,2.17-.15.75-.34,1.44-.55,2.07-.22.63-.46,1.03-.72,1.21-.13.09-.57.16-1.32.23s-1.66.13-2.74.2c-1.08.06-2.25.12-3.51.16-1.26.04-2.46.08-3.6.11-1.14.03-2.14.06-3,.08-.86.02-1.43.03-1.71.03h-.67c-.32,0-.65,0-.99-.02-.35-.01-.67-.03-.98-.05-.3-.02-.52-.05-.65-.1-.3-.11-.61-.29-.91-.54-.3-.25-.59-.53-.85-.85-.26-.31-.49-.64-.7-.98-.21-.34-.35-.66-.44-.96-.06-.24-.12-.6-.16-1.09s-.08-1-.1-1.53c-.02-.53-.04-1.05-.05-1.55-.01-.5-.02-.88-.02-1.14,0-.41.01-.98.03-1.71.02-.73.09-1.47.2-2.23.11-.76.27-1.47.47-2.14.21-.66.51-1.13.9-1.39.17-.11.5-.21.98-.29.48-.09,1.04-.16,1.7-.23.65-.06,1.35-.11,2.09-.15.74-.03,1.46-.05,2.17-.07.71-.01,1.36-.02,1.97-.02s1.1.01,1.47.03c.33.02.79.04,1.4.05.61.01,1.29.03,2.04.05.75.02,1.53.06,2.33.11.8.05,1.55.12,2.25.21s1.31.2,1.84.34c.53.14.89.31,1.06.51.28.3.51.76.69,1.37.17.61.31,1.26.41,1.94.1.68.16,1.36.2,2.02.03.66.05,1.2.05,1.61ZM35.03,12.72c0-.26-.01-.57-.03-.91-.02-.35-.05-.7-.1-1.06-.04-.36-.11-.71-.2-1.04-.09-.34-.2-.61-.33-.83-.17-.28-.51-.5-1.01-.65-.5-.15-1.05-.27-1.65-.34-.6-.08-1.19-.12-1.76-.15-.58-.02-1.01-.03-1.29-.03-.15,0-.42,0-.82.02-.39.01-.8.03-1.22.05-.42.02-.82.06-1.19.11-.37.05-.61.11-.72.18-.2.13-.35.33-.46.6-.11.27-.19.57-.24.9-.05.33-.09.65-.1.96-.01.32-.02.57-.02.77s.02.55.05,1.06.08,1.05.13,1.63c.05.58.12,1.1.21,1.58.09.48.2.78.33.91.15.17.44.32.86.42.42.11.88.2,1.37.28.49.08.96.13,1.42.16s.78.05.98.05c.35,0,.76-.01,1.24-.03.48-.02.96-.08,1.45-.16.49-.09.95-.21,1.39-.36.43-.15.78-.36,1.04-.62.15-.15.27-.38.36-.69.09-.3.15-.63.2-.98.04-.35.07-.69.08-1.03.01-.34.02-.6.02-.8Z"/>
    <path d="M66.73,13.4c0,.91,0,1.82-.02,2.72-.01.9-.02,1.81-.02,2.72-.02.48-.03.97-.02,1.47.01.5,0,1-.05,1.5-.07.48-.13.98-.2,1.52s-.17,1.06-.33,1.58c-.15.52-.35,1.01-.6,1.47s-.58.85-.99,1.17c-.11.09-.33.16-.65.23s-.71.13-1.14.2c-.44.06-.9.12-1.4.16-.5.04-.98.08-1.44.11-.46.03-.87.07-1.24.1-.37.03-.63.05-.78.05-1.37.04-2.72.08-4.06.1-1.34.02-2.69.03-4.06.03h-2.09c-.04-.37-.09-.75-.13-1.14-.04-.39-.06-.78-.06-1.17,0-.44-.04-.89-.13-1.35-.09-.47-.19-.93-.29-1.39l2.15.03c.13,0,.49,0,1.09-.02.6-.01,1.3-.02,2.1-.03.8-.01,1.67-.03,2.59-.07.92-.03,1.78-.08,2.56-.15.78-.07,1.45-.14,2.01-.23.55-.09.86-.18.93-.29.17-.28.28-.6.33-.96.04-.36.06-.7.06-1.03,0-.17,0-.35-.02-.54-.01-.18-.03-.36-.05-.54-1.22.09-2.42.16-3.62.23-1.2.07-2.41.1-3.65.1h-1.06c-.42,0-.86-.01-1.3-.03-.45-.02-.88-.05-1.3-.1-.42-.04-.77-.11-1.03-.2-.44-.13-.88-.28-1.32-.44-.45-.16-.86-.36-1.26-.6-.39-.24-.73-.53-1.03-.86-.29-.34-.49-.74-.6-1.22-.07-.24-.1-.5-.11-.78-.01-.28-.02-.54-.02-.78,0-.61.03-1.38.1-2.32.07-.93.18-1.89.34-2.85.16-.97.38-1.88.65-2.74.27-.86.61-1.51,1.03-1.94.24-.26.62-.49,1.16-.69.53-.2,1.14-.36,1.81-.49.67-.13,1.39-.24,2.14-.34.75-.1,1.48-.17,2.2-.21.72-.04,1.37-.08,1.97-.1.6-.02,1.07-.03,1.42-.03,1.22,0,2.44.03,3.65.1l.23-2.09,5.48.81c.02,1.89.04,3.77.05,5.64.01,1.87.02,3.76.02,5.67ZM60.96,12.78c0-.7-.01-1.37-.03-2.04-.02-.66-.05-1.34-.1-2.04-.96-.22-1.91-.39-2.87-.52-.96-.13-1.94-.2-2.94-.2-.17,0-.44.01-.78.03-.35.02-.71.06-1.09.11-.38.05-.73.13-1.06.23s-.55.21-.68.34c-.2.22-.32.47-.36.75-.04.28-.07.57-.07.85,0,.24.03.6.08,1.09s.12.99.21,1.52c.09.52.2,1.01.33,1.47.13.46.26.77.39.95.13.17.29.3.49.39s.41.15.64.18c.23.03.46.05.69.07.23.01.43.02.6.02.43,0,.96-.02,1.58-.05s1.24-.09,1.86-.18,1.2-.21,1.75-.38c.54-.16.96-.39,1.24-.67.04-.02.08-.13.1-.33.02-.2.03-.4.03-.62v-.98Z"/>
    <path d="M89.26,11.19v.75l-6.29.29c.07-.28.1-.61.1-.98,0-.54-.08-.9-.23-1.06-.15-.16-.49-.24-1.01-.24-.74,0-1.56.13-2.45.39-.89.26-1.67.51-2.35.75-.11.96-.2,1.91-.26,2.87-.07.96-.1,1.91-.1,2.87,0,1.07,0,2.13.02,3.18.01,1.05.03,2.11.05,3.18l-5.61.36c-.11-1.39-.22-2.78-.33-4.16-.11-1.38-.21-2.77-.29-4.16-.11-1.85-.25-3.69-.42-5.53-.17-1.84-.35-3.69-.52-5.56,1.24.09,2.47.21,3.7.38,1.23.16,2.46.36,3.7.6l-.16,2.74c.65-.52,1.28-.97,1.88-1.35.6-.38,1.21-.7,1.83-.96.62-.26,1.28-.45,1.97-.57s1.47-.18,2.32-.18c.56,0,1.15.06,1.76.18.61.12,1.13.4,1.57.83.22.24.4.6.55,1.08.15.48.27.98.36,1.52.09.53.15,1.05.18,1.57.03.51.05.92.05,1.22Z"/>
    <path d="M114.05,10.24c0,1.83-.06,3.64-.2,5.45-.13,1.8-.26,3.61-.39,5.41-2.44.22-4.86.4-7.27.55-2.41.15-4.84.23-7.27.23-.22,0-.62,0-1.21-.02-.59-.01-1.21-.03-1.86-.06-.65-.03-1.27-.08-1.86-.13-.59-.05-.98-.14-1.17-.24-.72-.39-1.22-.89-1.5-1.48-.28-.6-.42-1.28-.42-2.04,0-.26.01-.61.03-1.04.02-.43.07-.89.13-1.37.06-.48.15-.92.26-1.34.11-.41.24-.72.39-.91.2-.26.64-.48,1.34-.67.7-.18,1.53-.33,2.5-.44.97-.11,2.01-.2,3.13-.26,1.12-.06,2.19-.11,3.21-.15,1.02-.03,1.93-.05,2.74-.05h1.73c.07-.48.1-.95.1-1.4v-.34c0-.18-.01-.3-.03-.34-.07-.13-.27-.24-.62-.33-.35-.09-.78-.15-1.29-.2-.51-.04-1.07-.08-1.66-.11-.6-.03-1.18-.05-1.74-.05h-2.45c-1.37,0-2.74.03-4.11.08-1.37.05-2.74.1-4.11.15.09-.83.16-1.66.21-2.51.05-.85.06-1.69.02-2.51,1.59-.28,3.18-.48,4.78-.6,1.6-.12,3.21-.18,4.84-.18.59,0,1.23,0,1.92.02.7.01,1.39.03,2.09.07.7.03,1.39.08,2.07.15.68.07,1.32.15,1.91.26.61.11,1.21.31,1.81.59.6.28,1.16.63,1.68,1.04.52.41.98.89,1.37,1.42.39.53.67,1.1.85,1.71.02.07.04.17.05.33.01.15.02.32.02.51v.83ZM106.78,17.9v-4.17c-.63-.02-1.26-.04-1.89-.05-.63-.01-1.26-.02-1.89-.02-.13,0-.5,0-1.09.02-.6.01-1.24.04-1.92.08-.68.04-1.31.1-1.88.16-.57.07-.89.16-.98.29-.11.17-.18.35-.21.54-.03.19-.05.38-.05.57,0,.15.01.36.03.62.02.26.06.53.11.82.05.28.11.54.18.78.06.24.15.41.26.52.09.11.23.19.44.24.21.05.43.1.67.13.24.03.48.05.72.06.24.01.42.02.55.02.52,0,1.08-.02,1.68-.07.6-.04,1.21-.09,1.83-.15s1.22-.12,1.81-.2c.59-.08,1.13-.15,1.63-.21Z"/>
    <path d="M148.36,16.7c0,.91-.02,1.81-.05,2.69-.03.88-.09,1.77-.18,2.66-.91.04-1.79.09-2.63.15-.84.05-1.71.17-2.63.34.26-1.57.39-3.14.39-4.73,0-.28-.02-.77-.07-1.45-.04-.68-.1-1.4-.18-2.15-.08-.75-.17-1.44-.29-2.07-.12-.63-.26-1.04-.41-1.24-.11-.13-.27-.23-.49-.29-.22-.06-.45-.11-.69-.15s-.48-.05-.72-.07c-.24-.01-.44-.02-.59-.02-.26,0-.57.01-.93.03s-.72.06-1.09.11c-.37.05-.72.14-1.06.24-.34.11-.61.24-.83.39-.11.09-.2.32-.28.68-.08.37-.14.82-.18,1.34s-.08,1.09-.11,1.7c-.03.61-.06,1.18-.08,1.71-.02.53-.03,1-.03,1.4v.77c0,1.44.03,2.87.1,4.31-.63.02-1.24.04-1.84.07s-1.21.03-1.84.03h-.26c-.11,0-.22-.01-.33-.03-.13,0-.26-.01-.39-.03v-2.38c0-.67-.01-1.37-.03-2.09-.02-.72-.04-1.35-.07-1.89-.02-.37-.05-.85-.1-1.44-.04-.59-.14-1.16-.29-1.71-.15-.55-.38-1.03-.67-1.44s-.7-.6-1.22-.6c-.24,0-.56.04-.96.11-.4.08-.82.17-1.24.29-.42.12-.81.26-1.17.42-.36.16-.61.33-.77.51-.04.04-.09.29-.15.73-.05.45-.1.99-.15,1.63-.04.64-.09,1.34-.15,2.09-.05.75-.1,1.45-.13,2.1-.03.65-.06,1.21-.1,1.68-.03.47-.05.75-.05.83-.44.04-.88.08-1.32.11-.45.03-.89.05-1.32.05s-.83-.01-1.24-.03c-.41-.02-.82-.05-1.21-.1-.11-2.76-.27-5.49-.47-8.19-.21-2.7-.43-5.42-.67-8.19.61-.07,1.21-.12,1.81-.18s1.2-.08,1.81-.08,1.17.01,1.76.03c.59.02,1.19.04,1.79.07l-.42,2.8c1-.8,1.96-1.4,2.89-1.79.92-.39,2.03-.59,3.31-.59.5,0,.94.06,1.32.18.38.12.73.28,1.04.49.31.21.62.45.93.73.3.28.63.59.98.91.39-.61.84-1.09,1.35-1.45.51-.36,1.06-.64,1.65-.83s1.21-.32,1.86-.38c.65-.05,1.3-.08,1.96-.08.52,0,1.07.02,1.65.05.58.03,1.13.13,1.66.28.53.15,1.02.38,1.45.69.44.3.77.72,1.01,1.24.28.63.51,1.33.69,2.09.17.76.31,1.54.41,2.35.1.8.16,1.6.2,2.38s.05,1.51.05,2.19Z"/>
    <path d="M175.95,12.03v.51c0,.16-.01.33-.03.51-.02.3-.08.8-.16,1.5-.09.7-.21,1.42-.36,2.17-.15.75-.34,1.44-.55,2.07-.22.63-.46,1.03-.72,1.21-.13.09-.57.16-1.32.23s-1.66.13-2.74.2c-1.08.06-2.25.12-3.51.16-1.26.04-2.46.08-3.6.11-1.14.03-2.14.06-3,.08-.86.02-1.43.03-1.71.03h-.67c-.32,0-.65,0-.99-.02-.35-.01-.67-.03-.98-.05-.3-.02-.52-.05-.65-.1-.3-.11-.61-.29-.91-.54-.3-.25-.59-.53-.85-.85-.26-.31-.49-.64-.7-.98-.21-.34-.35-.66-.44-.96-.06-.24-.12-.6-.16-1.09s-.08-1-.1-1.53c-.02-.53-.04-1.05-.05-1.55-.01-.5-.02-.88-.02-1.14,0-.41.01-.98.03-1.71.02-.73.09-1.47.2-2.23.11-.76.27-1.47.47-2.14.21-.66.51-1.13.9-1.39.17-.11.5-.21.98-.29.48-.09,1.04-.16,1.7-.23.65-.06,1.35-.11,2.09-.15.74-.03,1.46-.05,2.17-.07.71-.01,1.36-.02,1.97-.02s1.1.01,1.47.03c.33.02.79.04,1.4.05.61.01,1.29.03,2.04.05.75.02,1.53.06,2.33.11.8.05,1.55.12,2.25.21s1.31.2,1.84.34c.53.14.89.31,1.06.51.28.3.51.76.69,1.37.17.61.31,1.26.41,1.94.1.68.16,1.36.2,2.02.03.66.05,1.2.05,1.61ZM169.04,12.72c0-.26-.01-.57-.03-.91-.02-.35-.05-.7-.1-1.06-.04-.36-.11-.71-.2-1.04-.09-.34-.2-.61-.33-.83-.17-.28-.51-.5-1.01-.65-.5-.15-1.05-.27-1.65-.34-.6-.08-1.19-.12-1.76-.15-.58-.02-1.01-.03-1.29-.03-.15,0-.42,0-.82.02-.39.01-.8.03-1.22.05-.42.02-.82.06-1.19.11-.37.05-.61.11-.72.18-.2.13-.35.33-.46.6-.11.27-.19.57-.24.9-.05.33-.09.65-.1.96-.01.32-.02.57-.02.77s.02.55.05,1.06.08,1.05.13,1.63c.05.58.12,1.1.21,1.58.09.48.2.78.33.91.15.17.44.32.86.42.42.11.88.2,1.37.28.49.08.96.13,1.42.16s.78.05.98.05c.35,0,.76-.01,1.24-.03.48-.02.96-.08,1.45-.16.49-.09.95-.21,1.39-.36.43-.15.78-.36,1.04-.62.15-.15.27-.38.36-.69.09-.3.15-.63.2-.98.04-.35.07-.69.08-1.03.01-.34.02-.6.02-.8Z"/>
  </symbol>

  <symbol id="illo-paw" viewBox="0 0 80 80"><circle cx="40" cy="52" r="20" fill="#C55932"/><ellipse cx="20" cy="28" rx="9" ry="11" fill="#F6D055"/><ellipse cx="32" cy="18" rx="8" ry="10" fill="#FFCDB8"/><ellipse cx="48" cy="18" rx="8" ry="10" fill="#B5C1AB"/><ellipse cx="60" cy="28" rx="9" ry="11" fill="#ADCBEF"/></symbol>
  <symbol id="illo-book" viewBox="0 0 80 80"><rect x="12" y="12" width="56" height="56" rx="6" fill="#3C4824" stroke="#1E2820" stroke-width="2"/><rect x="18" y="18" width="44" height="44" rx="3" fill="#FEFAE8"/><rect x="24" y="28" width="32" height="4" rx="2" fill="#3C4824"/><rect x="24" y="38" width="24" height="4" rx="2" fill="#C55932"/><rect x="24" y="46" width="28" height="4" rx="2" fill="#3C4824" opacity=".3"/></symbol>
  <symbol id="illo-heart" viewBox="0 0 80 80"><path d="M40 68 L14 40 C8 32 8 22 16 16 C24 10 32 14 40 22 C48 14 56 10 64 16 C72 22 72 32 66 40 Z" fill="#C65768" stroke="#1E2820" stroke-width="2"/></symbol>
  <symbol id="illo-star" viewBox="0 0 80 80"><path d="M40 8 L48 30 L72 30 L52 44 L60 68 L40 54 L20 68 L28 44 L8 30 L32 30 Z" fill="#F6D055" stroke="#1E2820" stroke-width="2"/></symbol>
</defs></svg>`;

/* ============ NAV ============ */
const NAV_HTML = `
<nav class="nav" id="mainNav">
  <div class="container nav__inner">
    <a href="index.html" class="nav__logo" aria-label="Logramo">
      <svg width="130" height="22" viewBox="0 0 193.55 28.54"><use href="#logo-logramo"/></svg>
    </a>
    <ul class="nav__links">
      <li><a href="index.html" data-link="home">Inicio</a></li>
      <li><a href="biblioteca.html" data-link="biblioteca">Biblioteca</a></li>
      <li><a href="blog.html" data-link="blog">Blog</a></li>
      <li><a href="sobre-nosotros.html" data-link="sobre">Sobre Nosotros</a></li>
    </ul>
    <div class="nav__actions">
      <a href="#" class="nav__btn" aria-label="Mi cuenta" title="Mi cuenta">
        <svg class="icon"><use href="#i-user"/></svg>
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
    <a href="index.html" class="nav__logo">
      <svg width="120" height="20" viewBox="0 0 193.55 28.54"><use href="#logo-logramo"/></svg>
    </a>
    <button class="mobile-nav__close" id="menuClose" aria-label="Cerrar"><svg class="icon"><use href="#i-close"/></svg></button>
  </div>
  <ul class="mobile-nav__links">
    <li><a href="index.html">Inicio <svg class="icon"><use href="#i-arrow-right"/></svg></a></li>
    <li><a href="biblioteca.html">Biblioteca <svg class="icon"><use href="#i-arrow-right"/></svg></a></li>
    <li><a href="blog.html">Blog <svg class="icon"><use href="#i-arrow-right"/></svg></a></li>
    <li><a href="sobre-nosotros.html">Sobre Nosotros <svg class="icon"><use href="#i-arrow-right"/></svg></a></li>
  </ul>
</div>`;

/* ============ FOOTER ============ */
const FOOTER_HTML = `
<div class="footer-wrap">
  <footer class="footer">
    <div class="footer__inner">
      <div>
        <div class="footer__brand-logo"><svg width="150" height="24" viewBox="0 0 193.55 28.54"><use href="#logo-logramo"/></svg></div>
        <p class="footer__brand-desc">Tu lugar favorito sobre perros. Guías reales, consejos honestos y una comunidad que entiende lo que es criar un perro desde cero.</p>
        <div class="footer__social">
          <a href="#" class="footer__social-link" aria-label="Instagram"><svg class="icon"><use href="#i-instagram"/></svg></a>
          <a href="#" class="footer__social-link" aria-label="Facebook"><svg class="icon"><use href="#i-facebook"/></svg></a>
          <a href="#" class="footer__social-link" aria-label="TikTok"><svg class="icon"><use href="#i-tiktok"/></svg></a>
          <a href="#" class="footer__social-link" aria-label="YouTube"><svg class="icon"><use href="#i-youtube"/></svg></a>
        </div>
      </div>
      <div class="footer__col">
        <h4>Explorar</h4>
        <ul>
          <li><a href="index.html">Inicio</a></li>
          <li><a href="biblioteca.html">Biblioteca</a></li>
          <li><a href="blog.html">Blog</a></li>
          <li><a href="sobre-nosotros.html">Sobre nosotros</a></li>
        </ul>
      </div>
      <div class="footer__col">
        <h4>Temas</h4>
        <ul>
          <li><a href="biblioteca.html#educacion">Educación</a></li>
          <li><a href="biblioteca.html#salud">Salud</a></li>
          <li><a href="biblioteca.html#conducta">Conducta</a></li>
          <li><a href="biblioteca.html#cachorros">Cachorros</a></li>
        </ul>
      </div>
      <div class="footer__col">
        <h4>Legal</h4>
        <ul>
          <li><a href="#">Privacidad</a></li>
          <li><a href="#">Términos</a></li>
          <li><a href="#">Cookies</a></li>
          <li><a href="#">Contacto</a></li>
        </ul>
      </div>
    </div>
    <div class="footer__bottom">
      <span>© 2026 Logramo · Todos los derechos reservados</span>
      <span>Hecho con corazón para perros y sus personas</span>
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
    <div class="cart-total"><span>Total</span><span id="cartTotal">€0.00</span></div>
    <button class="btn btn--primary btn--lg full-w" onclick="checkout()">Ir al pago <svg class="icon"><use href="#i-arrow-right"/></svg></button>
  </div>
</div>`;

const CHAT_HTML = `
<div class="chat-btn">
  <div class="chat-btn__bubble">¿Necesitas ayuda?</div>
  <button class="chat-btn__trigger" id="chatToggle" aria-label="Abrir chat"><svg class="icon"><use href="#i-chat"/></svg></button>
</div>
<div class="chat-panel" id="chatPanel">
  <div class="chat-panel__header">
    <div class="chat-panel__avatar"><svg class="icon"><use href="#i-paw"/></svg></div>
    <div><div class="chat-panel__name">Logramo</div><div class="chat-panel__status">● Online</div></div>
  </div>
  <div class="chat-panel__body" id="chatBody">
    <div class="chat-msg chat-msg--bot">¡Hola! ¿En qué te puedo ayudar?</div>
  </div>
  <div class="chat-panel__options">
    <button class="chat-panel__option" onclick="chatOption('Tengo un cachorro nuevo')">Tengo un cachorro nuevo</button>
    <button class="chat-panel__option" onclick="chatOption('Mi perro tiene un problema de conducta')">Problema de conducta</button>
    <button class="chat-panel__option" onclick="chatOption('Quiero saber más sobre los libros')">Info sobre los libros</button>
  </div>
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

/* Mark active nav link */
const linkMap = { home: 'home', biblioteca: 'biblioteca', blog: 'blog', sobre: 'sobre' };
const currentLink = linkMap[PAGE];
if (currentLink) {
  document.querySelectorAll(`[data-link="${currentLink}"]`).forEach(a => a.classList.add('active'));
}
