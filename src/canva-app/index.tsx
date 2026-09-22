import React from 'react';
import { createRoot } from 'react-dom/client';
import { CanvaFieldSyncApp } from './CanvaFieldSyncApp';
import cssContent from '../index.css?inline';

// 1. Inject compiled Tailwind CSS directly into Canva sandbox head
if (typeof document !== 'undefined') {
  let styleEl = document.getElementById('a1print-canva-styles') as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'a1print-canva-styles';
    styleEl.textContent = cssContent;
    document.head.appendChild(styleEl);
  } else {
    styleEl.textContent = cssContent;
  }
}

// 2. Register Design Editor intent to satisfy Canva runtime
(async () => {
  try {
    const intentsModule = await (Function('return import("@canva/intents/design")')().catch(() => null));
    if (intentsModule && typeof intentsModule.prepareDesignEditor === 'function') {
      intentsModule.prepareDesignEditor({
        render: async () => {},
      });
    }
  } catch (err) {
    // Graceful fallback in environments where intents module is optional
  }
})();

// 3. Ensure container exists in Canva's sandbox DOM
let rootEl = document.getElementById('root');
if (!rootEl) {
  rootEl = document.createElement('div');
  rootEl.id = 'root';
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.overflowX = 'hidden';
  document.body.appendChild(rootEl);
}

const root = createRoot(rootEl);
root.render(
  <React.StrictMode>
    <CanvaFieldSyncApp />
  </React.StrictMode>
);

