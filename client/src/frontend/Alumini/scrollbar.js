import './scrollbar.css';

const scrollbarStyles = `
/* ================================================================= */
/* UNIFIED MOBILE & DESKTOP HIGHLIGHTED BLUE SCROLLBAR EXPERIENCE    */
/* ================================================================= */

/* Remove overlapping root window scrollbars on HTML/Body to prevent double scrollbars */
body.theme-alumni::-webkit-scrollbar {
  width: 0px !important;
  height: 0px !important;
  display: none !important;
}

body.theme-alumni {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

/* Unified Custom 6px Blue Overlay Scrollbar for Desktop and Mobile containers */
body.theme-alumni ::-webkit-scrollbar,
body.theme-alumni .mainContent::-webkit-scrollbar,
body.theme-alumni .contentArea::-webkit-scrollbar,
body.theme-alumni .mailContainer::-webkit-scrollbar,
body.theme-alumni .customScrollbar::-webkit-scrollbar,
body.theme-alumni .tableWrapper::-webkit-scrollbar,
body.theme-alumni .mainScrollable::-webkit-scrollbar,
body.theme-alumni .customSidebarScrollbar::-webkit-scrollbar {
  width: 6px !important;
  height: 6px !important;
  display: block !important;
}

body.theme-alumni ::-webkit-scrollbar-button,
body.theme-alumni ::-webkit-scrollbar-button:single-button,
body.theme-alumni ::-webkit-scrollbar-button:vertical:decrement,
body.theme-alumni ::-webkit-scrollbar-button:vertical:increment,
body.theme-alumni ::-webkit-scrollbar-button:horizontal:decrement,
body.theme-alumni ::-webkit-scrollbar-button:horizontal:increment,
body.theme-alumni ::-webkit-scrollbar-button:start,
body.theme-alumni ::-webkit-scrollbar-button:end,
body.theme-alumni ::-webkit-scrollbar-button:vertical:start:decrement,
body.theme-alumni ::-webkit-scrollbar-button:vertical:end:increment,
body.theme-alumni ::-webkit-scrollbar-button:horizontal:start:decrement,
body.theme-alumni ::-webkit-scrollbar-button:horizontal:end:increment,
body.theme-alumni *::-webkit-scrollbar-button,
body.theme-alumni *::-webkit-scrollbar-button:single-button,
body.theme-alumni *::-webkit-scrollbar-button:vertical:decrement,
body.theme-alumni *::-webkit-scrollbar-button:vertical:increment,
body.theme-alumni *::-webkit-scrollbar-button:horizontal:decrement,
body.theme-alumni *::-webkit-scrollbar-button:horizontal:increment,
body.theme-alumni *::-webkit-scrollbar-button:start,
body.theme-alumni *::-webkit-scrollbar-button:end,
body.theme-alumni *::-webkit-scrollbar-button:vertical:start:decrement,
body.theme-alumni *::-webkit-scrollbar-button:vertical:end:increment,
body.theme-alumni *::-webkit-scrollbar-button:horizontal:start:decrement,
body.theme-alumni *::-webkit-scrollbar-button:horizontal:end:increment,
body.theme-alumni .mainContent::-webkit-scrollbar-button,
body.theme-alumni .contentArea::-webkit-scrollbar-button,
body.theme-alumni .mailContainer::-webkit-scrollbar-button,
body.theme-alumni .customScrollbar::-webkit-scrollbar-button,
body.theme-alumni .tableWrapper::-webkit-scrollbar-button,
body.theme-alumni .mainScrollable::-webkit-scrollbar-button,
body.theme-alumni .customSidebarScrollbar::-webkit-scrollbar-button {
  display: none !important;
  width: 0px !important;
  height: 0px !important;
  background: transparent !important;
  border: none !important;
  margin: 0 !important;
  padding: 0 !important;
}

body.theme-alumni ::-webkit-scrollbar-corner,
body.theme-alumni *::-webkit-scrollbar-corner,
body.theme-alumni .mainContent::-webkit-scrollbar-corner,
body.theme-alumni .contentArea::-webkit-scrollbar-corner,
body.theme-alumni .mailContainer::-webkit-scrollbar-corner,
body.theme-alumni .customScrollbar::-webkit-scrollbar-corner,
body.theme-alumni .tableWrapper::-webkit-scrollbar-corner,
body.theme-alumni .mainScrollable::-webkit-scrollbar-corner,
body.theme-alumni .customSidebarScrollbar::-webkit-scrollbar-corner {
  background: transparent !important;
  display: none !important;
  width: 0px !important;
  height: 0px !important;
}

body.theme-alumni ::-webkit-scrollbar-track,
body.theme-alumni .mainContent::-webkit-scrollbar-track,
body.theme-alumni .contentArea::-webkit-scrollbar-track,
body.theme-alumni .mailContainer::-webkit-scrollbar-track,
body.theme-alumni .customScrollbar::-webkit-scrollbar-track,
body.theme-alumni .tableWrapper::-webkit-scrollbar-track,
body.theme-alumni .mainScrollable::-webkit-scrollbar-track,
body.theme-alumni .customSidebarScrollbar::-webkit-scrollbar-track {
  background: transparent !important;
  background-color: transparent !important;
  border-radius: 0 !important;
  margin: 0 !important;
}

body.theme-alumni ::-webkit-scrollbar-thumb,
body.theme-alumni .mainContent::-webkit-scrollbar-thumb,
body.theme-alumni .contentArea::-webkit-scrollbar-thumb,
body.theme-alumni .mailContainer::-webkit-scrollbar-thumb,
body.theme-alumni .customScrollbar::-webkit-scrollbar-thumb,
body.theme-alumni .tableWrapper::-webkit-scrollbar-thumb,
body.theme-alumni .mainScrollable::-webkit-scrollbar-thumb,
body.theme-alumni .customSidebarScrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #0084D6 0%, #0051CC 100%) !important;
  border-radius: 10px !important;
  border: none !important;
  box-shadow: 0 0 8px rgba(0, 132, 214, 0.9), inset 0 0 4px rgba(255, 255, 255, 0.5) !important;
  transition: all 0.2s ease-in-out !important;
}

body.theme-alumni ::-webkit-scrollbar-thumb:hover,
body.theme-alumni .mainContent::-webkit-scrollbar-thumb:hover,
body.theme-alumni .contentArea::-webkit-scrollbar-thumb:hover,
body.theme-alumni .mailContainer::-webkit-scrollbar-thumb:hover,
body.theme-alumni .customScrollbar::-webkit-scrollbar-thumb:hover,
body.theme-alumni .tableWrapper::-webkit-scrollbar-thumb:hover,
body.theme-alumni .mainScrollable::-webkit-scrollbar-thumb:hover,
body.theme-alumni .customSidebarScrollbar::-webkit-scrollbar-thumb:hover,
body.theme-alumni ::-webkit-scrollbar-thumb:active {
  background: linear-gradient(180deg, #0069D9 0%, #003D99 100%) !important;
  box-shadow: 0 0 10px rgba(0, 132, 214, 1.0), inset 0 0 6px rgba(255, 255, 255, 0.7) !important;
}

/* Firefox & Generic Touch Styling */
body.theme-alumni,
body.theme-alumni *,
body.theme-alumni .mainContent,
body.theme-alumni .contentArea,
body.theme-alumni .mailContainer,
body.theme-alumni .customScrollbar,
body.theme-alumni .tableWrapper,
body.theme-alumni .mainScrollable,
body.theme-alumni .customSidebarScrollbar {
  -webkit-overflow-scrolling: touch !important;
  scrollbar-color: #0084D6 transparent !important;
  scrollbar-width: thin !important;
}
`;

if (typeof document !== 'undefined') {
  let styleEl = document.getElementById('alumni-scrollbar-styles');
  if (styleEl) {
    styleEl.textContent = scrollbarStyles;
  } else {
    styleEl = document.createElement('style');
    styleEl.id = 'alumni-scrollbar-styles';
    styleEl.textContent = scrollbarStyles;
    document.head.appendChild(styleEl);
  }
}

export default scrollbarStyles;
