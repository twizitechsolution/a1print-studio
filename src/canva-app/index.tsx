import React from 'react';
import { createRoot } from 'react-dom/client';
import { CanvaFieldSyncApp } from './CanvaFieldSyncApp';
import '../index.css';

// Ensure container exists in Canva's sandbox DOM
let rootEl = document.getElementById('root');
if (!rootEl) {
  rootEl = document.createElement('div');
  rootEl.id = 'root';
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.overflow = 'hidden';
  document.body.appendChild(rootEl);
}

const root = createRoot(rootEl);
root.render(
  <React.StrictMode>
    <CanvaFieldSyncApp />
  </React.StrictMode>
);
